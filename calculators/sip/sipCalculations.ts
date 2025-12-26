/**
 * Pure SIP calculation functions - no React dependencies
 * Safe to import in Web Workers
 */

/**
 * Standalone function to calculate SIP corpus after a given number of years.
 * This can be imported and used by other modules without needing a React component.
 */
export const calculateSipCorpus = (
    monthlyInvestment: number,
    annualReturnRate: number, // as percentage, e.g., 12 for 12%
    years: number,
    stepUpPercentage: number = 0
): { totalValue: number; investedAmount: number } => {
    if (monthlyInvestment <= 0 || years <= 0) {
        return { totalValue: 0, investedAmount: 0 };
    }

    const annualRate = annualReturnRate / 100;
    if (annualRate <= -1) {
        return { totalValue: 0, investedAmount: 0 };
    }

    const stepUpRate = stepUpPercentage / 100;
    const months = years * 12;
    const monthlyRate = Math.pow(1 + annualRate, 1 / 12) - 1;

    let totalValue = 0;
    let investedAmount = 0;
    let currentMonthlySip = monthlyInvestment;

    for (let month = 1; month <= months; month++) {
        totalValue = (totalValue + currentMonthlySip) * (1 + monthlyRate);
        investedAmount += currentMonthlySip;
        if (month % 12 === 0 && month < months) {
            currentMonthlySip *= (1 + stepUpRate);
        }
    }

    return { totalValue, investedAmount };
};
