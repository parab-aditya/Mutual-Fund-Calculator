import { GoogleGenerativeAI } from '@google/generative-ai';

// Types for the API
interface OptimizationSolution {
    fiAge: number;
    stepUpPercent: number;
    sipIncreasePercent: number;
    newMonthlySip: number;
    improvementYears: number;
}

type DifficultyLevel = 'Easy' | 'Moderate' | 'Aggressive';

interface AIRecommendation {
    recommendedIndex: number;
    explanation: string;
    alternatives: string[];
    difficulty: DifficultyLevel;
}

interface RequestBody {
    baselineFiAge: number;
    solutions: OptimizationSolution[];
    preferences: {
        preferLowerStepUp: boolean;
        preferLowerSipIncrease: boolean;
        targetAge: number;
    };
}

// Build the prompt for Gemini
const buildPrompt = (
    baselineFiAge: number,
    solutions: OptimizationSolution[],
    preferences: { preferLowerStepUp: boolean; preferLowerSipIncrease: boolean; targetAge: number }
): string => {
    const solutionsData = solutions.map((s, index) => ({
        index,
        fiAge: s.fiAge,
        stepUpPercent: s.stepUpPercent,
        sipIncreasePercent: s.sipIncreasePercent,
        newMonthlySip: s.newMonthlySip,
        improvementYears: s.improvementYears
    }));

    return `You are a financial advisor AI. Analyze these financial independence (FI) optimization solutions and recommend the BEST one.

CONTEXT:
- Baseline FI Age (no changes): ${baselineFiAge} years
- Target FI Age: ${preferences.targetAge} years
- User prefers lower step-up: ${preferences.preferLowerStepUp}
- User prefers lower SIP increase: ${preferences.preferLowerSipIncrease}

AVAILABLE SOLUTIONS:
${JSON.stringify(solutionsData, null, 2)}

RANKING CRITERIA (in order of importance):
1. Lowest FI age (most important)
2. Lowest step-up percentage (preferred lever - easier to commit to)
3. Lowest SIP increase percentage (one-time change, but requires more money)

SPECIAL RULE:
If a solution reaches FI age ≤ ${preferences.targetAge} with only slightly more effort (1-2% higher step-up or SIP increase), prefer it over an easier plan that only reaches FI age 42-43.

INSTRUCTIONS:
1. Pick exactly ONE recommended solution from the list
2. Explain WHY in 2-3 sentences (be specific about trade-offs)
3. Mention 1-2 alternatives briefly
4. Do NOT invent new values - only use solutions from the list

RESPOND IN THIS EXACT JSON FORMAT (no markdown, just JSON):
{
    "recommendedIndex": <number>,
    "explanation": "<string>",
    "alternatives": ["<string>", "<string>"],
    "difficulty": "Easy" | "Moderate" | "Aggressive"
}

DIFFICULTY CRITERIA:
- Easy: Only step-up up to 5% OR only SIP increase up to 10%
- Moderate: Step-up 7-10% alone, or SIP increase 10-15% alone, or mild combinations
- Aggressive: Both high step-up (10%) and high SIP increase (10%+), or extreme values`;
};

// Calculate difficulty level
const calculateDifficulty = (stepUpPercent: number, sipIncreasePercent: number): DifficultyLevel => {
    if ((stepUpPercent <= 5 && sipIncreasePercent === 0) ||
        (stepUpPercent === 0 && sipIncreasePercent <= 10)) {
        return 'Easy';
    }

    if ((stepUpPercent >= 10 && sipIncreasePercent >= 10) ||
        stepUpPercent > 10 || sipIncreasePercent > 15) {
        return 'Aggressive';
    }

    return 'Moderate';
};

// Fallback recommendation when AI fails
const getFallbackRecommendation = (
    baselineFiAge: number,
    solutions: OptimizationSolution[],
    preferences: { preferLowerStepUp: boolean; preferLowerSipIncrease: boolean; targetAge: number }
): AIRecommendation => {
    if (solutions.length === 0) {
        return {
            recommendedIndex: -1,
            explanation: 'No optimization solutions available.',
            alternatives: [],
            difficulty: 'Easy'
        };
    }

    const scoredSolutions = solutions.map((solution, index) => {
        let score = 0;
        const fiAgeScore = (baselineFiAge - solution.fiAge) * 5;
        score += fiAgeScore;
        const stepUpPenalty = solution.stepUpPercent * 3;
        score -= stepUpPenalty;
        const sipIncreasePenalty = solution.sipIncreasePercent * 2;
        score -= sipIncreasePenalty;
        if (solution.fiAge <= preferences.targetAge) {
            score += 20;
        }
        return { index, solution, score };
    });

    scoredSolutions.sort((a, b) => b.score - a.score);

    const best = scoredSolutions[0];
    const alternatives: string[] = [];

    if (scoredSolutions.length > 1) {
        const second = scoredSolutions[1];
        if (second.solution.stepUpPercent === 0 && second.solution.sipIncreasePercent > 0) {
            alternatives.push(`${second.solution.sipIncreasePercent}% SIP increase alone reaches FI at ${second.solution.fiAge}`);
        } else if (second.solution.sipIncreasePercent === 0 && second.solution.stepUpPercent > 0) {
            alternatives.push(`${second.solution.stepUpPercent}% step-up alone reaches FI at ${second.solution.fiAge}`);
        } else {
            alternatives.push(`${second.solution.stepUpPercent}% step-up + ${second.solution.sipIncreasePercent}% SIP increase reaches FI at ${second.solution.fiAge}`);
        }
    }

    let explanation = '';
    if (best.solution.fiAge <= preferences.targetAge) {
        explanation = `This plan reaches your target FI age of ${preferences.targetAge} with a ${best.solution.stepUpPercent}% annual step-up and ${best.solution.sipIncreasePercent}% SIP increase.`;
    } else {
        explanation = `This plan reduces your FI age from ${baselineFiAge} to ${best.solution.fiAge} (${best.solution.improvementYears} years earlier).`;
    }

    const difficulty = calculateDifficulty(best.solution.stepUpPercent, best.solution.sipIncreasePercent);

    return {
        recommendedIndex: best.index,
        explanation,
        alternatives,
        difficulty
    };
};

// Parse AI response
const parseAIResponse = (response: string, solutions: OptimizationSolution[]): AIRecommendation => {
    try {
        let cleanResponse = response.trim();
        if (cleanResponse.startsWith('```json')) {
            cleanResponse = cleanResponse.slice(7);
        }
        if (cleanResponse.startsWith('```')) {
            cleanResponse = cleanResponse.slice(3);
        }
        if (cleanResponse.endsWith('```')) {
            cleanResponse = cleanResponse.slice(0, -3);
        }
        cleanResponse = cleanResponse.trim();

        const parsed = JSON.parse(cleanResponse);

        const recommendedIndex = parseInt(parsed.recommendedIndex, 10);
        if (isNaN(recommendedIndex) || recommendedIndex < 0 || recommendedIndex >= solutions.length) {
            throw new Error('Invalid recommended index');
        }

        const recommendedSolution = solutions[recommendedIndex];
        let difficulty: DifficultyLevel = parsed.difficulty;
        if (!['Easy', 'Moderate', 'Aggressive'].includes(difficulty)) {
            difficulty = calculateDifficulty(recommendedSolution.stepUpPercent, recommendedSolution.sipIncreasePercent);
        }

        return {
            recommendedIndex,
            explanation: parsed.explanation || 'This solution offers the best balance of FI age improvement with manageable behavior change.',
            alternatives: Array.isArray(parsed.alternatives) ? parsed.alternatives : [],
            difficulty
        };
    } catch (error) {
        console.error('Failed to parse AI response:', error);
        const fallbackSolution = solutions[0];
        return {
            recommendedIndex: 0,
            explanation: 'This solution offers significant improvement in your financial independence timeline.',
            alternatives: [],
            difficulty: calculateDifficulty(fallbackSolution.stepUpPercent, fallbackSolution.sipIncreasePercent)
        };
    }
};

// Vercel Serverless Function Handler
export default async function handler(req: Request): Promise<Response> {
    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json',
    };

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers });
    }

    if (req.method !== 'POST') {
        return new Response(
            JSON.stringify({ error: 'Method not allowed' }),
            { status: 405, headers }
        );
    }

    try {
        const body: RequestBody = await req.json();
        const { baselineFiAge, solutions, preferences } = body;

        // Validate request
        if (!solutions || !Array.isArray(solutions) || solutions.length === 0) {
            return new Response(
                JSON.stringify({ error: 'Invalid request: solutions array required' }),
                { status: 400, headers }
            );
        }

        // Get API key from environment (server-side, secure!)
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

        if (!GEMINI_API_KEY) {
            console.warn('[API] Gemini API key not configured, using fallback');
            const fallback = getFallbackRecommendation(baselineFiAge, solutions, preferences);
            return new Response(
                JSON.stringify({ recommendation: fallback, source: 'fallback' }),
                { status: 200, headers }
            );
        }

        console.log('[API] Calling Gemini API...');

        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });

        const prompt = buildPrompt(baselineFiAge, solutions, preferences);
        const result = await model.generateContent(prompt);
        const response = result.response.text();

        console.log('[API] Gemini API call successful');

        const recommendation = parseAIResponse(response, solutions);

        return new Response(
            JSON.stringify({ recommendation, source: 'gemini' }),
            { status: 200, headers }
        );
    } catch (error) {
        console.error('[API] Error:', error);

        // Try to use fallback
        try {
            const body: RequestBody = await req.json();
            const fallback = getFallbackRecommendation(
                body.baselineFiAge,
                body.solutions,
                body.preferences
            );
            return new Response(
                JSON.stringify({ recommendation: fallback, source: 'fallback', error: String(error) }),
                { status: 200, headers }
            );
        } catch {
            return new Response(
                JSON.stringify({ error: 'Failed to process request' }),
                { status: 500, headers }
            );
        }
    }
}
