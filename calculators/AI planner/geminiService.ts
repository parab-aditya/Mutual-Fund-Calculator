/**
 * Gemini AI Service for Financial Independence Optimization
 * 
 * Architecture:
 * 1. Frontend calls /api/gemini-recommendation serverless function
 * 2. If that fails, uses local fallback algorithm
 * 
 * The @google/generative-ai SDK is ONLY used in the serverless function,
 * never in the frontend bundle.
 */

import { OptimizationSolution, AIRecommendation } from './types';
import { getFallbackRecommendation } from './geminiShared';
import { resolveApiPath } from '../../utils/basePath';

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
    // Try server-side API (secure, works in production)
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

        // Ensure source is always typed correctly
        const source: 'gemini' | 'fallback' = data.source === 'gemini' ? 'gemini' : 'fallback';

        console.log(`✅ [Gemini] SUCCESS: Recommendation received (source: ${source})`);
        return { recommendation: data.recommendation, source };
    } catch (error) {
        console.warn('⚠️ [Gemini] Server API failed:', error);
    }

    // Fallback to local algorithm
    console.log('⚠️ [Gemini] FALLBACK: generating recommendation using internal calculations.');
    const fallbackRec = getFallbackRecommendation(baselineFiAge, solutions, preferences);
    return { recommendation: fallbackRec, source: 'fallback' };
};
