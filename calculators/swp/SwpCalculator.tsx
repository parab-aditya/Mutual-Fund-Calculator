
import React, { useState, useEffect, useCallback, memo } from 'react';
import SliderInput from '../../components/SliderInput';
import { useSwpCalculator, calculateMaxWithdrawal } from './useSwpCalculator';
import SwpResultsCard from '../../components/SwpResultsCard';
import SwpGrowthChart from '../../components/SwpGrowthChart';
import { SwpMonthlyData } from './types';
import { formatIndianCurrency } from '../../utils/formatters';

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
                  <td className="px-3 py-3 whitespace-nowrap text-sm font-semibold text-slate-800 text-right">{formatIndianCurrency(row.endingBalance)}</td>
                </tr>
                {isYearEnd && (
                  <tr className="bg-emerald-50/80">
                    <td colSpan={5} className="px-3 py-2 text-center text-sm font-semibold text-emerald-800 tracking-wide">
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
  const [totalInvestment, setTotalInvestment] = useState<number>(1000000);
  const [withdrawalPerMonth, setWithdrawalPerMonth] = useState<number>(8000);
  const [withdrawalStepUpPercentage, setWithdrawalStepUpPercentage] = useState<number>(7);
  const [isStepUpEnabled, setIsStepUpEnabled] = useState<boolean>(false);
  const [expectedReturnRate, setExpectedReturnRate] = useState<number>(8);
  const [timePeriod, setTimePeriod] = useState<number>(20);
  const [syncWithSip, setSyncWithSip] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

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
                min={100000}
                max={50000000}
                step={100000}
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
                min={1000}
                max={1000000}
                step={1000}
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
                  min={1}
                  max={20}
                  step={1}
                  unit="%"
                />
              </div>
            )}
            <SliderInput
              label="Expected Return Rate (p.a.)"
              value={expectedReturnRate}
              onChange={setExpectedReturnRate}
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
        </div>
        <div className="lg:col-span-3 flex flex-col gap-6 lg:gap-8">
          <SwpResultsCard
            totalInvestment={results.totalInvestment}
            totalWithdrawal={results.totalWithdrawal}
            finalValue={results.finalValue}
            numberOfWithdrawals={results.numberOfWithdrawals}
            isActive={isActive}
          />
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
