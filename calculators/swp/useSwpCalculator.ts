import { useMemo } from 'react';
import { SwpInputs, SwpResults, SwpGrowthData } from './types';

const EMPTY_RESULTS: SwpResults = {
    totalInvestment: 0,
    totalWithdrawal: 0,
    numberOfWithdrawals: 0,
    finalValue: 0,
};

export const useSwpCalculator = (inputs: SwpInputs) => {
    const {
        totalInvestment,
        withdrawalPerMonth,
        expectedReturnRate,
        timePeriod
    } = inputs;

    const { results, growthData } = useMemo<{ results: SwpResults; growthData: SwpGrowthData[] }>(() => {
        if (totalInvestment <= 0 || timePeriod <= 0) {
            return {
                results: {
                    ...EMPTY_RESULTS,
                    totalInvestment: totalInvestment,
                },
                growthData: []
            };
        }

        const annualRate = expectedReturnRate / 100;
        const monthlyRate = Math.pow(1 + annualRate, 1 / 12) - 1;
        const totalMonths = timePeriod * 12;

        const yearlyData: SwpGrowthData[] = [];

        let currentBalance = totalInvestment;
        let totalWithdrawnFromCorpus = 0;
        let monthsWithdrawn = 0;

        for (let month = 1; month <= totalMonths; month++) {
            // Investment grows for the month
            currentBalance *= (1 + monthlyRate);

            // Process withdrawal
            if (currentBalance > 0) {
                const withdrawalAmount = Math.min(currentBalance, withdrawalPerMonth);
                totalWithdrawnFromCorpus += withdrawalAmount;
                 if (withdrawalAmount > 0) {
                    monthsWithdrawn++;
                 }
            }
             // The withdrawal is attempted every month, reducing the balance.
            currentBalance -= withdrawalPerMonth;

            // Record data at the end of each year
            if (month % 12 === 0) {
                yearlyData.push({
                    year: month / 12,
                    balance: Math.round(currentBalance),
                    totalWithdrawal: Math.round(totalWithdrawnFromCorpus),
                    initialInvestment: totalInvestment,
                });
            }
        }

        const finalResults: SwpResults = {
            totalInvestment: totalInvestment,
            totalWithdrawal: Math.round(totalWithdrawnFromCorpus),
            numberOfWithdrawals: monthsWithdrawn,
            finalValue: Math.round(currentBalance),
        };

        return { results: finalResults, growthData: yearlyData };

    }, [totalInvestment, withdrawalPerMonth, expectedReturnRate, timePeriod]);

    return { results, growthData };
};
