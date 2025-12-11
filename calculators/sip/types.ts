export interface SipInputs {
    monthlyInvestment: number;
    stepUpPercentage: number;
    lumpsumAmount: number;
    returnRate: number;
    lumpsumReturnRate: number;
    timePeriod: number;
    inflationRate: number;
}

export interface ResultBreakdown {
    investedAmount: number;
    estimatedReturns: number;
    totalValue: number;
}

export interface SipTotalResults {
    investedAmount: number;
    estimatedReturns: number;
    totalValue: number;
    inflationAdjustedTotalValue: number;
    inflationAdjustedInvestedAmount: number;
    inflationAdjustedEstimatedReturns: number;
    nominalXIRR: number;
    realXIRR: number;
    nominalCAGR: number;
    realCAGR: number;
    sip: ResultBreakdown;
    lumpsum: ResultBreakdown;
}

export interface SipGrowthData {
    year: number;
    investedAmount: number;
    estimatedReturns: number;
    totalValue: number;
    sipValue: number;
    lumpsumValue: number;
    inflationAdjustedTotalValue: number;
    annualSipAmount: number;
    annualReturns: number;
}