
import React, { useState, useMemo } from 'react';
import SliderInput from './components/SliderInput';
import ResultsCard from './components/ResultsCard';
import GrowthChart from './components/GrowthChart';


// -------------------- Date & math helpers --------------------
const DAYS_PER_YEAR = 365.2425;

type CashFlow = { amount: number; date: Date };

// Always anchor to UTC, first of month, to avoid DST / end-of-month drift
function firstOfMonthUTC(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

function addMonthsUTC(d: Date, m: number) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + m, 1));
}

function daysBetweenUTC(d1: Date, d2: Date) {
  return (d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24);
}

// XNPV using year fraction on 365.2425
function xnpv(rate: number, flows: CashFlow[]) {
  if (flows.length === 0) return 0;
  const t0 = flows[0].date;
  return flows.reduce((acc, cf) => {
    const t = daysBetweenUTC(t0, cf.date) / DAYS_PER_YEAR;
    return acc + cf.amount / Math.pow(1 + rate, t);
  }, 0);
}

// Try Newton–Raphson; may fail to converge
function xirrNewton(flows: CashFlow[], guess = 0.12, maxIter = 100, tol = 1e-7) {
  let rate = guess;
  for (let i = 0; i < maxIter; i++) {
    const f = xnpv(rate, flows);
    const t0 = flows[0].date;
    let df = 0;
    for (const cf of flows) {
      const t = daysBetweenUTC(t0, cf.date) / DAYS_PER_YEAR;
      df += (-t) * cf.amount / Math.pow(1 + rate, t + 1);
    }
    if (!isFinite(df) || Math.abs(df) < 1e-12) break; // derivative too small/unstable
    const newRate = rate - f / df;
    if (!isFinite(newRate)) break;
    if (Math.abs(newRate - rate) < tol) return newRate;
    rate = newRate;
  }
  return Number.NaN;
}

// Find a bracket [a,b] where f(a) and f(b) have opposite signs
function findSignChangeBracket(flows: CashFlow[]) {
  // Sample a reasonable spread of rates
  const candidates = [-0.999, -0.5, -0.2, -0.05, 0.0, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10];
  let prevRate = candidates[0];
  let prevVal = xnpv(prevRate, flows);
  for (let i = 1; i < candidates.length; i++) {
    const r = candidates[i];
    const v = xnpv(r, flows);
    if (isFinite(prevVal) && isFinite(v) && prevVal * v < 0) {
      return { a: prevRate, b: r };
    }
    prevRate = r;
    prevVal = v;
  }
  return null;
}

// Bisection fallback (safe if function crosses zero once in bracket)
function xirrBisection(flows: CashFlow[], a: number, b: number, tol = 1e-7, maxIter = 200) {
  let fa = xnpv(a, flows);
  let fb = xnpv(b, flows);
  if (!isFinite(fa) || !isFinite(fb) || fa * fb > 0) return Number.NaN;
  let left = a, right = b;
  for (let i = 0; i < maxIter; i++) {
    const mid = (left + right) / 2;
    const fm = xnpv(mid, flows);
    if (!isFinite(fm)) return Number.NaN;
    if (Math.abs(fm) < tol || Math.abs(right - left) < tol) return mid;
    if (fa * fm < 0) {
      right = mid; fb = fm;
    } else {
      left = mid; fa = fm;
    }
  }
  return (left + right) / 2;
}

// Robust XIRR: sign check + Newton, then bisection fallback if needed
function xirr(flows: CashFlow[], guess = 0.12) {
  // Must have at least one negative and one positive cash flow
  const hasNeg = flows.some(f => f.amount < 0);
  const hasPos = flows.some(f => f.amount > 0);
  if (!hasNeg || !hasPos) return Number.NaN;

  // Try Newton first
  const nr = xirrNewton(flows, guess);
  if (isFinite(nr)) return nr;

  // Try to bracket and bisection
  const bracket = findSignChangeBracket(flows);
  if (bracket) {
    const bi = xirrBisection(flows, bracket.a, bracket.b);
    if (isFinite(bi)) return bi;
  }

  // Last resort: small expand around guess
  const eps = 0.5;
  const bi2 = xirrBisection(flows, Math.max(-0.999, guess - eps), guess + eps);
  return isFinite(bi2) ? bi2 : Number.NaN;
}

// Deflate a nominal cash flow to "today's rupees" using constant inflation (monthly)
function deflateToBase(amount: number, monthsFromStart: number, annualInflation: number) {
  const mInfl = Math.pow(1 + annualInflation, 1 / 12) - 1;
  const factor = Math.pow(1 + mInfl, monthsFromStart);
  return amount / factor;
}

// -------------------- Component --------------------
const App: React.FC = () => {
  const [monthlyInvestment, setMonthlyInvestment] = useState<number>(25000);
  const [stepUpPercentage, setStepUpPercentage] = useState<number>(0);
  const [lumpsumAmount, setLumpsumAmount] = useState<number>(0);
  const [returnRate, setReturnRate] = useState<number>(12);
  const [timePeriod, setTimePeriod] = useState<number>(10);
  const [inflationRate, setInflationRate] = useState<number>(0);

  const totalResults = useMemo(() => {
    // Trivial/invalid guards
    if ((monthlyInvestment <= 0 && lumpsumAmount <= 0) || timePeriod <= 0) {
      return {
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
    }

    const annualRate = returnRate / 100;
    if (annualRate <= -1) {
      return {
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
    }

    const stepUpRate = stepUpPercentage / 100;
    const annualInflationRate = inflationRate / 100;
    if (annualInflationRate <= -1) {
      // Non-positive price level over a year is invalid
      return {
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
    }

    const months = timePeriod * 12;
    const monthlyRate = Math.pow(1 + annualRate, 1 / 12) - 1;

    // ----- SIP (monthly compounding; invest at start of month, then grow) -----
    let sipTotalValue = 0;
    let sipInvestedAmount = 0;
    let currentMonthlySip = monthlyInvestment;

    for (let month = 1; month <= months; month++) {
      sipTotalValue = (sipTotalValue + currentMonthlySip) * (1 + monthlyRate);
      sipInvestedAmount += currentMonthlySip;
      if (month % 12 === 0 && month < months) {
        currentMonthlySip *=  (1 + stepUpRate);
      }
    }
    const sipEstimatedReturns = sipTotalValue - sipInvestedAmount;

    // ----- Lumpsum (monthly compounding for consistency) -----
    const lumpsumInvestedAmount = lumpsumAmount;
    const lumpsumTotalValue = lumpsumAmount * Math.pow(1 + monthlyRate, months);
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
    currentMonthlySip = monthlyInvestment;
    for (let m = 1; m <= months; m++) {
      const dt = addMonthsUTC(startDate, m - 1);
      flowsNominal.push({ amount: -currentMonthlySip, date: dt });
      if (m % 12 === 0 && m < months) {
        currentMonthlySip *= (1 + stepUpRate);
      }
    }

    // Redemption at the end (month = months)
    const endDate = addMonthsUTC(startDate, months);
    flowsNominal.push({ amount: totalValue, date: endDate });

    // ----- Nominal XIRR -----
    const nominalXIRR = xirr(flowsNominal, annualRate);

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

    const realXIRR = xirr(flowsReal, Math.max(annualRate - annualInflationRate, -0.5));

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
  }, [monthlyInvestment, returnRate, timePeriod, lumpsumAmount, inflationRate, stepUpPercentage]);

  const growthData = useMemo(() => {
    if ((monthlyInvestment <= 0 && lumpsumAmount <= 0) || timePeriod <= 0) return [];

    const data: {
      year: number;
      investedAmount: number;
      estimatedReturns: number;
      totalValue: number;
      sipValue: number;
      lumpsumValue: number;
      inflationAdjustedTotalValue: number;
    }[] = [];

    const annualRate = returnRate / 100;
    const monthlyRate = Math.pow(1 + annualRate, 1 / 12) - 1;
    const annualInflationRate = inflationRate / 100;
    const stepUpRate = stepUpPercentage / 100;

    let runningSipValue = 0;
    let runningSipInvested = 0;
    let currentMonthlySip = monthlyInvestment;

    for (let year = 1; year <= timePeriod; year++) {
      for (let m = 1; m <= 12; m++) {
        runningSipValue = (runningSipValue + currentMonthlySip) * (1 + monthlyRate);
        runningSipInvested += currentMonthlySip;
      }
      const monthsElapsed = year * 12;
      const lumpsumValue = lumpsumAmount * Math.pow(1 + monthlyRate, monthsElapsed);

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
      });

      currentMonthlySip *= (1 + stepUpRate); // step-up for next year
    }

    return data;
  }, [monthlyInvestment, returnRate, timePeriod, lumpsumAmount, inflationRate, stepUpPercentage]);

  return (
    <div className="min-h-screen font-sans text-slate-900 antialiased">
       <header>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
            Mutual Fund SIP Calculator
          </h1>
          <p className="text-slate-600 mt-2 text-lg">
            Visualize your wealth creation journey.
          </p>
        </div>
      </header>

      <main className="container mx-auto pb-8 sm:pb-12">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
            <div className="lg:col-span-2 bg-white/60 backdrop-blur-xl p-6 sm:p-8 rounded-3xl shadow-lg border border-white/20">
              <div className="space-y-8">
                <div className="bg-indigo-50/40 border border-indigo-200/50 rounded-2xl p-4 sm:p-6 space-y-8">
                  <h3 className="text-lg font-semibold text-indigo-800 -mb-4">
                    Core Calculation
                  </h3>
                  <SliderInput
                    label="Monthly Investment (SIP)"
                    value={monthlyInvestment}
                    onChange={setMonthlyInvestment}
                    min={0}
                    max={1000000}
                    step={1000}
                    unit="₹"
                  />
                  <SliderInput
                    label="Expected Return Rate (p.a.)"
                    value={returnRate}
                    onChange={setReturnRate}
                    min={1}
                    max={30}
                    step={0.1}
                    unit="%"
                  />
                  <SliderInput
                    label="Time Period"
                    value={timePeriod}
                    onChange={setTimePeriod}
                    min={1}
                    max={40}
                    step={1}
                    unit="Yr"
                  />
                </div>

                <div className="space-y-8 pt-4">
                  <h3 className="text-lg font-semibold text-slate-700 -mb-2">
                    Optional Adjustments
                  </h3>
                  <SliderInput
                    label="SIP Annual Step-up"
                    value={stepUpPercentage}
                    onChange={setStepUpPercentage}
                    min={0}
                    max={50}
                    step={1}
                    unit="%"
                  />
                  <SliderInput
                    label="Lumpsum Investment"
                    value={lumpsumAmount}
                    onChange={setLumpsumAmount}
                    min={0}
                    max={50000000}
                    step={100000}
                    unit="₹"
                  />
                  <SliderInput
                    label="Inflation Rate (p.a.)"
                    value={inflationRate}
                    onChange={setInflationRate}
                    min={0}
                    max={20}
                    step={0.1}
                    unit="%"
                  />
                </div>
              </div>
            </div>

            <div className="lg:col-span-3">
              <ResultsCard
                investedAmount={totalResults.investedAmount}
                estimatedReturns={totalResults.estimatedReturns}
                totalValue={totalResults.totalValue}
                inflationAdjustedTotalValue={totalResults.inflationAdjustedTotalValue}
                sipResults={totalResults.sip}
                lumpsumResults={totalResults.lumpsum}
                inflationRate={inflationRate}
              />
            </div>
          </div>
        </div>
        <div className="mt-8 lg:mt-12 px-4 sm:px-6 lg:px-8">
          <GrowthChart data={growthData} inflationRate={inflationRate} lumpsumAmount={lumpsumAmount} monthlyInvestment={monthlyInvestment} />
        </div>
      </main>
      <footer className="text-center py-6 text-sm text-slate-600 space-y-2">
        <p>
          Made with <span role="img" aria-label="love">❤️</span> by{' '}
          <a
            href="https://www.linkedin.com/in/its-aditya-parab/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-indigo-600 hover:underline"
          >
            Aditya Parab
          </a>
        </p>
        <p>Disclaimer: The calculations are for illustrative purposes only.</p>
      </footer>
    </div>
  );
};

export default App;
