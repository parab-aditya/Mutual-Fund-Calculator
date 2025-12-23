import { useMemo } from 'react';
import { FinancialIndependenceInputs, YearlyBreakdown, FinancialIndependenceResult } from './types';
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
} from './constants';
import { calculateSipCorpus } from '../sip/useSipCalculator';
import { calculateSwpSeries } from '../swp/useSwpCalculator';

/**
 * Calculate SIP corpus for a given number of years, using appropriate return rate.
 * Uses 12% for < 7 years, 14% for >= 7 years
 */
const calculateCorpusWithVariableRate = (
    monthlyInvestment: number,
    years: number
): number => {
    if (years <= 0) return 0;

    if (years < SIP_SHORT_TERM_THRESHOLD) {
        // Use short-term rate for all years
        const result = calculateSipCorpus(monthlyInvestment, SIP_RETURN_RATE_SHORT_TERM, years);
        return result.totalValue;
    } else {
        // First 7 years at 12%, rest at 14%
        // Calculate corpus after 7 years at 12%
        const after7Years = calculateSipCorpus(monthlyInvestment, SIP_RETURN_RATE_SHORT_TERM, SIP_SHORT_TERM_THRESHOLD);

        // Remaining years at 14%
        const remainingYears = years - SIP_SHORT_TERM_THRESHOLD;
        const monthlyRate = Math.pow(1 + SIP_RETURN_RATE_LONG_TERM / 100, 1 / 12) - 1;

        // Continue SIP with the existing corpus growing at 14%
        let corpus = after7Years.totalValue;
        for (let month = 1; month <= remainingYears * 12; month++) {
            corpus = (corpus + monthlyInvestment) * (1 + monthlyRate);
        }

        return corpus;
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

export const useFinancialIndependencePlanner = (inputs: FinancialIndependenceInputs | null) => {
    const result = useMemo<FinancialIndependenceResult | null>(() => {
        if (!inputs) return null;

        const { currentAge, monthlyExpense, monthlyInvestment, healthStatus } = inputs;

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

            // Calculate SIP corpus at this age
            const sipCorpus = calculateCorpusWithVariableRate(monthlyInvestment, yearsFromNow);
            const sipReturnRate = yearsFromNow < SIP_SHORT_TERM_THRESHOLD
                ? SIP_RETURN_RATE_SHORT_TERM
                : SIP_RETURN_RATE_LONG_TERM;

            // Calculate inflation-adjusted expense at this age
            const inflationAdjustedExpense = getInflationAdjustedExpense(monthlyExpense, yearsFromNow);

            // Target withdrawal = expense + 25% lifestyle buffer
            const targetWithdrawal = inflationAdjustedExpense * (1 + LIFESTYLE_BUFFER);

            // Check SWP sustainability
            let swpSustainable = false;
            let swpFinalCorpus = 0;
            let swpFinalCorpusPercentage = 0;

            if (yearsInFinancialIndependence > 0 && sipCorpus > 0) {
                const swpCheck = checkSwpSustainability(sipCorpus, targetWithdrawal, yearsInFinancialIndependence);
                swpSustainable = swpCheck.sustainable;
                swpFinalCorpus = swpCheck.finalCorpus;
                swpFinalCorpusPercentage = swpCheck.finalCorpusPercentage;
            }

            yearlyBreakdown.push({
                year: age,
                yearsFromNow,
                sipCorpus: Math.round(sipCorpus),
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
            message = `Your current plan doesn’t reach financial independence before age 60.`;
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
