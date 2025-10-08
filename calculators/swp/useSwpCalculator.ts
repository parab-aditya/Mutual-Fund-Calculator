import { useMemo } from 'react';
import { SwpInputs, SwpResults } from './types';

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

    const results = useMemo<SwpResults>(() => {
        if (totalInvestment <= 0 || withdrawalPerMonth <= 0 || timePeriod <= 0) {
            return {
                ...EMPTY_RESULTS,
                totalInvestment: totalInvestment,
            };
        }

        const annualRate = expectedReturnRate / 100;
        const monthlyRate = Math.pow(1 + annualRate, 1 / 12) - 1;
        const totalMonths = timePeriod * 12;

        let finalValue = totalInvestment;
        let totalWithdrawn = 0;
        let monthsWithdrawn = 0;
        let corpusDepleted = false;

        for (let month = 1; month <= totalMonths; month++) {
            // Investment grows
            finalValue *= (1 + monthlyRate);

            if (!corpusDepleted) {
                if (finalValue >= withdrawalPerMonth) {
                    // Full withdrawal is possible
                    monthsWithdrawn++;
                    totalWithdrawn += withdrawalPerMonth;
                } else {
                    // Partial withdrawal, after this corpus is depleted
                    if (finalValue > 0) {
                        monthsWithdrawn++;
                        totalWithdrawn += finalValue;
                    }
                    corpusDepleted = true;
                }
            }
            
            // The withdrawal attempt happens every month regardless, for the simulation
            finalValue -= withdrawalPerMonth;
        }


        return {
            totalInvestment: totalInvestment,
            totalWithdrawal: totalWithdrawn,
            numberOfWithdrawals: monthsWithdrawn,
            finalValue: finalValue,
        };

    }, [totalInvestment, withdrawalPerMonth, expectedReturnRate, timePeriod]);

    return { results };
};
