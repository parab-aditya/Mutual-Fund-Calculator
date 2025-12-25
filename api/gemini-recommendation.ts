import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { buildPrompt, parseAIResponse, getFallbackRecommendation } from '../calculators/AI planner/geminiShared';
import { OptimizationSolution } from '../calculators/AI planner/types';

interface RequestBody {
    baselineFiAge: number;
    solutions: OptimizationSolution[];
    preferences: {
        preferLowerStepUp: boolean;
        preferLowerSipIncrease: boolean;
        targetAge: number;
    };
}

// Vercel Serverless Function Handler (Node.js runtime)
export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }

    // Explicit method guard - only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({
            error: 'Method not allowed',
            message: `Expected POST, received ${req.method}`,
            recommendation: null,
            source: 'error'
        });
    }

    try {
        const body: RequestBody = req.body;

        // Validate request body exists
        if (!body || typeof body !== 'object') {
            return res.status(400).json({
                error: 'Invalid request body',
                recommendation: null,
                source: 'error'
            });
        }

        const { baselineFiAge, solutions, preferences } = body;

        // Validate required fields
        if (!solutions || !Array.isArray(solutions) || solutions.length === 0) {
            console.warn('[API] Invalid request: solutions array required');
            return res.status(400).json({
                error: 'Invalid request: solutions array required',
                recommendation: null,
                source: 'error'
            });
        }

        if (typeof baselineFiAge !== 'number' || !preferences) {
            console.warn('[API] Invalid request: missing baselineFiAge or preferences');
            // Use fallback instead of erroring
            const fallback = getFallbackRecommendation(baselineFiAge || 60, solutions, preferences || { targetAge: 45, preferLowerStepUp: true, preferLowerSipIncrease: true });
            return res.status(200).json({ recommendation: fallback, source: 'fallback' });
        }

        // Get API key from environment (server-side, secure!)
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

        if (!GEMINI_API_KEY) {
            console.warn('[API] Gemini API key not configured, using fallback');
            const fallback = getFallbackRecommendation(baselineFiAge, solutions, preferences);
            return res.status(200).json({ recommendation: fallback, source: 'fallback' });
        }

        console.log('[API] Calling Gemini API...');

        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        const prompt = buildPrompt(baselineFiAge, solutions, preferences);
        const result = await model.generateContent(prompt);
        const response = result.response.text();

        console.log('[API] Gemini API call successful');

        const recommendation = parseAIResponse(response, solutions);

        return res.status(200).json({ recommendation, source: 'gemini' });
    } catch (error) {
        console.error('[API] Error:', error);

        // Always try to return a valid response with fallback
        try {
            const body: RequestBody = req.body || {};
            const { baselineFiAge = 60, solutions = [], preferences = { targetAge: 45, preferLowerStepUp: true, preferLowerSipIncrease: true } } = body;

            if (solutions.length > 0) {
                const fallback = getFallbackRecommendation(baselineFiAge, solutions, preferences);
                return res.status(200).json({
                    recommendation: fallback,
                    source: 'fallback',
                    error: String(error)
                });
            }
        } catch (fallbackError) {
            console.error('[API] Fallback also failed:', fallbackError);
        }

        return res.status(500).json({
            error: 'Failed to process request',
            message: String(error),
            recommendation: null,
            source: 'error'
        });
    }
}
