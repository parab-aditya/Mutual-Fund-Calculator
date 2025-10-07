
import React, { useState, useMemo } from 'react';
import SliderInput from './components/SliderInput';
import ResultsCard from './components/ResultsCard';
import GrowthChart from './components/GrowthChart';

const App: React.FC = () => {
  const [monthlyInvestment, setMonthlyInvestment] = useState<number>(10000);
  const [lumpsumAmount, setLumpsumAmount] = useState<number>(0);
  const [returnRate, setReturnRate] = useState<number>(12);
  const [timePeriod, setTimePeriod] = useState<number>(10);

  const totalResults = useMemo(() => {
    const months = timePeriod * 12;
    const annualRate = returnRate / 100;

    // SIP Calculations
    const sipInvestedAmount = monthlyInvestment * months;
    let sipTotalValue = sipInvestedAmount;
    if (monthlyInvestment > 0 && timePeriod > 0 && returnRate > 0) {
      const monthlyRate = Math.pow(1 + annualRate, 1 / 12) - 1;
      sipTotalValue =
        monthlyInvestment *
        ((((1 + monthlyRate) ** months) - 1) / monthlyRate) *
        (1 + monthlyRate);
    }
    const sipEstimatedReturns = sipTotalValue - sipInvestedAmount;

    // Lumpsum Calculations
    const lumpsumInvestedAmount = lumpsumAmount;
    let lumpsumTotalValue = lumpsumInvestedAmount;
    if (lumpsumAmount > 0 && timePeriod > 0 && returnRate > 0) {
      lumpsumTotalValue = lumpsumAmount * Math.pow(1 + annualRate, timePeriod);
    }
    const lumpsumEstimatedReturns = lumpsumTotalValue - lumpsumInvestedAmount;

    // Combined results
    const investedAmount = sipInvestedAmount + lumpsumInvestedAmount;
    const totalValue = sipTotalValue + lumpsumTotalValue;
    const estimatedReturns = totalValue - investedAmount;

    return {
      investedAmount,
      estimatedReturns,
      totalValue,
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
  }, [monthlyInvestment, returnRate, timePeriod, lumpsumAmount]);

  const growthData = useMemo(() => {
    if ((monthlyInvestment <= 0 && lumpsumAmount <= 0) || timePeriod <= 0) {
      return [];
    }

    const data = [];
    const annualRate = returnRate / 100;
    const monthlyRate =
      annualRate > 0 ? Math.pow(1 + annualRate, 1 / 12) - 1 : 0;

    for (let year = 1; year <= timePeriod; year++) {
      const months = year * 12;

      // SIP part for this year
      const sipInvested = monthlyInvestment * months;
      let sipValue = sipInvested;
      if (monthlyRate > 0 && monthlyInvestment > 0) {
        sipValue =
          monthlyInvestment *
          ((((1 + monthlyRate) ** months) - 1) / monthlyRate) *
          (1 + monthlyRate);
      }

      // Lumpsum part for this year
      const lumpsumValue =
        lumpsumAmount > 0 && annualRate > 0
          ? lumpsumAmount * Math.pow(1 + annualRate, year)
          : lumpsumAmount;

      const totalInvested = sipInvested + lumpsumAmount;
      const totalValue = sipValue + lumpsumValue;
      const estimatedReturns = totalValue - totalInvested;

      data.push({
        year,
        investedAmount: Math.round(totalInvested),
        estimatedReturns: Math.round(estimatedReturns),
        totalValue: Math.round(totalValue),
        sipValue: Math.round(sipValue),
        lumpsumValue: Math.round(lumpsumValue),
      });
    }
    return data;
  }, [monthlyInvestment, returnRate, timePeriod, lumpsumAmount]);

  return (
    <div className="min-h-screen font-sans text-slate-800 antialiased">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Mutual Fund SIP Calculator
          </h1>
          <p className="text-slate-500 mt-1">
            Plan your future investments with ease and clarity.
          </p>
        </div>
      </header>

      <main className="container mx-auto py-8 sm:py-12">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
            <div className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-2xl shadow-lg border border-slate-200/80">
              <div className="space-y-8">
                <SliderInput
                  label="Monthly Investment"
                  value={monthlyInvestment}
                  onChange={setMonthlyInvestment}
                  min={0}
                  max={1000000}
                  step={1000}
                  unit="₹"
                />
                <SliderInput
                  label="Lumpsum Investment"
                  value={lumpsumAmount}
                  onChange={setLumpsumAmount}
                  min={0}
                  max={100000000}
                  step={100000}
                  unit="₹"
                />
                <SliderInput
                  label="Expected Return Rate (p.a.)"
                  value={returnRate}
                  onChange={setReturnRate}
                  min={1}
                  max={30}
                  step={0.5}
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
            </div>

            <div className="lg:col-span-3">
              <ResultsCard
                investedAmount={totalResults.investedAmount}
                estimatedReturns={totalResults.estimatedReturns}
                totalValue={totalResults.totalValue}
                sipResults={totalResults.sip}
                lumpsumResults={totalResults.lumpsum}
              />
            </div>
          </div>
        </div>
        <div className="mt-8 lg:mt-12 px-4 sm:px-6 lg:px-8">
          <GrowthChart data={growthData} />
        </div>
      </main>
      <footer className="text-center py-6 text-sm text-slate-500">
        <p>Disclaimer: The calculations are for illustrative purposes only.</p>
      </footer>
    </div>
  );
};

export default App;
