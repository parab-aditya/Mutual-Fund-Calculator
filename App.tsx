
import React, { useState, useMemo } from 'react';
import SliderInput from './components/SliderInput';
import ResultsCard from './components/ResultsCard';
import GrowthChart from './components/GrowthChart';

const App: React.FC = () => {
  const [monthlyInvestment, setMonthlyInvestment] = useState<number>(10000);
  const [lumpsumAmount, setLumpsumAmount] = useState<number>(0);
  const [returnRate, setReturnRate] = useState<number>(12);
  const [timePeriod, setTimePeriod] = useState<number>(10);
  const [inflationRate, setInflationRate] = useState<number>(0);

  const totalResults = useMemo(() => {
    const months = timePeriod * 12;
    const annualRate = returnRate / 100;

    // SIP Calculations
    const sipInvestedAmount = monthlyInvestment * months;
    let sipTotalValue = sipInvestedAmount;
    if (monthlyInvestment > 0 && timePeriod > 0 && returnRate > 0) {
      const monthlyRate = annualRate / 12;
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

    // Inflation adjustment (compounded annually on the final value)
    const annualInflationRate = inflationRate / 100;
    const inflationAdjustedTotalValue = annualInflationRate > 0 
      ? totalValue / Math.pow(1 + annualInflationRate, timePeriod)
      : totalValue;


    return {
      investedAmount,
      estimatedReturns,
      totalValue,
      inflationAdjustedTotalValue,
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
  }, [monthlyInvestment, returnRate, timePeriod, lumpsumAmount, inflationRate]);

  const growthData = useMemo(() => {
    if ((monthlyInvestment <= 0 && lumpsumAmount <= 0) || timePeriod <= 0) {
      return [];
    }

    const data = [];
    const annualRate = returnRate / 100;
    const monthlyRate =
      annualRate > 0 ? annualRate / 12 : 0;
    const annualInflationRate = inflationRate > 0 ? inflationRate / 100 : 0;

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
      const inflationAdjustedTotalValue = annualInflationRate > 0
        ? totalValue / Math.pow(1 + annualInflationRate, year)
        : totalValue;


      data.push({
        year,
        investedAmount: Math.round(totalInvested),
        estimatedReturns: Math.round(estimatedReturns),
        totalValue: Math.round(totalValue),
        sipValue: Math.round(sipValue),
        lumpsumValue: Math.round(lumpsumValue),
        inflationAdjustedTotalValue: Math.round(inflationAdjustedTotalValue),
      });
    }
    return data;
  }, [monthlyInvestment, returnRate, timePeriod, lumpsumAmount, inflationRate]);

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

            <div className="lg:col-span-3">
              <ResultsCard
                investedAmount={totalResults.investedAmount}
                estimatedReturns={totalResults.estimatedReturns}
                totalValue={totalResults.totalValue}
                inflationAdjustedTotalValue={totalResults.inflationAdjustedTotalValue}
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
      <footer className="text-center py-6 text-sm text-slate-600">
        <p>Disclaimer: The calculations are for illustrative purposes only.</p>
      </footer>
    </div>
  );
};

export default App;
