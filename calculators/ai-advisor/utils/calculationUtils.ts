/**
 * Shared Calculation Utilities for Financial Independence Planning
 * 
 * This module centralizes all pure calculation functions used across:
 * - useFinancialIndependencePlanner.ts (main hook)
 * - optimizationFallback.ts (main-thread fallback)
 * - financialCalculator.worker.ts (Web Worker)
 * 
 * All functions are pure TypeScript with no React dependencies,
 * making them safe to import in Web Workers.
 */

import { OptimizationSolution, AIRecommendation, DifficultyLevel } from '../types';
import {
    INFLATION_RATE,
    SIP_RETURN_RATE_SHORT_TERM,
    SIP_RETURN_RATE_LONG_TERM,
    SIP_SHORT_TERM_THRESHOLD,
    SWP_RETURN_RATE,
    SWP_STEP_UP_PERCENTAGE,
    LIFESTYLE_BUFFER,
    SWP_SUSTAINABILITY_BUFFER,
    LTCG_TAX_RATE,
    FD_ANNUAL_GROWTH_RATE,
    MF_ANNUAL_GROWTH_RATE,
    MAX_AGE_MAPPING,
} from '../constants';
import { calculateSipCorpus } from '../../sip/useSipCalculator';
import { calculateSwpSeries } from '../../swp/useSwpCalculator';

// ============================================
// Memoization Cache for Performance
// ============================================
const MAX_CACHE_SIZE = 1000;
const corpusCache = new Map<string, number>();

const getCacheKey = (monthlyInvestment: number, years: number, stepUp: number): string => {
    return `${monthlyInvestment}-${years}-${stepUp}`;
};

const maintainCacheSize = (): void => {
    if (corpusCache.size > MAX_CACHE_SIZE) {
        const entriesToRemove = Math.floor(MAX_CACHE_SIZE * 0.2);
        const keys = Array.from(corpusCache.keys()).slice(0, entriesToRemove);
        keys.forEach(key => corpusCache.delete(key));
    }
};

export const clearCorpusCache = (): void => {
    corpusCache.clear();
};

// ============================================
// Core Calculation Functions
// ============================================

/**
 * Calculate the future value of pre-existing corpus after specified years.
 * FD grows at 7% annually, MF grows at 12% annually.
 */
export const calculateExistingCorpusGrowth = (
    fdCorpus: number = 0,
    mfCorpus: number = 0,
    years: number
): number => {
    if (years <= 0) return fdCorpus + mfCorpus;

    const fdGrown = fdCorpus * Math.pow(1 + FD_ANNUAL_GROWTH_RATE / 100, years);
    const mfGrown = mfCorpus * Math.pow(1 + MF_ANNUAL_GROWTH_RATE / 100, years);

    return fdGrown + mfGrown;
};

/**
 * Calculate SIP corpus for a given number of years, using appropriate return rate.
 * Uses 12% for < 7 years, 14% for >= 7 years
 * Supports annual step-up via calculateSipCorpus from useSipCalculator
 */
export const calculateCorpusWithVariableRate = (
    monthlyInvestment: number,
    years: number,
    stepUpPercent: number = 0,
    useCache: boolean = false
): number => {
    if (years <= 0) return 0;

    // Check cache if enabled
    if (useCache) {
        const cacheKey = getCacheKey(monthlyInvestment, years, stepUpPercent);
        const cached = corpusCache.get(cacheKey);
        if (cached !== undefined) return cached;
    }

    let result: number;

    if (years < SIP_SHORT_TERM_THRESHOLD) {
        // Use short-term rate for all years
        const sipResult = calculateSipCorpus(monthlyInvestment, SIP_RETURN_RATE_SHORT_TERM, years, stepUpPercent);
        result = sipResult.totalValue;
    } else {
        // First 7 years at 12%, rest at 14%
        const after7Years = calculateSipCorpus(monthlyInvestment, SIP_RETURN_RATE_SHORT_TERM, SIP_SHORT_TERM_THRESHOLD, stepUpPercent);

        // Calculate what the monthly SIP would be after 7 years of step-up
        const sipAfter7Years = monthlyInvestment * Math.pow(1 + stepUpPercent / 100, SIP_SHORT_TERM_THRESHOLD);

        // Remaining years at 14%
        const remainingYears = years - SIP_SHORT_TERM_THRESHOLD;
        const remainingResult = calculateSipCorpus(sipAfter7Years, SIP_RETURN_RATE_LONG_TERM, remainingYears, stepUpPercent);

        // Compound existing corpus for remaining period
        const existingCorpusGrowth = after7Years.totalValue * Math.pow(1 + SIP_RETURN_RATE_LONG_TERM / 100, remainingYears);

        result = existingCorpusGrowth + remainingResult.totalValue;
    }

    // Store in cache if enabled
    if (useCache) {
        maintainCacheSize();
        const cacheKey = getCacheKey(monthlyInvestment, years, stepUpPercent);
        corpusCache.set(cacheKey, result);
    }

    return result;
};

/**
 * Calculate inflation-adjusted monthly expense for a given year
 */
export const getInflationAdjustedExpense = (
    currentExpense: number,
    yearsFromNow: number
): number => {
    return currentExpense * Math.pow(1 + INFLATION_RATE / 100, yearsFromNow);
};

/**
 * Check if SWP is sustainable from financial independence year to max age
 * Returns true if final corpus >= 10% of initial corpus
 */
export const checkSwpSustainability = (
    corpus: number,
    monthlyWithdrawal: number,
    yearsInFinancialIndependence: number
): { sustainable: boolean; finalCorpus: number; finalCorpusPercentage: number } => {
    if (corpus <= 0 || yearsInFinancialIndependence <= 0) {
        return { sustainable: false, finalCorpus: 0, finalCorpusPercentage: 0 };
    }

    const swpResult = calculateSwpSeries(
        corpus,
        monthlyWithdrawal,
        SWP_STEP_UP_PERCENTAGE,
        SWP_RETURN_RATE,
        yearsInFinancialIndependence,
        0 // No inflation adjustment in SWP calculation, we handle it ourselves
    );
    const finalCorpus = swpResult.results.finalValue;
    const minRequiredCorpus = corpus * SWP_SUSTAINABILITY_BUFFER;
    const finalCorpusPercentage = (finalCorpus / corpus) * 100;

    return {
        sustainable: finalCorpus >= minRequiredCorpus,
        finalCorpus,
        finalCorpusPercentage
    };
};

/**
 * Calculate the FI age for given parameters
 * Returns the earliest age at which FI is sustainable, or null if never
 * Uses binary search for O(log n) performance
 */
export const calculateFiAge = (
    monthlyInvestment: number,
    monthlyExpense: number,
    currentAge: number,
    maxAge: number,
    stepUpPercent: number = 0,
    existingFDCorpus: number = 0,
    existingMFCorpus: number = 0,
    useCache: boolean = false
): number | null => {
    // Guard: Validate inputs
    if (currentAge >= 60 || currentAge >= maxAge || monthlyInvestment <= 0 || monthlyExpense <= 0) {
        return null;
    }

    let low = currentAge;
    let high = Math.min(60, maxAge);
    let result: number | null = null;
    const MAX_ITERATIONS = 100;
    let iterations = 0;

    while (low <= high && iterations < MAX_ITERATIONS) {
        iterations++;
        const mid = Math.floor((low + high) / 2);
        const yearsFromNow = mid - currentAge;
        const yearsInFI = maxAge - mid;

        if (yearsInFI <= 0) {
            high = mid - 1;
            continue;
        }

        // Calculate SIP corpus at this age with step-up
        const sipCorpus = calculateCorpusWithVariableRate(monthlyInvestment, yearsFromNow, stepUpPercent, useCache);

        // Calculate grown existing corpus at this age
        const grownExistingCorpus = calculateExistingCorpusGrowth(existingFDCorpus, existingMFCorpus, yearsFromNow);

        // Total corpus = SIP corpus + grown existing corpus
        const totalCorpus = sipCorpus + grownExistingCorpus;

        // Calculate inflation-adjusted expense at this age
        const inflationAdjustedExpense = getInflationAdjustedExpense(monthlyExpense, yearsFromNow);

        // Target withdrawal = expense + 25% lifestyle buffer
        const targetWithdrawal = inflationAdjustedExpense * (1 + LIFESTYLE_BUFFER);

        // Gross up withdrawal to account for LTCG tax
        const grossWithdrawal = targetWithdrawal / (1 - LTCG_TAX_RATE / 100);

        if (totalCorpus > 0) {
            const swpCheck = checkSwpSustainability(totalCorpus, grossWithdrawal, yearsInFI);

            if (swpCheck.sustainable) {
                result = mid;
                high = mid - 1; // Look for earlier age
            } else {
                low = mid + 1;
            }
        } else {
            low = mid + 1;
        }
    }

    return result;
};

/**
 * Calculate minimum monthly investment needed to achieve FI by a target age.
 * Uses binary search with checkSwpSustainability() for consistency.
 */
export const calculateMinimumInvestmentForFI = (
    currentAge: number,
    monthlyExpense: number,
    healthStatus: string,
    targetFIAge: number = 60,
    existingFDCorpus: number = 0,
    existingMFCorpus: number = 0
): { minimumInvestment: number; requiredCorpus: number } | null => {
    const maxAge = MAX_AGE_MAPPING[healthStatus] || 80;
    const yearsToFI = targetFIAge - currentAge;
    const yearsInRetirement = maxAge - targetFIAge;

    if (yearsToFI <= 0 || yearsInRetirement <= 0) return null;

    // Calculate inflation-adjusted expense at FI age
    const inflatedExpense = getInflationAdjustedExpense(monthlyExpense, yearsToFI);

    // Target withdrawal with lifestyle buffer, grossed up for LTCG tax
    const targetWithdrawal = inflatedExpense * (1 + LIFESTYLE_BUFFER);
    const grossWithdrawal = targetWithdrawal / (1 - LTCG_TAX_RATE / 100);

    // Calculate grown existing corpus at FI age
    const grownExistingCorpus = calculateExistingCorpusGrowth(existingFDCorpus, existingMFCorpus, yearsToFI);

    // Find minimum corpus that passes SWP sustainability check
    let minCorpus = grossWithdrawal * 12 * 10; // Start with 10x annual withdrawal
    let maxCorpus = grossWithdrawal * 12 * 50; // Max 50x annual withdrawal
    let requiredCorpus = minCorpus;

    // Binary search to find minimum sustainable corpus
    while (maxCorpus - minCorpus > 1000) {
        const midCorpus = Math.floor((minCorpus + maxCorpus) / 2);
        const swpCheck = checkSwpSustainability(midCorpus, grossWithdrawal, yearsInRetirement);

        if (swpCheck.sustainable) {
            requiredCorpus = midCorpus;
            maxCorpus = midCorpus;
        } else {
            minCorpus = midCorpus;
        }
    }

    // Final verification
    const finalCheck = checkSwpSustainability(requiredCorpus, grossWithdrawal, yearsInRetirement);
    if (!finalCheck.sustainable) {
        requiredCorpus = maxCorpus;
    }

    // Calculate how much corpus is still needed from SIP
    const corpusNeededFromSip = Math.max(0, requiredCorpus - grownExistingCorpus);

    if (corpusNeededFromSip <= 0) {
        return { minimumInvestment: 0, requiredCorpus };
    }

    // Binary search to find minimum SIP
    let minSip = 1000;
    let maxSip = corpusNeededFromSip / (yearsToFI * 12);
    let minimumInvestment = minSip;

    while (maxSip - minSip > 100) {
        const midSip = Math.floor((minSip + maxSip) / 2);
        const generatedCorpus = calculateCorpusWithVariableRate(midSip, yearsToFI, 0);

        if (generatedCorpus >= corpusNeededFromSip) {
            minimumInvestment = midSip;
            maxSip = midSip;
        } else {
            minSip = midSip;
        }
    }

    // Final verification
    const finalCorpus = calculateCorpusWithVariableRate(minimumInvestment, yearsToFI, 0);
    if (finalCorpus < corpusNeededFromSip) {
        minimumInvestment = Math.ceil(maxSip);
    }

    return { minimumInvestment, requiredCorpus };
};

// ============================================
// Recommendation Functions
// ============================================

/**
 * Calculate difficulty level based on step-up and SIP increase percentages
 */
export const calculateDifficulty = (stepUpPercent: number, sipIncreasePercent: number): DifficultyLevel => {
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

/**
 * Fallback ranking when AI is unavailable
 */
export const getFallbackRecommendation = (
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
