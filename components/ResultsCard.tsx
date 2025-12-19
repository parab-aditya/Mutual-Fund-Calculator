import React, { useState, useEffect, useMemo, memo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { formatIndianCurrency, getDynamicValueClass, numberToIndianWords, formatToWords } from '../utils/formatters';
import { Palette } from '../design-system';
import CollapsibleSection from './CollapsibleSection';

interface ResultBreakdown {
  investedAmount: number;
  estimatedReturns: number;
  totalValue: number;
}

interface ResultsCardProps {
  investedAmount: number;
  estimatedReturns: number;
  totalValue: number;
  inflationAdjustedTotalValue: number;
  sipResults: ResultBreakdown;
  lumpsumResults: ResultBreakdown;
  timePeriod: number;
  inflationRate: number;
  isActive: boolean;
  hideContainer?: boolean;
}

const COLORS = [Palette.chart.invested, Palette.chart.returns];

const CustomTooltip = memo(({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg p-3 border border-slate-200/60 dark:border-slate-700/60 rounded-lg shadow-lg">
        <p className="text-sm text-slate-600 dark:text-slate-300">{formatIndianCurrency(payload[0].value)}</p>
      </div>
    );
  }
  return null;
});

CustomTooltip.displayName = 'CustomTooltip';

const ResultsCard: React.FC<ResultsCardProps> = ({
  investedAmount,
  estimatedReturns,
  totalValue,
  inflationAdjustedTotalValue,
  sipResults,
  lumpsumResults,
  timePeriod,
  inflationRate,
  isActive,
  hideContainer = false,
}) => {
  const currentYear = new Date().getFullYear();
  const futureYear = currentYear + timePeriod;

  const chartData = useMemo(() => [
    { name: 'Invested Amount', value: investedAmount > 0 ? investedAmount : 1 },
    { name: 'Estimated Returns', value: estimatedReturns > 0 ? estimatedReturns : 0 },
  ], [investedAmount, estimatedReturns]);

  const hasData = investedAmount > 0;
  const [isMobile, setIsMobile] = useState(false);
  const [isSectionOpen, setIsSectionOpen] = useState(true);

  const formattedTotalValue = formatIndianCurrency(totalValue);
  const totalValueClass = getDynamicValueClass(formattedTotalValue);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768); // Tailwind's `md` breakpoint
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const cardContent = (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <div className="space-y-3">
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Total Invested Amount</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{formatIndianCurrency(investedAmount)}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Total Est. Returns</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatIndianCurrency(estimatedReturns)}</p>
          </div>
          <div className="pt-2">
            <p className="text-sm text-slate-500 dark:text-slate-400">Projected Total Value</p>
            <p className={`${totalValueClass} font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300`}>
              {formattedTotalValue}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 text-left pt-2 min-h-4">
              {totalValue > 0 ? numberToIndianWords(totalValue) : <>&nbsp;</>}
            </p>
            {inflationRate > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-200/75 dark:border-slate-700/75">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Inflation Adjusted for {futureYear}</p>
                  <div className="group relative">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-slate-400 dark:text-slate-500 cursor-help hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 16v-4" />
                      <path d="M12 8h.01" />
                    </svg>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2.5 bg-slate-800 text-white text-xs rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none">
                      In <span className="font-bold">{futureYear}</span>, your portfolio may be worth <span className="font-bold">{formatToWords(totalValue)}</span>. Adjusted for inflation, that’s equivalent to <span className="font-bold">{formatToWords(inflationAdjustedTotalValue)}</span> today.
                      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-800"></div>
                    </div>
                  </div>
                </div>
                <p className="text-2xl font-bold text-slate-700 dark:text-slate-200">
                  {formatIndianCurrency(inflationAdjustedTotalValue)}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="h-56 sm:h-64 w-full">
          {isActive && hasData ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  iconType="circle"
                  verticalAlign="bottom"
                  height={40}
                  wrapperStyle={isMobile ? { paddingTop: '20px' } : {}}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full w-full bg-slate-100/50 dark:bg-slate-800/50 rounded-lg">
              <p className="text-slate-500 dark:text-slate-400 text-center">Enter inputs to see the projection.</p>
            </div>
          )}
        </div>
      </div>

      {sipResults.investedAmount > 0 && lumpsumResults.investedAmount > 0 && (
        <div className="mt-6 pt-4 border-t border-slate-200/75 dark:border-slate-700/75 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-slate-100/50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200/75 dark:border-slate-700/75">
            <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-2 text-center sm:text-left">SIP Details</h3>
            <div className="space-y-1 text-sm">
              <p className="flex justify-between sm:grid sm:grid-cols-2">
                <span className="text-slate-600 dark:text-slate-400">Invested:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200 text-right sm:text-left">{formatIndianCurrency(sipResults.investedAmount)}</span>
              </p>
              <p className="flex justify-between sm:grid sm:grid-cols-2">
                <span className="text-slate-600 dark:text-slate-400">Returns:</span>
                <span className="font-medium text-emerald-700 dark:text-emerald-400 text-right sm:text-left">{formatIndianCurrency(sipResults.estimatedReturns)}</span>
              </p>
              <p className="flex justify-between sm:grid sm:grid-cols-2 mt-1 pt-1 border-t border-slate-200 dark:border-slate-700">
                <span className="text-slate-600 dark:text-slate-400 font-semibold">Total:</span>
                <span className="font-semibold text-emerald-700 dark:text-emerald-400 text-right sm:text-left">{formatIndianCurrency(sipResults.totalValue)}</span>
              </p>
            </div>
          </div>
          <div className="bg-slate-100/50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200/75 dark:border-slate-700/75">
            <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-2 text-center sm:text-left">Lumpsum Details</h3>
            <div className="space-y-1 text-sm">
              <p className="flex justify-between sm:grid sm:grid-cols-2">
                <span className="text-slate-600 dark:text-slate-400">Invested:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200 text-right sm:text-left">{formatIndianCurrency(lumpsumResults.investedAmount)}</span>
              </p>
              <p className="flex justify-between sm:grid sm:grid-cols-2">
                <span className="text-slate-600 dark:text-slate-400">Returns:</span>
                <span className="font-medium text-emerald-700 dark:text-emerald-400 text-right sm:text-left">{formatIndianCurrency(lumpsumResults.estimatedReturns)}</span>
              </p>
              <p className="flex justify-between sm:grid sm:grid-cols-2 mt-1 pt-1 border-t border-slate-200 dark:border-slate-700">
                <span className="text-slate-600 dark:text-slate-400 font-semibold">Total:</span>
                <span className="font-semibold text-emerald-700 dark:text-emerald-400 text-right sm:text-left">{formatIndianCurrency(lumpsumResults.totalValue)}</span>
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );

  if (hideContainer) {
    return (
      <div className="h-full flex flex-col justify-center">
        {cardContent}
      </div>
    );
  }

  return (
    <CollapsibleSection
      title="Investment Results"
      isOpen={isSectionOpen}
      toggle={() => setIsSectionOpen(!isSectionOpen)}
      isMobile={isMobile}
    >
      {cardContent}
    </CollapsibleSection>
  );
};

export default ResultsCard;
