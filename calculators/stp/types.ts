export type TransferFrequency = 'Monthly' | 'Weekly' | '15-days' | 'Quarterly' | 'Yearly';

export interface StpInputs {
    investmentAmount: number;
    sourceReturnRate: number;
    transferAmount: number;
    transferFrequency: TransferFrequency;
    timePeriod: number;
    destinationReturnRate: number;
}

export interface StpResults {
    investedAmount: number;
    sourceFundValue: number;
    destinationFundValue: number;
    totalValue: number;
}

export interface StpGrowthData {
  year: number;
  sourceFundValue: number;
  destinationFundValue: number;
  totalValue: number;
}
