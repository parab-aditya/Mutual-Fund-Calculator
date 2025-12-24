// Financial Independence Planning Types

export interface FinancialIndependenceInputs {
    currentAge: number;
    monthlyExpense: number;
    monthlyInvestment: number;
    healthStatus: string; // 'needs_improvement' | 'generally_healthy' | 'very_healthy'
    runOptimization?: boolean; // Whether to run optimization
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

// Optimization solution candidate
export interface OptimizationSolution {
    fiAge: number;
    stepUpPercent: number;   // Annual step-up percentage (0, 5, 7, 10)
    sipIncreasePercent: number; // One-time SIP increase (0, 5, 10, 15, 20)
    newMonthlySip: number; // Calculated SIP after increase
    improvementYears: number; // Years improved from baseline
}

// Difficulty level for AI recommendations
export type DifficultyLevel = 'Easy' | 'Moderate' | 'Aggressive';

// AI recommendation response
export interface AIRecommendation {
    recommendedIndex: number;  // Index of recommended solution
    explanation: string;
    alternatives: string[];
    difficulty: DifficultyLevel; // Difficulty of the recommended change
}

// Full optimization result
export interface OptimizationResult {
    baselineFiAge: number | null;
    solutions: OptimizationSolution[];
    recommendedSolution: OptimizationSolution | null;
    recommendation: AIRecommendation | null;
    skipOptimization: boolean; // True if baseline <= 40
    skipReason?: string;
    isLoading?: boolean;
    error?: string;
}

export interface FinancialIndependenceResult {
    maxAge: number;
    currentAge: number;
    canBeFinanciallyIndependent: boolean;
    earliestFinancialIndependenceAge: number | null;
    yearlyBreakdown: YearlyBreakdown[];
    message: string;
    optimization?: OptimizationResult; // Optimization results
}
