import { useMemo } from 'react';
import { SipInputs, SipTotalResults, SipGrowthData } from './types';
import { CashFlow, firstOfMonthUTC, addMonthsUTC, xirr, deflateToBase } from '../../utils/financial';

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

const EMPTY_RESULTS: SipTotalResults = {
  investedAmount: 0,
  estimatedReturns: 0,
  totalValue: 0,
  inflationAdjustedTotalValue: 0,
  inflationAdjustedInvestedAmount: 0,
  inflationAdjustedEstimatedReturns: 0,
  nominalXIRR: Number.NaN,
  realXIRR: Number.NaN,
  nominalCAGR: Number.NaN,
  realCAGR: Number.NaN,
  sip: { investedAmount: 0, estimatedReturns: 0, totalValue: 0 },
  lumpsum: { investedAmount: 0, estimatedReturns: 0, totalValue: 0 },
};

export const useSipCalculator = (inputs: SipInputs) => {
  const {
    monthlyInvestment,
    returnRate,
    lumpsumReturnRate,
    timePeriod,
    lumpsumAmount,
    inflationRate,
    stepUpPercentage,
  } = inputs;

  const totalResults = useMemo<SipTotalResults>(() => {
    // Trivial/invalid guards
    if ((monthlyInvestment <= 0 && lumpsumAmount <= 0) || timePeriod <= 0) {
      return EMPTY_RESULTS;
    }

    const annualSipRate = returnRate / 100;
    const annualLumpsumRate = lumpsumReturnRate / 100;
    if (annualSipRate <= -1 || annualLumpsumRate <= -1) {
      return EMPTY_RESULTS;
    }

    const stepUpRate = stepUpPercentage / 100;
    const annualInflationRate = inflationRate / 100;
    if (annualInflationRate <= -1) {
      // Non-positive price level over a year is invalid
      return EMPTY_RESULTS;
    }


    const months = timePeriod * 12;
    const monthlySipRate = Math.pow(1 + annualSipRate, 1 / 12) - 1;
    const monthlyLumpsumRate = Math.pow(1 + annualLumpsumRate, 1 / 12) - 1;

    // ----- SIP (reuse standalone function for core calculation) -----
    const sipResult = calculateSipCorpus(monthlyInvestment, returnRate, timePeriod, stepUpPercentage);
    const sipTotalValue = sipResult.totalValue;
    const sipInvestedAmount = sipResult.investedAmount;
    const sipEstimatedReturns = sipTotalValue - sipInvestedAmount;

    // ----- Lumpsum (monthly compounding for consistency) -----
    const lumpsumInvestedAmount = lumpsumAmount;
    const lumpsumTotalValue = lumpsumAmount * Math.pow(1 + monthlyLumpsumRate, months);
    const lumpsumEstimatedReturns = lumpsumTotalValue - lumpsumInvestedAmount;

    // ----- Combined (nominal) -----
    const investedAmount = sipInvestedAmount + lumpsumInvestedAmount;
    const totalValue = sipTotalValue + lumpsumTotalValue;
    const estimatedReturns = totalValue - investedAmount;

    // ----- Inflation-adjusted corpus (deflate final corpus to today) -----
    const inflationAdjustedTotalValue =
      inflationRate !== 0
        ? totalValue / Math.pow(1 + annualInflationRate, timePeriod)
        : totalValue;

    // ----- Build cash flows (UTC first-of-month dates) -----
    const now = new Date();
    const startDate = firstOfMonthUTC(now);
    const flowsNominal: CashFlow[] = [];

    // Lumpsum at t0 (month index 0)
    if (lumpsumAmount !== 0) {
      flowsNominal.push({ amount: -lumpsumAmount, date: startDate });
    }

    // SIP contributions at start of each month
    let currentMonthlySipForFlow = monthlyInvestment;
    const stepUpRateForFlow = stepUpPercentage / 100;
    for (let m = 1; m <= months; m++) {
      const dt = addMonthsUTC(startDate, m - 1);
      flowsNominal.push({ amount: -currentMonthlySipForFlow, date: dt });
      if (m % 12 === 0 && m < months) {
        currentMonthlySipForFlow *= (1 + stepUpRateForFlow);
      }
    }

    // Redemption at the end (month = months)
    const endDate = addMonthsUTC(startDate, months);
    flowsNominal.push({ amount: totalValue, date: endDate });

    // ----- Nominal XIRR -----
    const nominalXIRR = xirr(flowsNominal, annualSipRate);

    // ----- Real XIRR via deflated cash flows -----
    const flowsReal: CashFlow[] = flowsNominal.map((cf) => {
      // Months-from-start is exact from construction: for redemption it's 'months',
      // for SIP at month m it's m-1; for lumpsum it's 0.
      let monthsFromStart = 0;
      if (cf.date.getTime() === startDate.getTime()) {
        monthsFromStart = 0;
      } else {
        // Since we generated dates with addMonthsUTC(startDate, k), we can compute k:
        monthsFromStart =
          (cf.date.getUTCFullYear() - startDate.getUTCFullYear()) * 12 +
          (cf.date.getUTCMonth() - startDate.getUTCMonth());
      }
      const realAmt =
        inflationRate !== 0
          ? deflateToBase(cf.amount, Math.max(0, monthsFromStart), annualInflationRate)
          : cf.amount;
      return { amount: realAmt, date: cf.date };
    });

    const realXIRR = xirr(flowsReal, Math.max(annualSipRate - annualInflationRate, -0.5));

    // ----- Real invested/returns summary from deflated flows -----
    const inflationAdjustedInvestedAmount = flowsReal
      .filter(f => f.amount < 0)
      .reduce((acc, f) => acc + Math.abs(f.amount), 0);

    const totalRealRedemption = flowsReal
      .filter(f => f.amount > 0)
      .reduce((acc, f) => acc + f.amount, 0);

    const inflationAdjustedEstimatedReturns = totalRealRedemption - inflationAdjustedInvestedAmount;

    // ----- Nominal & Real CAGR (sanity checks) -----
    const nominalCAGR =
      investedAmount > 0 && timePeriod > 0
        ? Math.pow(totalValue / investedAmount, 1 / timePeriod) - 1
        : Number.NaN;

    const realCAGR =
      inflationRate !== 0 && isFinite(nominalCAGR)
        ? (1 + nominalCAGR) / (1 + annualInflationRate) - 1
        : nominalCAGR; // if no inflation, real == nominal

    return {
      investedAmount,
      estimatedReturns,
      totalValue,
      inflationAdjustedTotalValue,          // deflated final corpus
      inflationAdjustedInvestedAmount,      // deflated total invested
      inflationAdjustedEstimatedReturns,    // real profit
      nominalXIRR,
      realXIRR,
      nominalCAGR,
      realCAGR,
      sip: {
        investedAmount: sipInvestedAmount,
        estimatedReturns: sipEstimatedReturns,
        totalValue: sipTotalValue,
      },
      lumpsum: {
        investedAmount: lumpsumInvestedAmount,
        estimatedReturns: lumpsumEstimatedReturns,
        totalValue: lumpsumTotalValue,
      },
    };
  }, [monthlyInvestment, returnRate, lumpsumReturnRate, timePeriod, lumpsumAmount, inflationRate, stepUpPercentage]);

  const growthData = useMemo<SipGrowthData[]>(() => {
    if ((monthlyInvestment <= 0 && lumpsumAmount <= 0) || timePeriod <= 0) return [];

    const data: SipGrowthData[] = [];

    const annualSipRate = returnRate / 100;
    const monthlySipRate = Math.pow(1 + annualSipRate, 1 / 12) - 1;
    const annualLumpsumRate = lumpsumReturnRate / 100;
    const monthlyLumpsumRate = Math.pow(1 + annualLumpsumRate, 1 / 12) - 1;
    const annualInflationRate = inflationRate / 100;
    const stepUpRate = stepUpPercentage / 100;

    let runningSipValue = 0;
    let runningSipInvested = 0;
    let currentMonthlySip = monthlyInvestment;

    let prevTotalInvested = lumpsumAmount;
    let prevTotalValue = lumpsumAmount;

    for (let year = 1; year <= timePeriod; year++) {
      for (let m = 1; m <= 12; m++) {
        runningSipValue = (runningSipValue + currentMonthlySip) * (1 + monthlySipRate);
        runningSipInvested += currentMonthlySip;
      }
      const monthsElapsed = year * 12;
      const lumpsumValue = lumpsumAmount * Math.pow(1 + monthlyLumpsumRate, monthsElapsed);

      const totalInvested = runningSipInvested + lumpsumAmount;
      const totalValue = runningSipValue + lumpsumValue;
      const estimatedReturns = totalValue - totalInvested;

      const inflationAdjustedTotalValue =
        inflationRate !== 0
          ? totalValue / Math.pow(1 + annualInflationRate, year)
          : totalValue;

      data.push({
        year,
        investedAmount: Math.round(totalInvested),
        estimatedReturns: Math.round(estimatedReturns),
        totalValue: Math.round(totalValue),
        sipValue: Math.round(runningSipValue),
        lumpsumValue: Math.round(lumpsumValue),
        inflationAdjustedTotalValue: Math.round(inflationAdjustedTotalValue),
        annualSipAmount: Math.round(currentMonthlySip * 12),
        annualReturns: Math.round((totalValue - prevTotalValue) - (totalInvested - prevTotalInvested)),
      });

      prevTotalInvested = totalInvested;
      prevTotalValue = totalValue;

      currentMonthlySip *= (1 + stepUpRate); // step-up for next year
    }

    return data;
  }, [monthlyInvestment, returnRate, lumpsumReturnRate, timePeriod, lumpsumAmount, inflationRate, stepUpPercentage]);

  return { totalResults, growthData };
};