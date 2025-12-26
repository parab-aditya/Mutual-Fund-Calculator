import { useMemo } from 'react';
import { SwpInputs, SwpResults, SwpGrowthData, SwpMonthlyData } from './types';

// Re-export the pure calculation functions for backward compatibility
export { calculateSwpSeries, calculateMaxWithdrawal } from './swpCalculations';

// Import for internal use
import { calculateSwpSeries } from './swpCalculations';


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
