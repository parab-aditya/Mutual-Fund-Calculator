import { useMemo } from 'react';
import { SwpInputs, SwpResults, SwpGrowthData, SwpMonthlyData } from './types';

const EMPTY_RESULTS: SwpResults = {
    totalInvestment: 0,
    totalWithdrawal: 0,
    numberOfWithdrawals: 0,
    finalValue: 0,
};

export const calculateSwpSeries = (
    totalInvestment: number,
    withdrawalPerMonth: number,
    withdrawalStepUpPercentage: number,
    expectedReturnRate: number,
    timePeriod: number
) => {
    if (totalInvestment <= 0 || timePeriod <= 0) {
        return {
            results: {
                ...EMPTY_RESULTS,
                totalInvestment: totalInvestment,
            },
            growthData: [],
            monthlyData: []
        };
    }

    const annualRate = expectedReturnRate / 100;
    const monthlyRate = Math.pow(1 + annualRate, 1 / 12) - 1;
    const totalMonths = timePeriod * 12;
    const stepUpRate = withdrawalStepUpPercentage / 100;

    const yearlyData: SwpGrowthData[] = [];
    const monthlyBreakdown: SwpMonthlyData[] = [];

    // Main calculation loop for summary results and yearly data (allows negative balance)
    let currentBalance = totalInvestment;
    let totalWithdrawnFromCorpus = 0;
    let monthsWithdrawn = 0;
    let currentWithdrawalAmount = withdrawalPerMonth;

    for (let month = 1; month <= totalMonths; month++) {
        // Investment grows for the month
        currentBalance *= (1 + monthlyRate);

        // Process withdrawal
        if (currentBalance > 0) {
            const withdrawalAmount = Math.min(currentBalance, currentWithdrawalAmount);
            totalWithdrawnFromCorpus += withdrawalAmount;
             if (withdrawalAmount > 0) {
                monthsWithdrawn++;
             }
        }
         // The withdrawal is attempted every month, reducing the balance.
        currentBalance -= currentWithdrawalAmount;

        // Record data and apply step-up at the end of each year
        if (month % 12 === 0) {
            yearlyData.push({
                year: month / 12,
                balance: Math.round(currentBalance),
                totalWithdrawal: Math.round(totalWithdrawnFromCorpus),
                initialInvestment: totalInvestment,
            });
            
            if (stepUpRate > 0) {
              currentWithdrawalAmount *= (1 + stepUpRate);
            }
        }
    }

    const finalResults: SwpResults = {
        totalInvestment: totalInvestment,
        totalWithdrawal: Math.round(totalWithdrawnFromCorpus),
        numberOfWithdrawals: monthsWithdrawn,
        finalValue: Math.round(currentBalance),
    };
    
    // Loop for detailed monthly table (stops at depletion)
    let monthlyBalance = totalInvestment;
    let monthlyWithdrawal = withdrawalPerMonth;
    for (let month = 1; month <= totalMonths; month++) {
        const beginningBalance = monthlyBalance;
        if (beginningBalance <= 0) break;

        const returns = beginningBalance * monthlyRate;
        const balanceAfterReturns = beginningBalance + returns;

        if (monthlyWithdrawal > balanceAfterReturns) {
            const finalWithdrawal = balanceAfterReturns > 0 ? balanceAfterReturns : 0;
            monthlyBreakdown.push({
                month,
                beginningBalance: Math.round(beginningBalance),
                monthlyReturns: Math.round(returns),
                monthlyWithdrawal: Math.round(finalWithdrawal),
                endingBalance: 0,
            });
            break;
        }
        
        const endingBalance = balanceAfterReturns - monthlyWithdrawal;

        monthlyBreakdown.push({
            month,
            beginningBalance: Math.round(beginningBalance),
            monthlyReturns: Math.round(returns),
            monthlyWithdrawal: Math.round(monthlyWithdrawal),
            endingBalance: Math.round(endingBalance),
        });

        monthlyBalance = endingBalance;

        if (month % 12 === 0 && stepUpRate > 0) {
            monthlyWithdrawal *= (1 + stepUpRate);
        }
    }

    return { results: finalResults, growthData: yearlyData, monthlyData: monthlyBreakdown };
};

export const calculateMaxWithdrawal = (
    totalInvestment: number,
    withdrawalStepUpPercentage: number,
    expectedReturnRate: number,
    timePeriod: number
): number => {
    // Binary search for max withdrawal
    let low = 0;
    let high = totalInvestment; // Upper bound can be refined, but totalInvestment is a safe start
    let maxWithdrawal = 0;
    const precision = 10; // Accurate to within 10 rupees

    // Heuristic for better upper bound: 
    // If return is 0, max withdrawal is Investment / Months.
    // If return is high, it could be higher.
    // Let's just use a safe high enough number. 
    // If we withdraw everything in first month, it's totalInvestment. 
    // If we withdraw monthly, it could be slightly more than totalInvestment/totalMonths if returns are positive.
    // A safe upper bound is TotalInvestment * (1 + Rate)^Time
    high = totalInvestment * Math.pow(1 + expectedReturnRate/100, timePeriod);

    while (high - low > precision) {
        const mid = (low + high) / 2;
        const { results } = calculateSwpSeries(
            totalInvestment,
            mid,
            withdrawalStepUpPercentage,
            expectedReturnRate,
            timePeriod
        );

        if (results.finalValue >= 0) {
            maxWithdrawal = mid;
            low = mid;
        } else {
            high = mid;
        }
    }

    return Math.floor(maxWithdrawal);
};

export const useSwpCalculator = (inputs: SwpInputs) => {
    const {
        totalInvestment,
        withdrawalPerMonth,
        withdrawalStepUpPercentage,
        expectedReturnRate,
        timePeriod
    } = inputs;

    const { results, growthData, monthlyData } = useMemo<{ results: SwpResults; growthData: SwpGrowthData[]; monthlyData: SwpMonthlyData[] }>(() => {
        return calculateSwpSeries(
            totalInvestment,
            withdrawalPerMonth,
            withdrawalStepUpPercentage,
            expectedReturnRate,
            timePeriod
        );
    }, [totalInvestment, withdrawalPerMonth, withdrawalStepUpPercentage, expectedReturnRate, timePeriod]);

    return { results, growthData, monthlyData };
};
