/**
 * Shared utility functions for calculating plan display metrics
 * Eliminates duplicate calculation logic between CurrentPlanCard and AIPlanCard
 */

import { INFLATION_RATE } from '../constants';
import { PlanDisplayData } from '../types';

/**
 * Calculate plan display metrics from corpus and financial data
 */
export function calculatePlanMetrics(
    corpus: number,
    targetWithdrawal: number,
    currentAge: number,
    fiAge: number,
    monthlyExpense: number,
    maxAge: number
): PlanDisplayData {
    const yearsToFI = fiAge - currentAge;
    const inflationRate = INFLATION_RATE / 100;

    // Use target withdrawal directly (matches FI calculation logic)
    // This ensures consistency: the displayed withdrawal is exactly what was used
    // to determine FI sustainability (including 8% annual step-up)
    const monthlyWithdrawal = targetWithdrawal;

    // Calculate today's value (inflation-adjusted)
    const todayValue = monthlyWithdrawal / Math.pow(1 + inflationRate, yearsToFI);

    // Calculate lifestyle improvement percentage
    const lifestyleImprovement = ((todayValue / monthlyExpense) - 1) * 100;

    return {
        fiAge,
        yearsToFI,
        finalCorpus: Math.round(corpus),
        monthlyWithdrawal: Math.round(monthlyWithdrawal),
        todayValue: Math.round(todayValue),
        lifestyleImprovement: Math.round(lifestyleImprovement),
        maxAge,
    };
}

/**
 * Format number in smart format (k, L, Cr)
 */
export function formatSmartNumber(value: number): string {
    if (value >= 10000000) {
        return `${(value / 10000000).toFixed(2)}Cr`;
    }
    if (value >= 100000) {
        return `${(value / 100000).toFixed(2)}L`;
    }
    if (value >= 1000) {
        return `${(value / 1000).toFixed(1)}k`;
    }
    return Math.floor(value).toString();
}

/**
 * Get proposed change text based on SIP changes
 */
export function getProposedChangeText(
    currentSip: number,
    newSip: number,
    stepUpPercent: number,
    sipIncreasePercent: number
): string {
    const hasStepUp = stepUpPercent > 0;
    const hasSipIncrease = sipIncreasePercent > 0;

    if (hasStepUp && hasSipIncrease) {
        return `Increase your SIP from ₹${currentSip.toLocaleString('en-IN')} to ₹${newSip.toLocaleString('en-IN')} per month, and increase it by ${stepUpPercent}% every year.`;
    } else if (hasStepUp) {
        return `Keep investing ₹${currentSip.toLocaleString('en-IN')} per month but increase it by ${stepUpPercent}% every year.`;
    } else if (hasSipIncrease) {
        return `Increase your SIP from ₹${currentSip.toLocaleString('en-IN')} to ₹${newSip.toLocaleString('en-IN')} per month.`;
    }
    return 'Continue with your current investment plan.';
}
