import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';

// =============================================================================
// TYPES (inlined to avoid Vercel bundling issues with cross-file imports)
// =============================================================================

type DifficultyLevel = 'Easy' | 'Moderate' | 'Aggressive';

interface OptimizationSolution {
    fiAge: number;
    stepUpPercent: number;
    sipIncreasePercent: number;
    newMonthlySip: number;
    improvementYears: number;
}

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

// =============================================================================
// AI PROVIDER CONFIGURATION
// 
// To change models, set these in Vercel Environment Variables:
//   OPENROUTER_MODEL=google/gemini-2.0-flash-001
//   GEMINI_MODEL=gemini-2.0-flash
// =============================================================================

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'google/gemini-2.0-flash-001';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

// =============================================================================
// HELPER FUNCTIONS (inlined from geminiShared.ts)
// =============================================================================

function calculateDifficulty(stepUpPercent: number, sipIncreasePercent: number): DifficultyLevel {
    if ((stepUpPercent <= 5 && sipIncreasePercent === 0) ||
        (stepUpPercent === 0 && sipIncreasePercent <= 10)) {
        return 'Easy';
    }
    if ((stepUpPercent >= 10 && sipIncreasePercent >= 10) ||
        stepUpPercent > 10 || sipIncreasePercent > 15) {
        return 'Aggressive';
    }
    return 'Moderate';
}

function buildPrompt(
    baselineFiAge: number,
    solutions: OptimizationSolution[],
    preferences: { preferLowerStepUp: boolean; preferLowerSipIncrease: boolean; targetAge: number }
): string {
    const solutionsData = solutions.map((s, index) => ({
        i: index,
        fi: s.fiAge,
        su: s.stepUpPercent,
        si: s.sipIncreasePercent
    }));

    return `Pick the best financial independence (FI) solution.

Context: Baseline FI=${baselineFiAge}, Target=${preferences.targetAge}

Solutions (i=index, fi=FI age, su=step-up%, si=SIP increase%):
${JSON.stringify(solutionsData)}

Rank by: 1) Lowest fi, 2) Lowest su, 3) Lowest si
Bonus: fi≤${preferences.targetAge} is preferred even with slightly higher su/si.

Respond JSON only:
{"recommendedIndex":<number>,"difficulty":"Easy"|"Moderate"|"Aggressive"}

Difficulty: Easy=su≤5 OR si≤10, Aggressive=su≥10 AND si≥10, else Moderate`;
}

function parseAIResponse(response: string, solutions: OptimizationSolution[]): AIRecommendation {
    try {
        let cleanResponse = response.trim();
        if (cleanResponse.startsWith('```json')) cleanResponse = cleanResponse.slice(7);
        if (cleanResponse.startsWith('```')) cleanResponse = cleanResponse.slice(3);
        if (cleanResponse.endsWith('```')) cleanResponse = cleanResponse.slice(0, -3);
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

        const explanation = `Recommended: ${recommendedSolution.stepUpPercent}% step-up + ${recommendedSolution.sipIncreasePercent}% SIP increase for FI at age ${recommendedSolution.fiAge}.`;

        return { recommendedIndex, explanation, alternatives: [], difficulty };
    } catch (error) {
        console.error('Failed to parse AI response:', error, response);
        const fallbackSolution = solutions[0];
        return {
            recommendedIndex: 0,
            explanation: 'This solution offers significant improvement in your financial independence timeline.',
            alternatives: [],
            difficulty: calculateDifficulty(fallbackSolution.stepUpPercent, fallbackSolution.sipIncreasePercent)
        };
    }
}

function getFallbackRecommendation(
    baselineFiAge: number,
    solutions: OptimizationSolution[],
    preferences: { preferLowerStepUp: boolean; preferLowerSipIncrease: boolean; targetAge: number }
): AIRecommendation {
    if (solutions.length === 0) {
        return { recommendedIndex: -1, explanation: 'No optimization solutions available.', alternatives: [], difficulty: 'Easy' };
    }

    const scoredSolutions = solutions.map((solution, index) => {
        let score = (baselineFiAge - solution.fiAge) * 5;
        score -= solution.stepUpPercent * 3;
        score -= solution.sipIncreasePercent * 2;
        if (solution.fiAge <= preferences.targetAge) score += 20;
        return { index, solution, score };
    });

    scoredSolutions.sort((a, b) => b.score - a.score);
    const best = scoredSolutions[0];

    const explanation = best.solution.fiAge <= preferences.targetAge
        ? `This plan reaches your target FI age of ${preferences.targetAge} with a ${best.solution.stepUpPercent}% annual step-up and ${best.solution.sipIncreasePercent}% SIP increase.`
        : `This plan reduces your FI age from ${baselineFiAge} to ${best.solution.fiAge} (${best.solution.improvementYears} years earlier).`;

    return {
        recommendedIndex: best.index,
        explanation,
        alternatives: [],
        difficulty: calculateDifficulty(best.solution.stepUpPercent, best.solution.sipIncreasePercent)
    };
}

// =============================================================================
// OPENROUTER API HELPER
// =============================================================================

async function callOpenRouter(prompt: string, apiKey: string): Promise<string> {
    const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://whatifmoney.in',
            'X-Title': 'WhatifMoney AI Advisor'
        },
        body: JSON.stringify({
            model: OPENROUTER_MODEL,
            messages: [{ role: 'user', content: prompt }]
        })
    });

    if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
}

// =============================================================================
// VERCEL SERVERLESS FUNCTION HANDLER
// =============================================================================

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const startTime = Date.now();

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(204).end();
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed', recommendation: null, source: 'error' });
    }

    try {
        const body: RequestBody = req.body;
        if (!body || typeof body !== 'object') {
            return res.status(400).json({ error: 'Invalid request body', recommendation: null, source: 'error' });
        }

        const { baselineFiAge, solutions, preferences } = body;

        if (!solutions || !Array.isArray(solutions) || solutions.length === 0) {
            return res.status(400).json({ error: 'solutions array required', recommendation: null, source: 'error' });
        }

        if (typeof baselineFiAge !== 'number' || !preferences) {
            const fallback = getFallbackRecommendation(baselineFiAge || 60, solutions, preferences || { targetAge: 45, preferLowerStepUp: true, preferLowerSipIncrease: true });
            return res.status(200).json({ recommendation: fallback, source: 'fallback' });
        }

        const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

        if (!OPENROUTER_API_KEY && !GEMINI_API_KEY) {
            console.warn('[API] No AI API key configured, using fallback');
            return res.status(200).json({ recommendation: getFallbackRecommendation(baselineFiAge, solutions, preferences), source: 'fallback' });
        }

        const prompt = buildPrompt(baselineFiAge, solutions, preferences);
        let responseText: string;
        let source: string;

        const apiCallStart = Date.now();
        const initTime = apiCallStart - startTime;
        console.log(`[API] ⏱️ Function init took ${initTime}ms`);

        if (OPENROUTER_API_KEY) {
            console.log('[API] Calling OpenRouter API...');
            responseText = await callOpenRouter(prompt, OPENROUTER_API_KEY);
            source = 'openrouter';
            const apiCallDuration = Date.now() - apiCallStart;
            console.log(`[API] ✅ OpenRouter API call successful (${apiCallDuration}ms)`);
        } else {
            console.log('[API] Calling Gemini API...');
            const genAI = new GoogleGenerativeAI(GEMINI_API_KEY!);
            const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
            const result = await model.generateContent(prompt);
            responseText = result.response.text();
            source = 'gemini';
            const apiCallDuration = Date.now() - apiCallStart;
            console.log(`[API] ✅ Gemini API call successful (${apiCallDuration}ms)`);
        }

        const recommendation = parseAIResponse(responseText, solutions);
        const totalTime = Date.now() - startTime;
        console.log(`[API] 🏁 Total request time: ${totalTime}ms`);

        return res.status(200).json({ recommendation, source });
    } catch (error) {
        console.error('[API] Error:', error);

        try {
            const body: RequestBody = req.body || {};
            const { baselineFiAge = 60, solutions = [], preferences = { targetAge: 45, preferLowerStepUp: true, preferLowerSipIncrease: true } } = body;
            if (solutions.length > 0) {
                return res.status(200).json({ recommendation: getFallbackRecommendation(baselineFiAge, solutions, preferences), source: 'fallback', error: String(error) });
            }
        } catch (e) {
            console.error('[API] Fallback failed:', e);
        }

        return res.status(500).json({ error: 'Failed to process request', recommendation: null, source: 'error' });
    }
}
