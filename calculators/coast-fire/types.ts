export interface CoastFireInputs {
    monthlyInvestment: number;
    goalCorpus: number;
    returnRate: number;
    stepUpPercentage: number;
}

export interface CoastFireResults {
    yearsToGoal: number;
    monthsToGoal: number;
    totalInvested: number;
    finalCorpus: number;
    goalReached: boolean;
}

export interface CoastFireGrowthData {
    year: number;
    investedAmount: number;
    totalValue: number;
}

// Goal corpus options in rupees
export const GOAL_CORPUS_OPTIONS = [
    { label: '25L', value: 2500000 },
    { label: '50L', value: 5000000 },
    { label: '1Cr', value: 10000000 },
    { label: '2Cr', value: 20000000 },
    { label: '5Cr', value: 50000000 },
    { label: '10Cr', value: 100000000 },
    { label: '20Cr', value: 200000000 },
    { label: '50Cr', value: 500000000 },
    { label: '100Cr', value: 1000000000 },
];
