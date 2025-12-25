/**
 * Gemini AI Service for Financial Independence Optimization
 * 
 * This service handles AI recommendations with a hybrid approach:
 * 1. Production (Vercel): Calls /api/gemini-recommendation serverless function
 * 2. Local Dev: Can use VITE_GEMINI_API_KEY for direct calls (optional)
 * 3. Fallback: Local algorithm if API is unavailable
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { OptimizationSolution, AIRecommendation } from './types';
import { buildPrompt, parseAIResponse, getFallbackRecommendation } from './geminiShared';
import { resolveApiPath } from '../../utils/basePath';

// Local dev API key (only for local testing, not used in production)
const VITE_GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

// Determine if we're in production (Vercel)
const isProduction = import.meta.env.PROD;

/**
 * Get AI recommendation for the best optimization solution
 * Tries server-side API first, falls back to direct call or local algorithm
 */
export const getAIRecommendation = async (
    baselineFiAge: number,
    solutions: OptimizationSolution[],
    preferences: {
        preferLowerStepUp: boolean;
        preferLowerSipIncrease: boolean;
        targetAge: number;
    }
): Promise<{ recommendation: AIRecommendation; source: 'gemini' | 'fallback' }> => {
    // Strategy 1: Try server-side API (secure, works in production)
    try {
        console.log('🤖 [Gemini] Initiating AI request via Server API...');
        const serverResult = await callServerAPI(baselineFiAge, solutions, preferences);
        if (serverResult) {
            console.log(`✅ [Gemini] SUCCESS: Recommendation received from Gemini AI (source: ${serverResult.source})`);
            return { recommendation: serverResult.recommendation, source: 'gemini' };
        }
    } catch (error) {
        console.warn('⚠️ [Gemini] Server API failed. Attempting other methods...', error);
    }

    // Strategy 2: Direct Gemini call (only for local dev with VITE_ key)
    if (!isProduction && VITE_GEMINI_API_KEY) {
        console.log('🤖 [Gemini] Initiating AI request via Direct API (Local Dev)...');
        try {
            const directResult = await callGeminiDirect(baselineFiAge, solutions, preferences);
            console.log('✅ [Gemini] SUCCESS: Recommendation received from Gemini AI (Direct Call)');
            return { recommendation: directResult, source: 'gemini' };
        } catch (error) {
            console.error('⚠️ [Gemini] Direct API failed:', error);
        }
    }

    // Strategy 3: Local fallback algorithm
    console.log('ℹ️ [Gemini] All AI methods failed or unavailable.');
    console.log('⚠️ [Gemini] FALLBACK: generating recommendation using internal calculations.');
    const fallbackRec = getFallbackRecommendation(baselineFiAge, solutions, preferences);
    return { recommendation: fallbackRec, source: 'fallback' };
};

/**
 * Call the server-side API endpoint
 */
const callServerAPI = async (
    baselineFiAge: number,
    solutions: OptimizationSolution[],
    preferences: { preferLowerStepUp: boolean; preferLowerSipIncrease: boolean; targetAge: number }
): Promise<{ recommendation: AIRecommendation; source: string } | null> => {
    const response = await fetch(resolveApiPath('/api/gemini-recommendation'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baselineFiAge, solutions, preferences })
    });

    if (!response.ok) {
        throw new Error(`Server API returned ${response.status}`);
    }

    const data = await response.json();
    return data;
};

/**
 * Direct Gemini API call (for local development only)
 */
const callGeminiDirect = async (
    baselineFiAge: number,
    solutions: OptimizationSolution[],
    preferences: { preferLowerStepUp: boolean; preferLowerSipIncrease: boolean; targetAge: number }
): Promise<AIRecommendation> => {
    const genAI = new GoogleGenerativeAI(VITE_GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = buildPrompt(baselineFiAge, solutions, preferences);
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    console.log('[Gemini] Direct API call successful, parsing response...');

    return parseAIResponse(response, solutions);
};


