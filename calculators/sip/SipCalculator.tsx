import React, { useState, useEffect, useCallback } from 'react';
import SliderInput from '../../components/SliderInput';
import ResultsCard from '../../components/ResultsCard';
import GrowthChart from '../../components/GrowthChart';
import FireCrossoverChart from '../../components/FireCrossoverChart';
import CollapsibleSection from '../../components/CollapsibleSection';
import { useSipCalculator } from './useSipCalculator';
import { useResponsive } from '../../utils/hooks';
import {
  DEFAULT_MONTHLY_INVESTMENT,
  DEFAULT_RETURN_RATE,
  DEFAULT_TIME_PERIOD,
  DEFAULT_INFLATION_RATE,
  DEFAULT_STEP_UP_PERCENTAGE,
  DEFAULT_LUMPSUM_AMOUNT,
  MIN_MONTHLY_INVESTMENT,
  MAX_MONTHLY_INVESTMENT,
  STEP_MONTHLY_INVESTMENT,
  MIN_RETURN_RATE,
  MAX_RETURN_RATE,
  STEP_RETURN_RATE,
  MIN_TIME_PERIOD,
  MAX_TIME_PERIOD,
  STEP_TIME_PERIOD,
  MAX_STEP_UP_PERCENTAGE,
  MAX_LUMPSUM_AMOUNT,
  STEP_LUMPSUM_AMOUNT,
  MAX_INFLATION_RATE,
} from './constants';

interface SipCalculatorProps {
  onResultsChange?: (value: number) => void;
  isActive: boolean;
}

const SipCalculator: React.FC<SipCalculatorProps> = ({ onResultsChange, isActive }) => {
  const [monthlyInvestment, setMonthlyInvestment] = useState<number>(DEFAULT_MONTHLY_INVESTMENT);
  const [stepUpPercentage, setStepUpPercentage] = useState<number>(DEFAULT_STEP_UP_PERCENTAGE);
  const [lumpsumAmount, setLumpsumAmount] = useState<number>(DEFAULT_LUMPSUM_AMOUNT);
  const [returnRate, setReturnRate] = useState<number>(DEFAULT_RETURN_RATE);
  const [lumpsumReturnRate, setLumpsumReturnRate] = useState<number>(returnRate);
  const [syncLumpsumRate, setSyncLumpsumRate] = useState<boolean>(true);
  const [timePeriod, setTimePeriod] = useState<number>(DEFAULT_TIME_PERIOD);
  const [inflationRate, setInflationRate] = useState<number>(DEFAULT_INFLATION_RATE);

  const [isOptionalAdjustmentsOpen, setIsOptionalAdjustmentsOpen] = useState(false);

  // New state for collapsible sections (default open)
  const [isReturnsOpen, setIsReturnsOpen] = useState(true);
  const [isGrowthChartOpen, setIsGrowthChartOpen] = useState(true);
  const [isFireChartOpen, setIsFireChartOpen] = useState(true);

  // Use shared responsive hook.
  // The original logic used < 768. The new hook provides isMd (which is < 768).
  const { isMd } = useResponsive();
  const isMobile = isMd;

  useEffect(() => {
    // If not mobile (meaning >= 768px), force sections open
    if (!isMobile) {
      setIsOptionalAdjustmentsOpen(true);
      setIsReturnsOpen(true);
      setIsGrowthChartOpen(true);
      setIsFireChartOpen(true);
    }
  }, [isMobile]);

  useEffect(() => {
    if (syncLumpsumRate) {
      setLumpsumReturnRate(returnRate);
    }
  }, [returnRate, syncLumpsumRate]);

  const { totalResults, growthData } = useSipCalculator({
    monthlyInvestment,
    stepUpPercentage,
    lumpsumAmount,
    returnRate,
    lumpsumReturnRate,
    timePeriod,
    inflationRate,
  });

  useEffect(() => {
    if (onResultsChange) {
      onResultsChange(totalResults.totalValue);
    }
  }, [totalResults.totalValue, onResultsChange]);

  const handleLumpsumRateChange = useCallback((value: number) => {
    setSyncLumpsumRate(false);
    setLumpsumReturnRate(value);
  }, []);

  const handleSyncToggle = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    setSyncLumpsumRate(isChecked);
    if (isChecked) {
      setLumpsumReturnRate(returnRate);
    }
  }, [returnRate]);


  return (
    <div className="px-2 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
        <div className="lg:col-span-2 bg-white/60 backdrop-blur-xl p-4 sm:p-6 rounded-2xl shadow-md border border-slate-200/60">
          <div className="space-y-6">
            <div className="bg-slate-100/30 border border-slate-200/60 rounded-xl p-3 sm:p-4 space-y-6">
              <h3 className="text-lg font-semibold text-slate-800 -mb-2">
                Core Calculation
              </h3>
              <SliderInput
                label="Monthly Investment (SIP)"
                value={monthlyInvestment}
                onChange={setMonthlyInvestment}
                min={MIN_MONTHLY_INVESTMENT}
                max={MAX_MONTHLY_INVESTMENT}
                step={STEP_MONTHLY_INVESTMENT}
                unit="₹"
              />
              <SliderInput
                label="Expected Return Rate (p.a.)"
                value={returnRate}
                onChange={setReturnRate}
                min={MIN_RETURN_RATE}
                max={MAX_RETURN_RATE}
                step={STEP_RETURN_RATE}
                unit="%"
              />
              <SliderInput
                label="Time Period"
                value={timePeriod}
                onChange={setTimePeriod}
                min={MIN_TIME_PERIOD}
                max={MAX_TIME_PERIOD}
                step={STEP_TIME_PERIOD}
                unit="Yr"
              />
            </div>

            <div>
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
                  <div className="space-y-6 pt-4 pb-2">
                    <SliderInput
                      label="SIP Annual Step-up"
                      value={stepUpPercentage}
                      onChange={setStepUpPercentage}
                      min={0}
                      max={MAX_STEP_UP_PERCENTAGE}
                      step={1}
                      unit="%"
                    />
                    <SliderInput
                      label="Lumpsum / Current Corpus"
                      value={lumpsumAmount}
                      onChange={setLumpsumAmount}
                      min={0}
                      max={MAX_LUMPSUM_AMOUNT}
                      step={STEP_LUMPSUM_AMOUNT}
                      unit="₹"
                    />
                    {lumpsumAmount > 0 && (
                      <div className="space-y-1 pl-4 border-l-2 border-slate-200/75">
                        <SliderInput
                          label="Lumpsum Return Rate (p.a.)"
                          value={lumpsumReturnRate}
                          onChange={handleLumpsumRateChange}
                          min={MIN_RETURN_RATE}
                          max={MAX_RETURN_RATE}
                          step={STEP_RETURN_RATE}
                          unit="%"
                        />
                        <div className="flex items-center justify-end pt-1">
                          <label htmlFor="syncRate" className="mr-2 text-xs font-medium text-slate-600 cursor-pointer">
                            Same as SIP
                          </label>
                          <input
                            type="checkbox"
                            id="syncRate"
                            checked={syncLumpsumRate}
                            onChange={handleSyncToggle}
                            className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                        </div>
                      </div>
                    )}
                    <SliderInput
                      label="Inflation Rate (p.a.)"
                      value={inflationRate}
                      onChange={setInflationRate}
                      min={0}
                      max={MAX_INFLATION_RATE}
                      step={0.1}
                      unit="%"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 flex flex-col gap-6 lg:gap-8">
          <CollapsibleSection
            title="Returns Breakdown"
            isOpen={isReturnsOpen}
            toggle={() => isMobile && setIsReturnsOpen(!isReturnsOpen)}
            isMobile={isMobile}
          >
            <ResultsCard
              investedAmount={totalResults.investedAmount}
              estimatedReturns={totalResults.estimatedReturns}
              totalValue={totalResults.totalValue}
              inflationAdjustedTotalValue={totalResults.inflationAdjustedTotalValue}
              sipResults={totalResults.sip}
              lumpsumResults={totalResults.lumpsum}
              inflationRate={inflationRate}
              isActive={isActive}
              hideContainer={true}
            />
          </CollapsibleSection>

          <CollapsibleSection
            title="Investment Growth Over Time"
            isOpen={isGrowthChartOpen}
            toggle={() => isMobile && setIsGrowthChartOpen(!isGrowthChartOpen)}
            isMobile={isMobile}
          >
            <GrowthChart
              data={growthData}
              inflationRate={inflationRate}
              lumpsumAmount={lumpsumAmount}
              monthlyInvestment={monthlyInvestment}
              isActive={isActive}
              hideContainer={true}
              hideTitle={true}
            />
          </CollapsibleSection>
        </div>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8 mt-8">
        <div className="lg:col-span-5">
          <CollapsibleSection
            title="The FIRE crossover"
            isOpen={isFireChartOpen}
            toggle={() => isMobile && setIsFireChartOpen(!isFireChartOpen)}
            isMobile={isMobile}
          >
            <FireCrossoverChart
              data={growthData}
              isActive={isActive}
              returnRate={returnRate}
              hideContainer={true}
              hideTitle={true}
            />
          </CollapsibleSection>
        </div>
      </div>
    </div>
  );
};

export default SipCalculator;