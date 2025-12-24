/**
 * Gemini AI Service for Financial Independence Optimization
 * Uses Google Gemini API to intelligently rank optimization solutions
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { OptimizationSolution, AIRecommendation, DifficultyLevel } from './types';

// Get API key from environment (Vite exposes env vars through import.meta.env)
// @ts-ignore - Vite provides import.meta.env at runtime
const GEMINI_API_KEY = (import.meta as any).env?.VITE_GEMINI_API_KEY as string || '';

/**
 * Get AI recommendation for the best optimization solution
 */
export const getAIRecommendation = async (
    baselineFiAge: number,
    solutions: OptimizationSolution[],
    preferences: {
        preferLowerStepUp: boolean;
        preferLowerSipIncrease: boolean;
        targetAge: number;
    }
): Promise<AIRecommendation> => {
    // If no API key, use fallback
    if (!GEMINI_API_KEY) {
        console.warn('Gemini API key not found, using fallback ranking');
        return getFallbackRecommendation(baselineFiAge, solutions, preferences);
    }

    try {
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = buildPrompt(baselineFiAge, solutions, preferences);
        const result = await model.generateContent(prompt);
        const response = result.response.text();

        return parseAIResponse(response, solutions);
    } catch (error) {
        console.error('Gemini API error, using fallback:', error);
        return getFallbackRecommendation(baselineFiAge, solutions, preferences);
    }
};

/**
 * Calculate difficulty level based on step-up and SIP increase percentages
 */
const calculateDifficulty = (stepUpPercent: number, sipIncreasePercent: number): DifficultyLevel => {
    // Easy: only step-up up to 5% OR only SIP increase up to 10%
    if ((stepUpPercent <= 5 && sipIncreasePercent === 0) ||
        (stepUpPercent === 0 && sipIncreasePercent <= 10)) {
        return 'Easy';
    }

    // Aggressive: both high values or very high single values
    if ((stepUpPercent >= 10 && sipIncreasePercent >= 10) ||
        stepUpPercent > 10 || sipIncreasePercent > 15) {
        return 'Aggressive';
    }

    // Moderate: everything else
    return 'Moderate';
};

/**
 * Build the structured prompt for Gemini
 */
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

/**
 * Parse the AI response and extract recommendation
 */
const parseAIResponse = (response: string, solutions: OptimizationSolution[]): AIRecommendation => {
    try {
        // Clean up response - remove markdown code blocks if present
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

        // Validate the recommended index
        const recommendedIndex = parseInt(parsed.recommendedIndex, 10);
        if (isNaN(recommendedIndex) || recommendedIndex < 0 || recommendedIndex >= solutions.length) {
            throw new Error('Invalid recommended index');
        }

        // Validate and extract difficulty
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
        console.error('Failed to parse AI response:', error, response);
        // Return first solution as fallback with calculated difficulty
        const fallbackSolution = solutions[0];
        return {
            recommendedIndex: 0,
            explanation: 'This solution offers significant improvement in your financial independence timeline.',
            alternatives: [],
            difficulty: calculateDifficulty(fallbackSolution.stepUpPercent, fallbackSolution.sipIncreasePercent)
        };
    }
};

/**
 * Fallback ranking algorithm when Gemini API is unavailable
 * Uses weighted scoring: FI age (50%), step-up (30%), SIP increase (20%)
 */
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

    // Score each solution
    const scoredSolutions = solutions.map((solution, index) => {
        let score = 0;

        // FI age score (lower is better) - weight 50
        const fiAgeScore = (baselineFiAge - solution.fiAge) * 5;
        score += fiAgeScore;

        // Step-up penalty (lower is better) - weight 30
        const stepUpPenalty = solution.stepUpPercent * 3;
        score -= stepUpPenalty;

        // SIP increase penalty (lower is better) - weight 20
        const sipIncreasePenalty = solution.sipIncreasePercent * 2;
        score -= sipIncreasePenalty;

        // Bonus for reaching target age
        if (solution.fiAge <= preferences.targetAge) {
            score += 20; // Big bonus for hitting target
        }

        return { index, solution, score };
    });

    // Sort by score descending
    scoredSolutions.sort((a, b) => b.score - a.score);

    const best = scoredSolutions[0];
    const alternatives: string[] = [];

    // Generate alternative descriptions
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

    if (scoredSolutions.length > 2) {
        const third = scoredSolutions[2];
        alternatives.push(`Alternative: FI at ${third.solution.fiAge} with ${third.solution.stepUpPercent}% step-up and ${third.solution.sipIncreasePercent}% SIP increase`);
    }

    // Generate explanation
    let explanation = '';
    if (best.solution.fiAge <= preferences.targetAge) {
        explanation = `This plan reaches your target FI age of ${preferences.targetAge} with a ${best.solution.stepUpPercent}% annual step-up and ${best.solution.sipIncreasePercent}% SIP increase, offering the ideal balance of goal achievement and effort.`;
    } else {
        explanation = `This plan reduces your FI age from ${baselineFiAge} to ${best.solution.fiAge} (${best.solution.improvementYears} years earlier) with minimal adjustments to your current savings behavior.`;
    }

    // Calculate difficulty for the recommended solution
    const difficulty = calculateDifficulty(best.solution.stepUpPercent, best.solution.sipIncreasePercent);

    return {
        recommendedIndex: best.index,
        explanation,
        alternatives,
        difficulty
    };
};
