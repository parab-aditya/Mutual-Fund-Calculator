/**
 * Main-thread fallback for financial optimization calculations
 * Used when the Web Worker fails (e.g., on some production environments)
 */

import { OptimizationSolution, OptimizationResult, FinancialIndependenceInputs } from './types';
import {
    MAX_AGE_MAPPING,
    STEP_UP_TEST_VALUES,
    SIP_INCREASE_TEST_VALUES,
    COMBINED_SCENARIOS,
    OPTIMIZATION_TARGET_FI_AGE,
} from './constants';
import {
    calculateFiAge,
    getFallbackRecommendation,
} from './utils/calculationUtils';

/**
 * Main-thread fallback optimization function
 * Called when the Web Worker fails
 */
export const runOptimizationFallback = (
    inputs: FinancialIndependenceInputs,
    baselineFiAge: number | null
): OptimizationResult => {
    console.log('[Optimization] Running main-thread fallback calculations...');

    const { currentAge, monthlyExpense, monthlyInvestment, healthStatus, existingFDCorpus = 0, existingMFCorpus = 0 } = inputs;
    const maxAge = MAX_AGE_MAPPING[healthStatus] || 80;

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
        const fiAge = calculateFiAge(monthlyInvestment, monthlyExpense, currentAge, maxAge, stepUp, existingFDCorpus, existingMFCorpus);
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
        const fiAge = calculateFiAge(newSip, monthlyExpense, currentAge, maxAge, 0, existingFDCorpus, existingMFCorpus);
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
        const fiAge = calculateFiAge(newSip, monthlyExpense, currentAge, maxAge, stepUp, existingFDCorpus, existingMFCorpus);
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

    console.log('[Optimization] Main-thread fallback complete');

    return {
        baselineFiAge,
        solutions: solutionsForRanking,
        recommendedSolution,
        recommendation,
        skipOptimization: false
    };
};
