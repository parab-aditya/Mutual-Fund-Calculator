export interface SwpInputs {
    totalInvestment: number;
    withdrawalPerMonth: number;
    expectedReturnRate: number;
    timePeriod: number;
}

export interface SwpResults {
    totalInvestment: number;
    totalWithdrawal: number;
    numberOfWithdrawals: number;
    finalValue: number;
}

export interface SwpGrowthData {
  year: number;
  balance: number;
  totalWithdrawal: number;
  initialInvestment: number;
}
