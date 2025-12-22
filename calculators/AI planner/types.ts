// Retirement Planning Types

export interface RetirementInputs {
    currentAge: number;
    monthlyExpense: number;
    monthlyInvestment: number;
    healthStatus: string; // 'needs_improvement' | 'generally_healthy' | 'very_healthy'
}

export interface YearlyBreakdown {
    year: number; // Actual age
    yearsFromNow: number;
    sipCorpus: number;
    sipReturnRate: number;
    inflationAdjustedExpense: number;
    targetWithdrawal: number; // With lifestyle buffer
    yearsInRetirement: number;
    swpSustainable: boolean;
    swpFinalCorpus: number;
    swpFinalCorpusPercentage: number; // Final corpus as % of initial
}

export interface RetirementResult {
    maxAge: number;
    currentAge: number;
    canRetire: boolean;
    earliestRetirementAge: number | null;
    yearlyBreakdown: YearlyBreakdown[];
    message: string;
}
