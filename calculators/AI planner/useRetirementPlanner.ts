import { useMemo } from 'react';
import { RetirementInputs, YearlyBreakdown, RetirementResult } from './types';
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
 * Check if SWP is sustainable from retirement year to max age
 * Returns true if final corpus >= 10% of initial corpus
 */
const checkSwpSustainability = (
    corpus: number,
    monthlyWithdrawal: number,
    yearsInRetirement: number
): { sustainable: boolean; finalCorpus: number; finalCorpusPercentage: number } => {
    if (corpus <= 0 || yearsInRetirement <= 0) {
        return { sustainable: false, finalCorpus: 0, finalCorpusPercentage: 0 };
    }

    const swpResult = calculateSwpSeries(
        corpus,
        monthlyWithdrawal,
        SWP_STEP_UP_PERCENTAGE,
        SWP_RETURN_RATE,
        yearsInRetirement,
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

export const useRetirementPlanner = (inputs: RetirementInputs | null) => {
    const result = useMemo<RetirementResult | null>(() => {
        if (!inputs) return null;

        const { currentAge, monthlyExpense, monthlyInvestment, healthStatus } = inputs;

        // Get max age based on health status
        const maxAge = MAX_AGE_MAPPING[healthStatus] || 80;

        // Edge case: already at or past max age
        if (currentAge >= maxAge) {
            return {
                maxAge,
                currentAge,
                canRetire: false,
                earliestRetirementAge: null,
                yearlyBreakdown: [],
                message: `Your current age (${currentAge}) is at or exceeds the estimated max age (${maxAge}). Unable to plan retirement.`
            };
        }

        const yearlyBreakdown: YearlyBreakdown[] = [];
        let earliestRetirementAge: number | null = null;

        // Calculate for each year from current age to max age
        for (let age = currentAge; age <= maxAge; age++) {
            const yearsFromNow = age - currentAge;
            const yearsInRetirement = maxAge - age;

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

            if (yearsInRetirement > 0 && sipCorpus > 0) {
                const swpCheck = checkSwpSustainability(sipCorpus, targetWithdrawal, yearsInRetirement);
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
                yearsInRetirement,
                swpSustainable,
                swpFinalCorpus: Math.round(swpFinalCorpus),
                swpFinalCorpusPercentage: Math.round(swpFinalCorpusPercentage * 100) / 100
            });

            // Track earliest retirement age
            if (swpSustainable && earliestRetirementAge === null) {
                earliestRetirementAge = age;
            }
        }

        // Generate result message
        let message: string;
        if (earliestRetirementAge === currentAge) {
            message = `🎉 Great news! You can retire immediately at age ${currentAge}. Your current corpus and investments are sufficient to sustain your lifestyle until age ${maxAge}.`;
        } else if (earliestRetirementAge !== null) {
            const yearsToRetirement = earliestRetirementAge - currentAge;
            message = `✅ You can retire at age ${earliestRetirementAge} (in ${yearsToRetirement} years). Keep investing ₹${monthlyInvestment.toLocaleString('en-IN')} per month to achieve this goal.`;
        } else {
            message = `⚠️ Based on your current investment of ₹${monthlyInvestment.toLocaleString('en-IN')}/month and expenses of ₹${monthlyExpense.toLocaleString('en-IN')}/month, you cannot retire before age ${maxAge} with the current configuration. Consider increasing your monthly investment or reducing your expenses.`;
        }

        return {
            maxAge,
            currentAge,
            canRetire: earliestRetirementAge !== null,
            earliestRetirementAge,
            yearlyBreakdown,
            message
        };
    }, [inputs]);

    return result;
};
