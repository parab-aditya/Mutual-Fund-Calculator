export interface SwpInputs {
  totalInvestment: number;
  withdrawalPerMonth: number;
  withdrawalStepUpPercentage: number;
  expectedReturnRate: number;
  timePeriod: number;
  inflationRate: number;
}

export interface SwpResults {
  totalInvestment: number;
  totalWithdrawal: number;
  numberOfWithdrawals: number;
  finalValue: number;
  inflationAdjustedFinalValue: number;
}

export interface SwpGrowthData {
  year: number;
  balance: number;
  totalWithdrawal: number;
  initialInvestment: number;
}

export interface SwpMonthlyData {
  month: number;
  beginningBalance: number;
  monthlyReturns: number;
  monthlyWithdrawal: number;
  endingBalance: number;
  inflationAdjustedWithdrawal: number;
}
