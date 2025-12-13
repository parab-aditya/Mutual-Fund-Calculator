import { useMemo } from 'react';
import { CoastFireInputs, CoastFireResults, CoastFireGrowthData } from './types';

const EMPTY_RESULTS: CoastFireResults = {
    yearsToGoal: 0,
    monthsToGoal: 0,
    totalInvested: 0,
    finalCorpus: 0,
    goalReached: false,
};

export const useCoastFireCalculator = (inputs: CoastFireInputs) => {
    const { monthlyInvestment, goalCorpus, returnRate, stepUpPercentage } = inputs;

    const results = useMemo<CoastFireResults>(() => {
        if (monthlyInvestment <= 0 || goalCorpus <= 0 || returnRate <= 0) {
            return EMPTY_RESULTS;
        }

        const annualRate = returnRate / 100;
        const monthlyRate = Math.pow(1 + annualRate, 1 / 12) - 1;
        const stepUpRate = stepUpPercentage / 100;

        let totalValue = 0;
        let totalInvested = 0;
        let currentMonthlySip = monthlyInvestment;
        let months = 0;
        const maxMonths = 100 * 12; // Cap at 100 years

        while (totalValue < goalCorpus && months < maxMonths) {
            totalValue = (totalValue + currentMonthlySip) * (1 + monthlyRate);
            totalInvested += currentMonthlySip;
            months++;

            // Step-up at the end of each year
            if (months % 12 === 0) {
                currentMonthlySip *= (1 + stepUpRate);
            }
        }

        const yearsToGoal = Math.floor(months / 12);
        const remainingMonths = months % 12;

        return {
            yearsToGoal,
            monthsToGoal: months,
            totalInvested: Math.round(totalInvested),
            finalCorpus: Math.round(totalValue),
            goalReached: totalValue >= goalCorpus,
        };
    }, [monthlyInvestment, goalCorpus, returnRate, stepUpPercentage]);

    const growthData = useMemo<CoastFireGrowthData[]>(() => {
        if (monthlyInvestment <= 0 || goalCorpus <= 0 || returnRate <= 0) {
            return [];
        }

        const data: CoastFireGrowthData[] = [];
        const annualRate = returnRate / 100;
        const monthlyRate = Math.pow(1 + annualRate, 1 / 12) - 1;
        const stepUpRate = stepUpPercentage / 100;

        let totalValue = 0;
        let totalInvested = 0;
        let currentMonthlySip = monthlyInvestment;

        // Calculate max years needed (cap at goalCorpus + some buffer, max 60 years)
        const maxYears = Math.min(Math.ceil(results.yearsToGoal * 1.2) + 2, 60);

        for (let year = 1; year <= maxYears; year++) {
            for (let m = 1; m <= 12; m++) {
                totalValue = (totalValue + currentMonthlySip) * (1 + monthlyRate);
                totalInvested += currentMonthlySip;
            }

            data.push({
                year,
                investedAmount: Math.round(totalInvested),
                totalValue: Math.round(totalValue),
            });

            // Stop if we've exceeded the goal
            if (totalValue >= goalCorpus) {
                break;
            }

            // Step-up for next year
            currentMonthlySip *= (1 + stepUpRate);
        }

        return data;
    }, [monthlyInvestment, goalCorpus, returnRate, stepUpPercentage, results.yearsToGoal]);

    return { results, growthData };
};
