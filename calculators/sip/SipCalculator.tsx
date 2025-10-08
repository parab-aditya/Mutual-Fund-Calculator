import React, { useState, useEffect } from 'react';
import SliderInput from '../../components/SliderInput';
import ResultsCard from '../../components/ResultsCard';
import GrowthChart from '../../components/GrowthChart';
import { useSipCalculator } from './useSipCalculator';

const SipCalculator: React.FC = () => {
    const [monthlyInvestment, setMonthlyInvestment] = useState<number>(25000);
    const [stepUpPercentage, setStepUpPercentage] = useState<number>(0);
    const [lumpsumAmount, setLumpsumAmount] = useState<number>(0);
    const [returnRate, setReturnRate] = useState<number>(12);
    const [timePeriod, setTimePeriod] = useState<number>(10);
    const [inflationRate, setInflationRate] = useState<number>(0);
    
    const [isOptionalAdjustmentsOpen, setIsOptionalAdjustmentsOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => {
        const mobile = window.innerWidth < 768; // Tailwind's `md` breakpoint
        setIsMobile(mobile);
        if (!mobile) {
            setIsOptionalAdjustmentsOpen(true);
        }
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const { totalResults, growthData } = useSipCalculator({
        monthlyInvestment,
        stepUpPercentage,
        lumpsumAmount,
        returnRate,
        timePeriod,
        inflationRate,
    });

    return (
        <div className="px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
              <div className="lg:col-span-2 bg-white/60 backdrop-blur-xl p-6 sm:p-8 rounded-2xl shadow-md border border-slate-200/60">
                <div className="space-y-8">
                  <div className="bg-slate-100/30 border border-slate-200/60 rounded-xl p-4 sm:p-6 space-y-8">
                    <h3 className="text-lg font-semibold text-slate-800 -mb-4">
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
                  
                  <div className="pt-4">
                    <button
                      onClick={() => { if (isMobile) setIsOptionalAdjustmentsOpen(!isOptionalAdjustmentsOpen); }}
                      className="w-full flex justify-between items-center text-left lg:pointer-events-none"
                      aria-expanded={!isMobile || isOptionalAdjustmentsOpen}
                      aria-controls="optional-adjustments-content"
                    >
                      <h3 className="text-lg font-semibold text-slate-700">
                        Optional Adjustments
                      </h3>
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-slate-500 transition-transform duration-300 lg:hidden ${isOptionalAdjustmentsOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>

                    <div
                      id="optional-adjustments-content"
                      className={`grid transition-all duration-500 ease-in-out ${isMobile ? (isOptionalAdjustmentsOpen ? 'grid-rows-[1fr] opacity-100 mt-2' : 'grid-rows-[0fr] opacity-0') : 'grid-rows-[1fr] opacity-100 mt-2'}`}
                    >
                      <div className="overflow-hidden">
                        <div className="space-y-8 pt-6">
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
                  </div>
                </div>
              </div>

              <div className="lg:col-span-3 flex flex-col gap-8 lg:gap-12">
                <ResultsCard
                  investedAmount={totalResults.investedAmount}
                  estimatedReturns={totalResults.estimatedReturns}
                  totalValue={totalResults.totalValue}
                  inflationAdjustedTotalValue={totalResults.inflationAdjustedTotalValue}
                  sipResults={totalResults.sip}
                  lumpsumResults={totalResults.lumpsum}
                  inflationRate={inflationRate}
                />
                 <GrowthChart data={growthData} inflationRate={inflationRate} lumpsumAmount={lumpsumAmount} monthlyInvestment={monthlyInvestment} />
              </div>
            </div>
        </div>
    );
};

export default SipCalculator;
