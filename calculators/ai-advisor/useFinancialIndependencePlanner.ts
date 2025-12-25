import { useMemo } from 'react';
import { FinancialIndependenceInputs, YearlyBreakdown, FinancialIndependenceResult, OptimizationSolution, OptimizationResult } from './types';
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
    FD_ANNUAL_GROWTH_RATE,
    MF_ANNUAL_GROWTH_RATE,
} from './constants';
import { calculateSipCorpus } from '../sip/useSipCalculator';
import { calculateSwpSeries } from '../swp/useSwpCalculator';
import { getAIRecommendation } from './geminiService';

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
 * Now supports annual step-up (DRY: reuses calculateSipCorpus which has step-up support)
 */
export const calculateCorpusWithVariableRate = (
    monthlyInvestment: number,
    years: number,
    stepUpPercent: number = 0
): number => {
    if (years <= 0) return 0;

    if (years < SIP_SHORT_TERM_THRESHOLD) {
        // Use short-term rate for all years
        const result = calculateSipCorpus(monthlyInvestment, SIP_RETURN_RATE_SHORT_TERM, years, stepUpPercent);
        return result.totalValue;
    } else {
        // First 7 years at 12%, rest at 14%
        // Calculate corpus after 7 years at 12% WITH step-up
        const after7Years = calculateSipCorpus(monthlyInvestment, SIP_RETURN_RATE_SHORT_TERM, SIP_SHORT_TERM_THRESHOLD, stepUpPercent);

        // Calculate what the monthly SIP would be after 7 years of step-up
        const sipAfter7Years = monthlyInvestment * Math.pow(1 + stepUpPercent / 100, SIP_SHORT_TERM_THRESHOLD);

        // Remaining years at 14% - continue with the stepped-up SIP
        const remainingYears = years - SIP_SHORT_TERM_THRESHOLD;

        // Use calculateSipCorpus for remaining period, but we need to compound existing corpus too
        const remainingResult = calculateSipCorpus(sipAfter7Years, SIP_RETURN_RATE_LONG_TERM, remainingYears, stepUpPercent);

        // Compound existing corpus for remaining period
        const existingCorpusGrowth = after7Years.totalValue * Math.pow(1 + SIP_RETURN_RATE_LONG_TERM / 100, remainingYears);

        return existingCorpusGrowth + remainingResult.totalValue;
    }
};

/**
 * Calculate inflation-adjusted monthly expense for a given year
 */
const getInflationAdjustedExpense = (
    currentExpense: number,
    yearsFromNow: number
): number => {
    return currentExpense * Math.pow(1 + INFLATION_RATE / 100, yearsFromNow);
};

/**
 * Calculate minimum monthly investment needed to achieve FI by a target age.
 * Uses binary search with checkSwpSustainability() to find the exact minimum corpus,
 * ensuring consistency with the main FI calculation logic.
 * Returns null if calculation is not possible (e.g., already past target age).
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
    // Use binary search for efficiency - this ensures we use the SAME logic as calculateFiAge
    let minCorpus = grossWithdrawal * 12 * 10; // Start with 10x annual withdrawal
    let maxCorpus = grossWithdrawal * 12 * 50; // Max 50x annual withdrawal
    let requiredCorpus = minCorpus;

    // Binary search to find minimum sustainable corpus
    while (maxCorpus - minCorpus > 1000) { // Precision: within ₹1000
        const midCorpus = Math.floor((minCorpus + maxCorpus) / 2);
        const swpCheck = checkSwpSustainability(midCorpus, grossWithdrawal, yearsInRetirement);

        if (swpCheck.sustainable) {
            requiredCorpus = midCorpus;
            maxCorpus = midCorpus; // Try lower corpus
        } else {
            minCorpus = midCorpus; // Need higher corpus
        }
    }

    // Final verification - ensure the corpus is actually sustainable
    const finalCheck = checkSwpSustainability(requiredCorpus, grossWithdrawal, yearsInRetirement);
    if (!finalCheck.sustainable) {
        requiredCorpus = maxCorpus; // Use the higher bound if needed
    }

    // Calculate how much corpus is still needed from SIP after existing corpus grows
    const corpusNeededFromSip = Math.max(0, requiredCorpus - grownExistingCorpus);

    // If existing corpus already covers required corpus, no additional SIP needed
    if (corpusNeededFromSip <= 0) {
        return { minimumInvestment: 0, requiredCorpus };
    }

    // Calculate required monthly SIP using binary search with calculateCorpusWithVariableRate
    // This ensures we use the SAME variable rate logic (12% for <7 years, 14% for >=7 years)
    let minSip = 1000;
    let maxSip = corpusNeededFromSip / (yearsToFI * 12); // Upper bound: save remaining corpus linearly
    let minimumInvestment = minSip;

    // Binary search to find minimum SIP that generates corpusNeededFromSip
    while (maxSip - minSip > 100) { // Precision: within ₹100
        const midSip = Math.floor((minSip + maxSip) / 2);
        const generatedCorpus = calculateCorpusWithVariableRate(midSip, yearsToFI, 0);

        if (generatedCorpus >= corpusNeededFromSip) {
            minimumInvestment = midSip;
            maxSip = midSip; // Try lower SIP
        } else {
            minSip = midSip; // Need higher SIP
        }
    }

    // Final verification - ensure the SIP generates enough corpus
    const finalCorpus = calculateCorpusWithVariableRate(minimumInvestment, yearsToFI, 0);
    if (finalCorpus < corpusNeededFromSip) {
        minimumInvestment = Math.ceil(maxSip);
    }

    return { minimumInvestment, requiredCorpus };
};

/**
 * Check if SWP is sustainable from financial independence year to max age
 * Returns true if final corpus >= 10% of initial corpus
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
 */
const calculateFiAge = (
    monthlyInvestment: number,
    monthlyExpense: number,
    currentAge: number,
    maxAge: number,
    stepUpPercent: number = 0,
    existingFDCorpus: number = 0,
    existingMFCorpus: number = 0
): number | null => {
    for (let age = currentAge; age <= maxAge; age++) {
        const yearsFromNow = age - currentAge;
        const yearsInFinancialIndependence = maxAge - age;

        if (yearsInFinancialIndependence <= 0) continue;

        // Calculate SIP corpus at this age with step-up
        const sipCorpus = calculateCorpusWithVariableRate(monthlyInvestment, yearsFromNow, stepUpPercent);

        // Calculate grown existing corpus at this age
        const grownExistingCorpus = calculateExistingCorpusGrowth(existingFDCorpus, existingMFCorpus, yearsFromNow);

        // Total corpus = SIP corpus + grown existing corpus
        const totalCorpus = sipCorpus + grownExistingCorpus;

        // Calculate inflation-adjusted expense at this age
        const inflationAdjustedExpense = getInflationAdjustedExpense(monthlyExpense, yearsFromNow);

        // Target withdrawal = expense + 25% lifestyle buffer
        const targetWithdrawal = inflationAdjustedExpense * (1 + LIFESTYLE_BUFFER);

        // Gross up withdrawal to account for LTCG tax
        // User wants to receive targetWithdrawal net, so they need to withdraw more before tax
        const grossWithdrawal = targetWithdrawal / (1 - LTCG_TAX_RATE / 100);

        // Check SWP sustainability
        if (totalCorpus > 0) {
            const swpCheck = checkSwpSustainability(totalCorpus, grossWithdrawal, yearsInFinancialIndependence);
            if (swpCheck.sustainable && age <= 60) {
                return age;
            }
        }
    }
    return null;
};

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
            // User wants to receive targetWithdrawal net, so they need to withdraw more before tax
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
                sipCorpus: Math.round(totalCorpus), // Now includes existing corpus
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
                    // It becomes sustainable only after 60
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
