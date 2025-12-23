// Financial Independence Planning Types

export interface FinancialIndependenceInputs {
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
    yearsInFinancialIndependence: number;
    swpSustainable: boolean;
    swpFinalCorpus: number;
    swpFinalCorpusPercentage: number; // Final corpus as % of initial
}

export interface FinancialIndependenceResult {
    maxAge: number;
    currentAge: number;
    canBeFinanciallyIndependent: boolean;
    earliestFinancialIndependenceAge: number | null;
    yearlyBreakdown: YearlyBreakdown[];
    message: string;
}
