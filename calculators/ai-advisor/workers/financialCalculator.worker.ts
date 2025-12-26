/**
 * Web Worker for Financial Independence Calculations
 * Offloads heavy optimization calculations from the main thread
 */

import { OptimizationSolution, OptimizationResult, FinancialIndependenceInputs } from '../types';
import {
    MAX_AGE_MAPPING,
    STEP_UP_TEST_VALUES,
    SIP_INCREASE_TEST_VALUES,
    COMBINED_SCENARIOS,
    OPTIMIZATION_TARGET_FI_AGE,
} from '../constants';
import {
    calculateFiAge,
    getFallbackRecommendation,
    clearCorpusCache,
} from '../utils/calculationUtils';

// ============================================
// Safety Constants
// ============================================
const VALID_HEALTH_STATUSES = ['needs_improvement', 'generally_healthy', 'very_healthy'] as const;
const DEFAULT_MAX_AGE = 80;

// ============================================
// Main Optimization Function
// ============================================

const runOptimization = async (
    inputs: FinancialIndependenceInputs,
    baselineFiAge: number | null
): Promise<OptimizationResult> => {
    // Clear cache before each optimization run
    clearCorpusCache();

    const { currentAge, monthlyExpense, monthlyInvestment, healthStatus, existingFDCorpus = 0, existingMFCorpus = 0 } = inputs;

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

    // ============================================
    // PARALLEL SCENARIO CALCULATION
    // Run all scenarios concurrently for faster optimization
    // ============================================

    // Step-up only scenarios
    const stepUpPromises = STEP_UP_TEST_VALUES.map(async (stepUp) => ({
        stepUp,
        sipIncrease: 0,
        newSip: monthlyInvestment,
        fiAge: calculateFiAge(monthlyInvestment, monthlyExpense, currentAge, maxAge, stepUp, existingFDCorpus, existingMFCorpus, true)
    }));

    // SIP increase only scenarios
    const sipIncreasePromises = SIP_INCREASE_TEST_VALUES.map(async (sipIncrease) => {
        const newSip = Math.round(monthlyInvestment * (1 + sipIncrease / 100));
        return {
            stepUp: 0,
            sipIncrease,
            newSip,
            fiAge: calculateFiAge(newSip, monthlyExpense, currentAge, maxAge, 0, existingFDCorpus, existingMFCorpus, true)
        };
    });

    // Combined scenarios
    const combinedPromises = COMBINED_SCENARIOS.map(async ([stepUp, sipIncrease]) => {
        const newSip = Math.round(monthlyInvestment * (1 + sipIncrease / 100));
        return {
            stepUp,
            sipIncrease,
            newSip,
            fiAge: calculateFiAge(newSip, monthlyExpense, currentAge, maxAge, stepUp, existingFDCorpus, existingMFCorpus, true)
        };
    });

    // Execute all scenarios in parallel
    const [stepUpResults, sipIncreaseResults, combinedResults] = await Promise.all([
        Promise.all(stepUpPromises),
        Promise.all(sipIncreasePromises),
        Promise.all(combinedPromises)
    ]);

    // Process step-up results
    for (const { stepUp, fiAge, newSip } of stepUpResults) {
        if (fiAge !== null && fiAge < effectiveBaseline) {
            solutions.push({
                fiAge,
                stepUpPercent: stepUp,
                sipIncreasePercent: 0,
                newMonthlySip: newSip,
                improvementYears: effectiveBaseline - fiAge
            });
        }
    }

    // Process SIP increase results
    for (const { sipIncrease, fiAge, newSip } of sipIncreaseResults) {
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

    // Process combined results (skip duplicates)
    for (const { stepUp, sipIncrease, fiAge, newSip } of combinedResults) {
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
