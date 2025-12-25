import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Import shared types and functions from ai-advisor (no more spaces in path!)
import { OptimizationSolution, AIRecommendation } from '../calculators/ai-advisor/types';
import { buildPrompt, parseAIResponse, getFallbackRecommendation } from '../calculators/ai-advisor/geminiShared';

// =============================================================================
// AI PROVIDER CONFIGURATION
// =============================================================================

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_MODEL = 'google/gemini-3-flash-preview';
const GEMINI_MODEL = 'gemini-3-flash-preview';

// =============================================================================
// REQUEST BODY TYPE
// =============================================================================

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
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }

    // Explicit method guard
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

        if (!body || typeof body !== 'object') {
            return res.status(400).json({
                error: 'Invalid request body',
                recommendation: null,
                source: 'error'
            });
        }

        const { baselineFiAge, solutions, preferences } = body;

        if (!solutions || !Array.isArray(solutions) || solutions.length === 0) {
            return res.status(400).json({
                error: 'Invalid request: solutions array required',
                recommendation: null,
                source: 'error'
            });
        }

        if (typeof baselineFiAge !== 'number' || !preferences) {
            const fallback = getFallbackRecommendation(baselineFiAge || 60, solutions, preferences || { targetAge: 45, preferLowerStepUp: true, preferLowerSipIncrease: true });
            return res.status(200).json({ recommendation: fallback, source: 'fallback' });
        }

        const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

        // Priority: OpenRouter > Gemini > Fallback
        if (!OPENROUTER_API_KEY && !GEMINI_API_KEY) {
            console.warn('[API] No AI API key configured, using fallback');
            const fallback = getFallbackRecommendation(baselineFiAge, solutions, preferences);
            return res.status(200).json({ recommendation: fallback, source: 'fallback' });
        }

        const prompt = buildPrompt(baselineFiAge, solutions, preferences);
        let responseText: string;

        // Use OpenRouter if available (priority), otherwise use Gemini
        if (OPENROUTER_API_KEY) {
            console.log('[API] Calling OpenRouter API...');
            responseText = await callOpenRouter(prompt, OPENROUTER_API_KEY);
            console.log('[API] OpenRouter API call successful');
        } else {
            console.log('[API] Calling Gemini API...');
            const genAI = new GoogleGenerativeAI(GEMINI_API_KEY!);
            const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
            const result = await model.generateContent(prompt);
            responseText = result.response.text();
            console.log('[API] Gemini API call successful');
        }

        const recommendation = parseAIResponse(responseText, solutions);
        const source = OPENROUTER_API_KEY ? 'openrouter' : 'gemini';

        return res.status(200).json({ recommendation, source });
    } catch (error) {
        console.error('[API] Error:', error);

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
