import { useMemo } from 'react';
import { SwpInputs, SwpResults, SwpGrowthData, SwpMonthlyData } from './types';

const EMPTY_RESULTS: SwpResults = {
    totalInvestment: 0,
    totalWithdrawal: 0,
    numberOfWithdrawals: 0,
    finalValue: 0,
    inflationAdjustedFinalValue: 0,
};

export const calculateSwpSeries = (
    totalInvestment: number,
    withdrawalPerMonth: number,
    withdrawalStepUpPercentage: number,
    expectedReturnRate: number,
    timePeriod: number,
    inflationRate: number = 0
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
    const annualInflationRate = inflationRate / 100;
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

    // Inflation adjustment for final value
    const inflationAdjustedFinalValue = inflationRate !== 0
        ? currentBalance / Math.pow(1 + annualInflationRate, timePeriod)
        : currentBalance;

    const finalResults: SwpResults = {
        totalInvestment: totalInvestment,
        totalWithdrawal: Math.round(totalWithdrawnFromCorpus),
        numberOfWithdrawals: monthsWithdrawn,
        finalValue: Math.round(currentBalance),
        inflationAdjustedFinalValue: Math.round(inflationAdjustedFinalValue),
    };

    // Loop for detailed monthly table (stops at depletion)
    let monthlyBalance = totalInvestment;
    let monthlyWithdrawal = withdrawalPerMonth;
    for (let month = 1; month <= totalMonths; month++) {
        const beginningBalance = monthlyBalance;
        if (beginningBalance <= 0) break;

        const returns = beginningBalance * monthlyRate;
        const balanceAfterReturns = beginningBalance + returns;

        // Inflation adjusted withdrawal for this month
        // We discount back to t=0. Month 1 is 1 month away.
        const discountFactor = Math.pow(1 + annualInflationRate, month / 12);

        let finalWithdrawal = 0;
        let endingBalance = 0;

        if (monthlyWithdrawal > balanceAfterReturns) {
            finalWithdrawal = balanceAfterReturns > 0 ? balanceAfterReturns : 0;
            endingBalance = 0;
        } else {
            finalWithdrawal = monthlyWithdrawal;
            endingBalance = balanceAfterReturns - monthlyWithdrawal;
        }

        const inflationAdjustedWithdrawal = inflationRate !== 0
            ? finalWithdrawal / discountFactor
            : finalWithdrawal;

        monthlyBreakdown.push({
            month,
            beginningBalance: Math.round(beginningBalance),
            monthlyReturns: Math.round(returns),
            monthlyWithdrawal: Math.round(finalWithdrawal),
            endingBalance: Math.round(endingBalance),
            inflationAdjustedWithdrawal: Math.round(inflationAdjustedWithdrawal),
        });

        if (endingBalance <= 0) break;

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
    timePeriod: number,
    inflationRate: number = 0 // Added for interface consistency, though logically max withdrawal nominal logic might stay same or need adjustment? 
    // User request didn't ask to change max withdrawal logic based on inflation, just to add slider. 
    // Sticking to nominal max withdrawal is safer unless required.
    // Actually max withdrawal is about not running out of money, which depends on nominal returns.
    // Inflation affects purchasing power, not the nominal balance depletion (unless expenses grow with inflation, which is step-up).
    // So inflationRate here is just to satisfy the call signature if we were to pass it, but effectively unused for the nominal "Max Withdrawal" calculation.
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
    high = totalInvestment * Math.pow(1 + expectedReturnRate / 100, timePeriod);

    while (high - low > precision) {
        const mid = (low + high) / 2;
        const { results } = calculateSwpSeries(
            totalInvestment,
            mid,
            withdrawalStepUpPercentage,
            expectedReturnRate,
            timePeriod,
            inflationRate
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
        timePeriod,
        inflationRate
    } = inputs;

    const { results, growthData, monthlyData } = useMemo<{ results: SwpResults; growthData: SwpGrowthData[]; monthlyData: SwpMonthlyData[] }>(() => {
        return calculateSwpSeries(
            totalInvestment,
            withdrawalPerMonth,
            withdrawalStepUpPercentage,
            expectedReturnRate,
            timePeriod,
            inflationRate
        );
    }, [totalInvestment, withdrawalPerMonth, withdrawalStepUpPercentage, expectedReturnRate, timePeriod, inflationRate]);

    return { results, growthData, monthlyData };
};
