import React, { useState, useEffect, useCallback, memo } from 'react';
import SliderInput from '../../components/SliderInput';
import { useSwpCalculator, calculateMaxWithdrawal } from './useSwpCalculator';
import SwpResultsCard from '../../components/SwpResultsCard';
import SwpGrowthChart from '../../components/SwpGrowthChart';
import CollapsibleSection from '../../components/CollapsibleSection';
import { SwpMonthlyData } from './types';
import { formatIndianCurrency } from '../../utils/formatters';
import { useResponsive } from '../../utils/hooks';
import {
  DEFAULT_TOTAL_INVESTMENT,
  DEFAULT_WITHDRAWAL_PER_MONTH,
  DEFAULT_WITHDRAWAL_STEP_UP_PERCENTAGE,
  DEFAULT_EXPECTED_RETURN_RATE,
  DEFAULT_TIME_PERIOD,
  DEFAULT_INFLATION_RATE,
  MIN_TOTAL_INVESTMENT,
  MAX_TOTAL_INVESTMENT,
  STEP_TOTAL_INVESTMENT,
  MIN_WITHDRAWAL,
  MAX_WITHDRAWAL,
  STEP_WITHDRAWAL,
  MIN_STEP_UP,
  MAX_STEP_UP,
  STEP_STEP_UP,
  MIN_RETURN_RATE,
  MAX_RETURN_RATE,
  STEP_RETURN_RATE,
  MIN_TIME_PERIOD,
  MAX_TIME_PERIOD,
  STEP_TIME_PERIOD,
  MAX_INFLATION_RATE,
  STEP_INFLATION_RATE,
} from './constants';

const DetailedSwpTable: React.FC<{ data: SwpMonthlyData[] }> = memo(({ data }) => {
  if (!data || data.length === 0) {
    return null;
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-100/70 sticky top-0 z-10">
          <tr>
            <th scope="col" className="px-3 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Month</th>
            <th scope="col" className="px-3 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Opening Balance</th>
            <th scope="col" className="px-3 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Returns</th>
            <th scope="col" className="px-3 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Withdrawal</th>
            <th scope="col" className="px-3 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Inflation Adj.</th>
            <th scope="col" className="px-3 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Closing Balance</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-200/70">
          {data.map((row) => {
            const isYearEnd = row.month > 0 && row.month % 12 === 0;
            const year = Math.ceil(row.month / 12);

            return (
              <React.Fragment key={row.month}>
                <tr className="hover:bg-slate-50/50 transition-colors duration-150">
                  <td className="px-3 py-3 whitespace-nowrap text-sm font-medium text-slate-700">{row.month}</td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-slate-600 text-right">{formatIndianCurrency(row.beginningBalance)}</td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-emerald-600 text-right">{formatIndianCurrency(row.monthlyReturns)}</td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-red-600 text-right">{formatIndianCurrency(row.monthlyWithdrawal)}</td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-slate-500 text-right">{formatIndianCurrency(row.inflationAdjustedWithdrawal)}</td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm font-semibold text-slate-800 text-right">{formatIndianCurrency(row.endingBalance)}</td>
                </tr>
                {isYearEnd && (
                  <tr className="bg-emerald-50/80">
                    <td colSpan={6} className="px-3 py-2 text-center text-sm font-semibold text-emerald-800 tracking-wide">
                      Year {year} End
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
});

DetailedSwpTable.displayName = 'DetailedSwpTable';


interface SwpCalculatorProps {
  sipProjectedValue?: number;
  isActive: boolean;
}

const SwpCalculator: React.FC<SwpCalculatorProps> = ({ sipProjectedValue, isActive }) => {
  const [totalInvestment, setTotalInvestment] = useState<number>(DEFAULT_TOTAL_INVESTMENT);
  const [withdrawalPerMonth, setWithdrawalPerMonth] = useState<number>(DEFAULT_WITHDRAWAL_PER_MONTH);
  const [withdrawalStepUpPercentage, setWithdrawalStepUpPercentage] = useState<number>(DEFAULT_WITHDRAWAL_STEP_UP_PERCENTAGE);
  const [isStepUpEnabled, setIsStepUpEnabled] = useState<boolean>(false);
  const [expectedReturnRate, setExpectedReturnRate] = useState<number>(DEFAULT_EXPECTED_RETURN_RATE);
  const [timePeriod, setTimePeriod] = useState<number>(DEFAULT_TIME_PERIOD);
  const [inflationRate, setInflationRate] = useState<number>(DEFAULT_INFLATION_RATE);
  const [syncWithSip, setSyncWithSip] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isOptionalAdjustmentsOpen, setIsOptionalAdjustmentsOpen] = useState(false);
  const [isReturnsOpen, setIsReturnsOpen] = useState(true);

  // Use shared responsive hook.
  // SWP uses lg breakpoint (< 1024) for mobile behavior.
  const { isLg } = useResponsive();
  const isMobile = isLg;

  useEffect(() => {
    // If not mobile (meaning >= 1024px), force sections open
    if (!isMobile) {
      setIsOptionalAdjustmentsOpen(true);
      setIsReturnsOpen(true);
    }
  }, [isMobile]);

  useEffect(() => {
    if (syncWithSip && sipProjectedValue && sipProjectedValue > 0) {
      setTotalInvestment(sipProjectedValue);
    }
  }, [sipProjectedValue, syncWithSip]);

  const { results, growthData, monthlyData } = useSwpCalculator({
    totalInvestment,
    withdrawalPerMonth,
    withdrawalStepUpPercentage: isStepUpEnabled ? withdrawalStepUpPercentage : 0,
    expectedReturnRate,
    timePeriod,
    inflationRate,
  });

  const maxWithdrawal = React.useMemo(() => {
    return calculateMaxWithdrawal(
      totalInvestment,
      isStepUpEnabled ? withdrawalStepUpPercentage : 0,
      expectedReturnRate,
      timePeriod
    );
  }, [totalInvestment, isStepUpEnabled, withdrawalStepUpPercentage, expectedReturnRate, timePeriod]);

  const handleTotalInvestmentChange = (value: number) => {
    setSyncWithSip(false);
    setTotalInvestment(value);
  };

  const handleSyncToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    setSyncWithSip(isChecked);
    if (isChecked && sipProjectedValue && sipProjectedValue > 0) {
      setTotalInvestment(sipProjectedValue);
    }
  };

  return (
    <div className="px-2 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
        <div className="lg:col-span-2 bg-white/60 backdrop-blur-xl p-4 sm:p-6 rounded-2xl shadow-md border border-slate-200/60">
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-slate-800 -mb-1">
              SWP Configuration
            </h3>
            <div>
              <SliderInput
                label="Total Investment"
                value={totalInvestment}
                onChange={handleTotalInvestmentChange}
                min={MIN_TOTAL_INVESTMENT}
                max={MAX_TOTAL_INVESTMENT}
                step={STEP_TOTAL_INVESTMENT}
                unit="₹"
              />
              <div className="flex items-center justify-end pt-4">
                <label htmlFor="syncSwpInvestment" className="mr-2 text-xs font-medium text-slate-600 cursor-pointer">
                  Use SIP Projected Value
                </label>
                <input
                  type="checkbox"
                  id="syncSwpInvestment"
                  checked={syncWithSip}
                  onChange={handleSyncToggle}
                  disabled={!sipProjectedValue || sipProjectedValue <= 0}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>
            <div>
              <SliderInput
                label="Withdrawal per Month"
                value={withdrawalPerMonth}
                onChange={setWithdrawalPerMonth}
                min={MIN_WITHDRAWAL}
                max={MAX_WITHDRAWAL}
                step={STEP_WITHDRAWAL}
                unit="₹"
                markerValue={maxWithdrawal}
                markerLabel="Max Withdrawal"
              />
              <div className="flex items-center justify-end pt-4">
                <label htmlFor="enableSwpStepUp" className="mr-2 text-xs font-medium text-slate-600 cursor-pointer">
                  Annual Step-up
                </label>
                <input
                  type="checkbox"
                  id="enableSwpStepUp"
                  checked={isStepUpEnabled}
                  onChange={(e) => setIsStepUpEnabled(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
              </div>
            </div>
            {isStepUpEnabled && (
              <div className="pl-4 border-l-2 border-slate-200/75">
                <SliderInput
                  label="Withdrawal Step-up (p.a.)"
                  value={withdrawalStepUpPercentage}
                  onChange={setWithdrawalStepUpPercentage}
                  min={MIN_STEP_UP}
                  max={MAX_STEP_UP}
                  step={STEP_STEP_UP}
                  unit="%"
                />
              </div>
            )}
            <SliderInput
              label="Expected Return Rate (p.a.)"
              value={expectedReturnRate}
              onChange={setExpectedReturnRate}
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

            <div>
              <button
                onClick={() => { if (isMobile) setIsOptionalAdjustmentsOpen(!isOptionalAdjustmentsOpen); }}
                className="w-full flex justify-between items-center text-left lg:pointer-events-none"
                aria-expanded={!isMobile || isOptionalAdjustmentsOpen}
                aria-controls="swp-optional-adjustments"
              >
                <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-widest pt-2">
                  Optional Adjustments
                </h3>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-slate-500 transition-transform duration-300 lg:hidden ${isOptionalAdjustmentsOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>

              <div
                id="swp-optional-adjustments"
                className={`grid transition-all duration-500 ease-in-out ${isMobile ? (isOptionalAdjustmentsOpen ? 'grid-rows-[1fr] opacity-100 mt-4' : 'grid-rows-[0fr] opacity-0') : 'grid-rows-[1fr] opacity-100 mt-4'}`}
              >
                <div className="overflow-hidden">
                  <SliderInput
                    label="Inflation Rate (p.a.)"
                    value={inflationRate}
                    onChange={setInflationRate}
                    min={0}
                    max={MAX_INFLATION_RATE}
                    step={STEP_INFLATION_RATE}
                    unit="%"
                  />
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
            <SwpResultsCard
              totalInvestment={results.totalInvestment}
              totalWithdrawal={results.totalWithdrawal}
              finalValue={results.finalValue}
              numberOfWithdrawals={results.numberOfWithdrawals}
              inflationAdjustedFinalValue={results.inflationAdjustedFinalValue}
              inflationRate={inflationRate}
              isActive={isActive}
              hideContainer={true}
            />
          </CollapsibleSection>
          <div className="bg-white/60 backdrop-blur-xl p-4 sm:p-6 rounded-2xl shadow-md border border-slate-200/60">
            <h2 className="text-xl font-bold text-slate-800 mb-4 px-4 sm:px-0 text-center">Withdrawal & Balance Over Time</h2>
            <SwpGrowthChart data={growthData} isActive={isActive} />
          </div>
        </div>
      </div>

      {monthlyData && monthlyData.length > 0 && (
        <div className="mt-6 lg:mt-8">
          <div className="bg-white/60 backdrop-blur-xl rounded-2xl shadow-md border border-slate-200/60">
            <button
              onClick={() => setIsDetailsOpen(!isDetailsOpen)}
              className="w-full flex justify-between items-center p-4 sm:p-5 text-left"
              aria-expanded={isDetailsOpen}
              aria-controls="detailed-swp-results"
            >
              <h2 className="text-xl font-bold text-slate-800">
                Detailed Results
              </h2>
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 text-slate-500 transition-transform duration-300 ${isDetailsOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            <div
              id="detailed-swp-results"
              className={`grid transition-all duration-500 ease-in-out ${isDetailsOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
            >
              <div className="overflow-hidden">
                <div className="p-4 sm:p-6 pt-0">
                  <div className="max-h-[85vh] lg:max-h-[70vh] overflow-y-auto rounded-lg border border-slate-200/75">
                    <DetailedSwpTable data={monthlyData} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SwpCalculator;
