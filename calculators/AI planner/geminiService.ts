/**
 * Gemini AI Service for Financial Independence Optimization
 * 
 * Architecture:
 * 1. Local Dev: Direct Gemini API call using VITE_GEMINI_API_KEY
 * 2. Production (Vercel): Calls /api/gemini-recommendation serverless function
 * 3. Fallback: Local algorithm if API is unavailable
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { OptimizationSolution, AIRecommendation } from './types';
import { buildPrompt, parseAIResponse, getFallbackRecommendation } from './geminiShared';
import { resolveApiPath } from '../../utils/basePath';

// Local dev API key (from .env.local, only for local testing)
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
): Promise<{ recommendation: AIRecommendation; source: 'gemini' | 'fallback' }> => {

    // Strategy 1: Local development - direct Gemini call
    if (isLocalDevelopment() && VITE_GEMINI_API_KEY) {
        console.log('🤖 [Gemini] Local dev detected, calling Gemini API directly...');
        try {
            const result = await callGeminiDirect(baselineFiAge, solutions, preferences);
            console.log('✅ [Gemini] SUCCESS: Recommendation received from Gemini AI (Direct)');
            return { recommendation: result, source: 'gemini' };
        } catch (error) {
            console.warn('⚠️ [Gemini] Direct API call failed:', error);
        }
    }

    // Strategy 2: Production - server-side API
    if (!isLocalDevelopment()) {
        try {
            console.log('🤖 [Gemini] Initiating AI request via Server API...');
            const response = await fetch(resolveApiPath('/api/gemini-recommendation'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ baselineFiAge, solutions, preferences })
            });

            if (!response.ok) {
                throw new Error(`Server API returned ${response.status}`);
            }

            const data = await response.json();
            const source: 'gemini' | 'fallback' = data.source === 'gemini' ? 'gemini' : 'fallback';

            console.log(`✅ [Gemini] SUCCESS: Recommendation received (source: ${source})`);
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
 * Direct Gemini API call (for local development)
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

    return parseAIResponse(response, solutions);
};
