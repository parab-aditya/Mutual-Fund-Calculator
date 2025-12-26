import { useMemo } from 'react';
import { FinancialIndependenceInputs, YearlyBreakdown, FinancialIndependenceResult } from './types';
import {
    MAX_AGE_MAPPING,
    SIP_RETURN_RATE_SHORT_TERM,
    SIP_RETURN_RATE_LONG_TERM,
    SIP_SHORT_TERM_THRESHOLD,
    LIFESTYLE_BUFFER,
    LTCG_TAX_RATE,
} from './constants';
import {
    calculateExistingCorpusGrowth,
    calculateCorpusWithVariableRate,
    getInflationAdjustedExpense,
    checkSwpSustainability,
    calculateMinimumInvestmentForFI,
} from './utils/calculationUtils';

// Re-export for backward compatibility
export { calculateExistingCorpusGrowth, calculateCorpusWithVariableRate, calculateMinimumInvestmentForFI };

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
