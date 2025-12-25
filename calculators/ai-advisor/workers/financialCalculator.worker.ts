/**
 * Web Worker for Financial Independence Calculations
 * Offloads heavy optimization calculations from the main thread
 */

import { OptimizationSolution, OptimizationResult, FinancialIndependenceInputs, AIRecommendation, DifficultyLevel } from '../types';
import {
    MAX_AGE_MAPPING,
    INFLATION_RATE,
    SIP_RETURN_RATE_SHORT_TERM,
    SIP_RETURN_RATE_LONG_TERM,
    SIP_SHORT_TERM_THRESHOLD,
    SWP_RETURN_RATE,
    SWP_STEP_UP_PERCENTAGE,
    LIFESTYLE_BUFFER,
    SWP_SUSTAINABILITY_BUFFER,
    STEP_UP_TEST_VALUES,
    SIP_INCREASE_TEST_VALUES,
    COMBINED_SCENARIOS,
    OPTIMIZATION_TARGET_FI_AGE,
    LTCG_TAX_RATE,
} from '../constants';

// ============================================
// Safety Constants
// ============================================
const MAX_CACHE_SIZE = 1000; // Prevent unbounded memory growth
const MAX_BINARY_SEARCH_ITERATIONS = 100; // Safety limit for binary search
const VALID_HEALTH_STATUSES = ['needs_improvement', 'generally_healthy', 'very_healthy'] as const;
const DEFAULT_MAX_AGE = 80;

// ============================================
// Calculation Cache for Memoization
// ============================================
const corpusCache = new Map<string, number>();

const getCacheKey = (monthlyInvestment: number, years: number, stepUp: number): string => {
    return `${monthlyInvestment}-${years}-${stepUp}`;
};

/**
 * Evict oldest entries if cache exceeds max size
 */
const maintainCacheSize = (): void => {
    if (corpusCache.size > MAX_CACHE_SIZE) {
        // Remove first 20% of entries (oldest due to Map insertion order)
        const entriesToRemove = Math.floor(MAX_CACHE_SIZE * 0.2);
        const keys = Array.from(corpusCache.keys()).slice(0, entriesToRemove);
        keys.forEach(key => corpusCache.delete(key));
    }
};

// ============================================
// Core Calculation Functions
// ============================================

/**
 * Calculate SIP corpus (standalone, no React dependency)
 */
const calculateSipCorpus = (
    monthlyInvestment: number,
    annualReturnRate: number,
    years: number,
    stepUpPercentage: number = 0
): { totalValue: number; investedAmount: number } => {
    if (monthlyInvestment <= 0 || years <= 0) {
        return { totalValue: 0, investedAmount: 0 };
    }

    const annualRate = annualReturnRate / 100;
    if (annualRate <= -1) {
        return { totalValue: 0, investedAmount: 0 };
    }

    const stepUpRate = stepUpPercentage / 100;
    const months = years * 12;
    const monthlyRate = Math.pow(1 + annualRate, 1 / 12) - 1;

    let totalValue = 0;
    let investedAmount = 0;
    let currentMonthlySip = monthlyInvestment;

    for (let month = 1; month <= months; month++) {
        totalValue = (totalValue + currentMonthlySip) * (1 + monthlyRate);
        investedAmount += currentMonthlySip;
        if (month % 12 === 0 && month < months) {
            currentMonthlySip *= (1 + stepUpRate);
        }
    }

    return { totalValue, investedAmount };
};

/**
 * Calculate corpus with variable rate (cached)
 */
const calculateCorpusWithVariableRate = (
    monthlyInvestment: number,
    years: number,
    stepUpPercent: number = 0
): number => {
    if (years <= 0) return 0;

    const cacheKey = getCacheKey(monthlyInvestment, years, stepUpPercent);
    const cached = corpusCache.get(cacheKey);
    if (cached !== undefined) return cached;

    let result: number;

    if (years < SIP_SHORT_TERM_THRESHOLD) {
        const sipResult = calculateSipCorpus(monthlyInvestment, SIP_RETURN_RATE_SHORT_TERM, years, stepUpPercent);
        result = sipResult.totalValue;
    } else {
        const after7Years = calculateSipCorpus(monthlyInvestment, SIP_RETURN_RATE_SHORT_TERM, SIP_SHORT_TERM_THRESHOLD, stepUpPercent);
        const sipAfter7Years = monthlyInvestment * Math.pow(1 + stepUpPercent / 100, SIP_SHORT_TERM_THRESHOLD);
        const remainingYears = years - SIP_SHORT_TERM_THRESHOLD;
        const remainingResult = calculateSipCorpus(sipAfter7Years, SIP_RETURN_RATE_LONG_TERM, remainingYears, stepUpPercent);
        const existingCorpusGrowth = after7Years.totalValue * Math.pow(1 + SIP_RETURN_RATE_LONG_TERM / 100, remainingYears);
        result = existingCorpusGrowth + remainingResult.totalValue;
    }

    // Maintain cache size before adding new entry
    maintainCacheSize();
    corpusCache.set(cacheKey, result);
    return result;
};

/**
 * Calculate inflation-adjusted expense
 */
const getInflationAdjustedExpense = (currentExpense: number, yearsFromNow: number): number => {
    return currentExpense * Math.pow(1 + INFLATION_RATE / 100, yearsFromNow);
};

/**
 * Calculate SWP series (standalone)
 */
const calculateSwpSeries = (
    totalInvestment: number,
    withdrawalPerMonth: number,
    withdrawalStepUpPercentage: number,
    expectedReturnRate: number,
    timePeriod: number
): { finalValue: number } => {
    if (totalInvestment <= 0 || timePeriod <= 0) {
        return { finalValue: 0 };
    }

    const annualRate = expectedReturnRate / 100;
    const monthlyRate = Math.pow(1 + annualRate, 1 / 12) - 1;
    const totalMonths = timePeriod * 12;
    const stepUpRate = withdrawalStepUpPercentage / 100;

    let currentBalance = totalInvestment;
    let currentWithdrawalAmount = withdrawalPerMonth;

    for (let month = 1; month <= totalMonths; month++) {
        currentBalance *= (1 + monthlyRate);
        currentBalance -= currentWithdrawalAmount;

        if (month % 12 === 0) {
            if (stepUpRate > 0) {
                currentWithdrawalAmount *= (1 + stepUpRate);
            }
        }
    }

    return { finalValue: Math.round(currentBalance) };
};

/**
 * Check SWP sustainability
 */
const checkSwpSustainability = (
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
        yearsInFinancialIndependence
    );
    const finalCorpus = swpResult.finalValue;
    const minRequiredCorpus = corpus * SWP_SUSTAINABILITY_BUFFER;
    const finalCorpusPercentage = (finalCorpus / corpus) * 100;

    return {
        sustainable: finalCorpus >= minRequiredCorpus,
        finalCorpus,
        finalCorpusPercentage
    };
};

/**
 * Calculate FI age using BINARY SEARCH (O(log n) instead of O(n))
 * Includes iteration safety guard to prevent infinite loops
 */
const calculateFiAge = (
    monthlyInvestment: number,
    monthlyExpense: number,
    currentAge: number,
    maxAge: number,
    stepUpPercent: number = 0
): number | null => {
    // Guard: Validate inputs to prevent edge case loops
    if (currentAge >= 60 || currentAge >= maxAge || monthlyInvestment <= 0 || monthlyExpense <= 0) {
        return null;
    }

    let low = currentAge;
    let high = Math.min(60, maxAge);
    let result: number | null = null;
    let iterations = 0;

    while (low <= high && iterations < MAX_BINARY_SEARCH_ITERATIONS) {
        iterations++;
        const mid = Math.floor((low + high) / 2);
        const yearsFromNow = mid - currentAge;
        const yearsInFI = maxAge - mid;

        if (yearsInFI <= 0) {
            high = mid - 1;
            continue;
        }

        const sipCorpus = calculateCorpusWithVariableRate(monthlyInvestment, yearsFromNow, stepUpPercent);
        const inflationAdjustedExpense = getInflationAdjustedExpense(monthlyExpense, yearsFromNow);
        const targetWithdrawal = inflationAdjustedExpense * (1 + LIFESTYLE_BUFFER);

        // Gross up withdrawal to account for LTCG tax
        // User wants to receive targetWithdrawal net, so they need to withdraw more before tax
        const grossWithdrawal = targetWithdrawal / (1 - LTCG_TAX_RATE / 100);

        if (sipCorpus > 0) {
            const swpCheck = checkSwpSustainability(sipCorpus, grossWithdrawal, yearsInFI);

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
 * Calculate difficulty level
 */
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

/**
 * Fallback ranking when AI is unavailable
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

/**
 * Main optimization function
 */
const runOptimization = async (
    inputs: FinancialIndependenceInputs,
    baselineFiAge: number | null
): Promise<OptimizationResult> => {
    // Clear cache before each optimization run
    corpusCache.clear();

    const { currentAge, monthlyExpense, monthlyInvestment, healthStatus } = inputs;

    // Guard: Validate healthStatus and get maxAge with proper fallback
    const validHealthStatus = VALID_HEALTH_STATUSES.includes(healthStatus as typeof VALID_HEALTH_STATUSES[number])
        ? healthStatus
        : 'generally_healthy';
    const maxAge = MAX_AGE_MAPPING[validHealthStatus] ?? DEFAULT_MAX_AGE;

    if (baselineFiAge !== null && baselineFiAge <= OPTIMIZATION_TARGET_FI_AGE) {
        return {
            baselineFiAge,
            solutions: [],
            recommendedSolution: null,
            recommendation: null,
            skipOptimization: true,
            skipReason: `Already optimal! Your financial independence age is ${baselineFiAge} which is already optimised. Keep investing!`
        };
    }

    const solutions: OptimizationSolution[] = [];
    const effectiveBaseline = baselineFiAge ?? 100;

    if (baselineFiAge !== null) {
        solutions.push({
            fiAge: baselineFiAge,
            stepUpPercent: 0,
            sipIncreasePercent: 0,
            newMonthlySip: monthlyInvestment,
            improvementYears: 0
        });
    }

    // Test step-up only scenarios
    for (const stepUp of STEP_UP_TEST_VALUES) {
        const fiAge = calculateFiAge(monthlyInvestment, monthlyExpense, currentAge, maxAge, stepUp);
        if (fiAge !== null && fiAge < effectiveBaseline) {
            solutions.push({
                fiAge,
                stepUpPercent: stepUp,
                sipIncreasePercent: 0,
                newMonthlySip: monthlyInvestment,
                improvementYears: effectiveBaseline - fiAge
            });
        }
    }

    // Test SIP increase only scenarios
    for (const sipIncrease of SIP_INCREASE_TEST_VALUES) {
        const newSip = Math.round(monthlyInvestment * (1 + sipIncrease / 100));
        const fiAge = calculateFiAge(newSip, monthlyExpense, currentAge, maxAge, 0);
        if (fiAge !== null && fiAge < effectiveBaseline) {
            solutions.push({
                fiAge,
                stepUpPercent: 0,
                sipIncreasePercent: sipIncrease,
                newMonthlySip: newSip,
                improvementYears: effectiveBaseline - fiAge
            });
        }
    }

    // Test combined scenarios
    for (const [stepUp, sipIncrease] of COMBINED_SCENARIOS) {
        const newSip = Math.round(monthlyInvestment * (1 + sipIncrease / 100));
        const fiAge = calculateFiAge(newSip, monthlyExpense, currentAge, maxAge, stepUp);
        if (fiAge !== null && fiAge < effectiveBaseline) {
            const exists = solutions.some(s =>
                s.stepUpPercent === stepUp && s.sipIncreasePercent === sipIncrease
            );
            if (!exists) {
                solutions.push({
                    fiAge,
                    stepUpPercent: stepUp,
                    sipIncreasePercent: sipIncrease,
                    newMonthlySip: newSip,
                    improvementYears: effectiveBaseline - fiAge
                });
            }
        }
    }

    const solutionsForRanking = solutions.filter(s => s.stepUpPercent > 0 || s.sipIncreasePercent > 0);

    solutionsForRanking.sort((a, b) => {
        if (a.fiAge !== b.fiAge) return a.fiAge - b.fiAge;
        if (a.stepUpPercent !== b.stepUpPercent) return a.stepUpPercent - b.stepUpPercent;
        return a.sipIncreasePercent - b.sipIncreasePercent;
    });

    if (solutionsForRanking.length === 0) {
        return {
            baselineFiAge,
            solutions: [],
            recommendedSolution: null,
            recommendation: null,
            skipOptimization: false,
            error: 'No improvement options found within the allowed constraints.'
        };
    }

    // Use fallback recommendation in worker (no API key access)
    const recommendation = getFallbackRecommendation(
        effectiveBaseline,
        solutionsForRanking,
        {
            preferLowerStepUp: true,
            preferLowerSipIncrease: true,
            targetAge: OPTIMIZATION_TARGET_FI_AGE
        }
    );

    const recommendedSolution = recommendation.recommendedIndex >= 0 && recommendation.recommendedIndex < solutionsForRanking.length
        ? solutionsForRanking[recommendation.recommendedIndex]
        : solutionsForRanking[0];

    return {
        baselineFiAge,
        solutions: solutionsForRanking,
        recommendedSolution,
        recommendation,
        skipOptimization: false
    };
};

// ============================================
// Worker Message Handler
// ============================================

self.onmessage = async (e: MessageEvent) => {
    const { type, payload, requestId } = e.data;

    if (type === 'RUN_OPTIMIZATION') {
        try {
            const result = await runOptimization(payload.inputs, payload.baselineFiAge);
            self.postMessage({ type: 'OPTIMIZATION_RESULT', result, requestId });
        } catch (error) {
            self.postMessage({
                type: 'OPTIMIZATION_ERROR',
                error: error instanceof Error ? error.message : 'Unknown error',
                requestId
            });
        }
    }
};
