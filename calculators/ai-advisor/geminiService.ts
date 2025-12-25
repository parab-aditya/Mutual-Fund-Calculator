/**
 * AI Service for Financial Independence Optimization
 * 
 * Supports both OpenRouter and Gemini APIs:
 * - Priority: OpenRouter > Gemini > Fallback
 * - If both API keys are set, OpenRouter is used
 * 
 * Architecture:
 * 1. Local Dev: Direct API call using VITE_OPENROUTER_API_KEY or VITE_GEMINI_API_KEY
 * 2. Production (Vercel): Calls /api/gemini-recommendation serverless function
 * 3. Fallback: Local algorithm if API is unavailable
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { OptimizationSolution, AIRecommendation } from './types';
import { buildPrompt, parseAIResponse, getFallbackRecommendation } from './geminiShared';
import { resolveApiPath } from '../../utils/basePath';

// =============================================================================
// AI PROVIDER CONFIGURATION
// 
// To change models, set these in .env.local:
//   VITE_OPENROUTER_MODEL=google/gemini-2.0-flash-001
//   VITE_GEMINI_MODEL=gemini-2.0-flash
// =============================================================================

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_MODEL = import.meta.env.VITE_OPENROUTER_MODEL || 'google/gemini-2.0-flash-001';
const GEMINI_MODEL = import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.0-flash';

// Local dev API keys (from .env.local, only for local testing)
// Priority: OpenRouter > Gemini
const VITE_OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || '';
const VITE_GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

// Check if we're in local development
function isLocalDevelopment(): boolean {
    if (typeof window === 'undefined') return false;
    const hostname = window.location.hostname;
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.');
}

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
): Promise<{ recommendation: AIRecommendation; source: 'gemini' | 'openrouter' | 'fallback' }> => {

    // Strategy 1: Local development - direct API call (OpenRouter takes priority)
    if (isLocalDevelopment() && (VITE_OPENROUTER_API_KEY || VITE_GEMINI_API_KEY)) {
        const useOpenRouter = !!VITE_OPENROUTER_API_KEY;
        const providerName = useOpenRouter ? 'OpenRouter' : 'Gemini';

        console.log(`🤖 [AI] Local dev detected, calling ${providerName} API directly...`);
        try {
            const result = useOpenRouter
                ? await callOpenRouterDirect(baselineFiAge, solutions, preferences)
                : await callGeminiDirect(baselineFiAge, solutions, preferences);
            console.log(`✅ [AI] SUCCESS: Recommendation received from ${providerName} (Direct)`);
            return { recommendation: result, source: useOpenRouter ? 'openrouter' : 'gemini' };
        } catch (error) {
            console.warn(`⚠️ [AI] ${providerName} direct API call failed:`, error);
        }
    }

    // Strategy 2: Production - server-side API
    if (!isLocalDevelopment()) {
        try {
            console.log('🤖 [Gemini] Initiating AI request via Server API...');
            const response = await fetch(resolveApiPath('/api/ai-recommendation'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ baselineFiAge, solutions, preferences })
            });

            if (!response.ok) {
                throw new Error(`Server API returned ${response.status}`);
            }

            const data = await response.json();
            const source: 'gemini' | 'openrouter' | 'fallback' =
                data.source === 'openrouter' ? 'openrouter' :
                    data.source === 'gemini' ? 'gemini' : 'fallback';

            console.log(`✅ [AI] SUCCESS: Recommendation received (source: ${source})`);
            return { recommendation: data.recommendation, source };
        } catch (error) {
            console.warn('⚠️ [Gemini] Server API failed:', error);
        }
    }

    // Strategy 3: Fallback to local algorithm
    console.log('⚠️ [Gemini] FALLBACK: generating recommendation using internal calculations.');
    const fallbackRec = getFallbackRecommendation(baselineFiAge, solutions, preferences);
    return { recommendation: fallbackRec, source: 'fallback' };
};

/**
 * Direct OpenRouter API call (for local development)
 */
const callOpenRouterDirect = async (
    baselineFiAge: number,
    solutions: OptimizationSolution[],
    preferences: { preferLowerStepUp: boolean; preferLowerSipIncrease: boolean; targetAge: number }
): Promise<AIRecommendation> => {
    const prompt = buildPrompt(baselineFiAge, solutions, preferences);

    const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${VITE_OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': window.location.origin,
            'X-Title': 'WhatifMoney AI Planner'
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
    const content = data.choices?.[0]?.message?.content || '';

    return parseAIResponse(content, solutions);
};

/**
 * Direct Gemini API call (for local development)
 */
const callGeminiDirect = async (
    baselineFiAge: number,
    solutions: OptimizationSolution[],
    preferences: { preferLowerStepUp: boolean; preferLowerSipIncrease: boolean; targetAge: number }
): Promise<AIRecommendation> => {
    const genAI = new GoogleGenerativeAI(VITE_GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

    const prompt = buildPrompt(baselineFiAge, solutions, preferences);
    const result = await model.generateContent(prompt);
    const response = result.response.text();

    return parseAIResponse(response, solutions);
};
