import { useMemo } from 'react';
import { FinancialIndependenceInputs, YearlyBreakdown, FinancialIndependenceResult, OptimizationSolution, OptimizationResult } from './types';
import {
    MAX_AGE_MAPPING,
    SIP_RETURN_RATE_SHORT_TERM,
    SIP_RETURN_RATE_LONG_TERM,
    SIP_SHORT_TERM_THRESHOLD,
    LIFESTYLE_BUFFER,
    STEP_UP_TEST_VALUES,
    SIP_INCREASE_TEST_VALUES,
    COMBINED_SCENARIOS,
    OPTIMIZATION_TARGET_FI_AGE,
    LTCG_TAX_RATE,
} from './constants';
import {
    calculateExistingCorpusGrowth,
    calculateCorpusWithVariableRate,
    getInflationAdjustedExpense,
    checkSwpSustainability,
    calculateFiAge,
    calculateMinimumInvestmentForFI,
} from './utils/calculationUtils';
import { getAIRecommendation } from './geminiService';

// Re-export for backward compatibility
export { calculateExistingCorpusGrowth, calculateCorpusWithVariableRate, calculateMinimumInvestmentForFI };

/**
 * Run optimization to find the best step-up and SIP increase combination
 */
export const runOptimization = async (
    inputs: FinancialIndependenceInputs,
    baselineFiAge: number | null
): Promise<OptimizationResult> => {
    const { currentAge, monthlyExpense, monthlyInvestment, healthStatus, existingFDCorpus = 0, existingMFCorpus = 0 } = inputs;
    const maxAge = MAX_AGE_MAPPING[healthStatus] || 80;

    // Step 0: Check if optimization is needed
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
    const effectiveBaseline = baselineFiAge ?? 100; // Use high number if no baseline

    // Add baseline as first solution for reference
    if (baselineFiAge !== null) {
        solutions.push({
            fiAge: baselineFiAge,
            stepUpPercent: 0,
            sipIncreasePercent: 0,
            newMonthlySip: monthlyInvestment,
            improvementYears: 0
        });
    }

    // Step 1: Test step-up only scenarios
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

    // Step 2: Test SIP increase only scenarios
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

    // Step 3: Test combined scenarios (limited pairs)
    for (const [stepUp, sipIncrease] of COMBINED_SCENARIOS) {
        const newSip = Math.round(monthlyInvestment * (1 + sipIncrease / 100));
        const fiAge = calculateFiAge(newSip, monthlyExpense, currentAge, maxAge, stepUp, existingFDCorpus, existingMFCorpus);
        if (fiAge !== null && fiAge < effectiveBaseline) {
            // Check if we already have this exact combination
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

    // Remove baseline for AI ranking (we want to compare improvement options)
    const solutionsForRanking = solutions.filter(s => s.stepUpPercent > 0 || s.sipIncreasePercent > 0);

    // Sort solutions by FI age, then step-up, then SIP increase
    solutionsForRanking.sort((a, b) => {
        if (a.fiAge !== b.fiAge) return a.fiAge - b.fiAge;
        if (a.stepUpPercent !== b.stepUpPercent) return a.stepUpPercent - b.stepUpPercent;
        return a.sipIncreasePercent - b.sipIncreasePercent;
    });

    // Step 4: Get AI recommendation
    if (solutionsForRanking.length === 0) {
        return {
            baselineFiAge,
            solutions: [],
            recommendedSolution: null,
            recommendation: null,
            skipOptimization: false,
            error: 'No improvement options found within the allowed constraints. Consider increasing your investment significantly or reducing expenses.'
        };
    }

    try {
        const { recommendation } = await getAIRecommendation(
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
    } catch (error) {
        console.error('Optimization error:', error);
        // Fallback: just return first solution
        return {
            baselineFiAge,
            solutions: solutionsForRanking,
            recommendedSolution: solutionsForRanking[0],
            recommendation: {
                recommendedIndex: 0,
                explanation: 'This solution offers the best improvement in your financial independence timeline.',
                alternatives: [],
                difficulty: 'Easy' as const
            },
            skipOptimization: false
        };
    }
};

export const useFinancialIndependencePlanner = (inputs: FinancialIndependenceInputs | null) => {
    const result = useMemo<FinancialIndependenceResult | null>(() => {
        if (!inputs) return null;

        const { currentAge, monthlyExpense, monthlyInvestment, healthStatus, existingFDCorpus = 0, existingMFCorpus = 0 } = inputs;

        // Get max age based on health status
        const maxAge = MAX_AGE_MAPPING[healthStatus] || 80;

        // Edge case: already at or past max age
        if (currentAge >= maxAge) {
            return {
                maxAge,
                currentAge,
                canBeFinanciallyIndependent: false,
                earliestFinancialIndependenceAge: null,
                yearlyBreakdown: [],
                message: `Your current age (${currentAge}) is at or exceeds the estimated max age (${maxAge}). Unable to plan for financial independence.`
            };
        }

        const yearlyBreakdown: YearlyBreakdown[] = [];
        let earliestFIBAge: number | null = null;
        let sustainableButAfter60 = false;

        // Calculate for each year from current age to max age
        for (let age = currentAge; age <= maxAge; age++) {
            const yearsFromNow = age - currentAge;
            const yearsInFinancialIndependence = maxAge - age;

            // Calculate SIP corpus at this age (no step-up for baseline)
            const sipCorpus = calculateCorpusWithVariableRate(monthlyInvestment, yearsFromNow, 0);

            // Calculate grown existing corpus at this age
            const grownExistingCorpus = calculateExistingCorpusGrowth(existingFDCorpus, existingMFCorpus, yearsFromNow);

            // Total corpus = SIP corpus + grown existing corpus
            const totalCorpus = sipCorpus + grownExistingCorpus;

            const sipReturnRate = yearsFromNow < SIP_SHORT_TERM_THRESHOLD
                ? SIP_RETURN_RATE_SHORT_TERM
                : SIP_RETURN_RATE_LONG_TERM;

            // Calculate inflation-adjusted expense at this age
            const inflationAdjustedExpense = getInflationAdjustedExpense(monthlyExpense, yearsFromNow);

            // Target withdrawal = expense + 25% lifestyle buffer
            const targetWithdrawal = inflationAdjustedExpense * (1 + LIFESTYLE_BUFFER);

            // Gross up withdrawal to account for LTCG tax
            const grossWithdrawal = targetWithdrawal / (1 - LTCG_TAX_RATE / 100);

            // Check SWP sustainability using total corpus (SIP + existing)
            let swpSustainable = false;
            let swpFinalCorpus = 0;
            let swpFinalCorpusPercentage = 0;

            if (yearsInFinancialIndependence > 0 && totalCorpus > 0) {
                const swpCheck = checkSwpSustainability(totalCorpus, grossWithdrawal, yearsInFinancialIndependence);
                swpSustainable = swpCheck.sustainable;
                swpFinalCorpus = swpCheck.finalCorpus;
                swpFinalCorpusPercentage = swpCheck.finalCorpusPercentage;
            }

            yearlyBreakdown.push({
                year: age,
                yearsFromNow,
                sipCorpus: Math.round(totalCorpus),
                sipReturnRate,
                inflationAdjustedExpense: Math.round(inflationAdjustedExpense),
                targetWithdrawal: Math.round(targetWithdrawal),
                yearsInFinancialIndependence,
                swpSustainable,
                swpFinalCorpus: Math.round(swpFinalCorpus),
                swpFinalCorpusPercentage: Math.round(swpFinalCorpusPercentage * 100) / 100
            });

            // Track earliest financial independence age (but only if <= 60)
            if (swpSustainable) {
                if (age <= 60) {
                    if (earliestFIBAge === null) {
                        earliestFIBAge = age;
                    }
                } else if (earliestFIBAge === null) {
                    sustainableButAfter60 = true;
                }
            }
        }

        // Generate result message
        let message: string;
        if (earliestFIBAge === currentAge) {
            message = `🎉 Great news! You can be financially independent immediately at age ${currentAge}. Your current corpus and investments are sufficient to sustain your lifestyle until age ${maxAge}.`;
        } else if (earliestFIBAge !== null) {
            const yearsToFI = earliestFIBAge - currentAge;
            message = `✅ You can be financially independent at age ${earliestFIBAge} (in ${yearsToFI} years). Keep investing ₹${monthlyInvestment.toLocaleString('en-IN')} per month to achieve this goal.`;
        } else if (sustainableButAfter60) {
            message = `Your current plan doesn't reach financial independence before age 60.`;
        } else {
            message = `⚠️ Based on your current investment of ₹${monthlyInvestment.toLocaleString('en-IN')}/month and expenses of ₹${monthlyExpense.toLocaleString('en-IN')}/month, you cannot achieve financial independence before age ${maxAge} with the current configuration. Consider increasing your monthly investment or reducing your expenses.`;
        }

        return {
            maxAge,
            currentAge,
            canBeFinanciallyIndependent: earliestFIBAge !== null,
            earliestFinancialIndependenceAge: earliestFIBAge,
            yearlyBreakdown,
            message
        };
    }, [inputs]);

    return result;
};
