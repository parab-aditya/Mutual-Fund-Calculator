
import React, { useState, useEffect, useMemo, memo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { formatIndianCurrency, getDynamicValueClass } from '../utils/formatters';
import { Palette } from '../design-system';

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
  inflationRate: number;
  isActive: boolean;
}

const COLORS = [Palette.chart.invested, Palette.chart.returns];

const CustomTooltip = memo(({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/70 backdrop-blur-lg p-3 border border-slate-200/60 rounded-lg shadow-lg">
        <p className="font-semibold">{`${payload[0].name}`}</p>
        <p className="text-sm text-slate-600">{formatIndianCurrency(payload[0].value)}</p>
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
  inflationRate,
  isActive,
}) => {
  const chartData = useMemo(() => [
    { name: 'Invested Amount', value: investedAmount > 0 ? investedAmount : 1 },
    { name: 'Estimated Returns', value: estimatedReturns > 0 ? estimatedReturns : 0 },
  ], [investedAmount, estimatedReturns]);

  const hasData = investedAmount > 0;
  const [isMobile, setIsMobile] = useState(false);
  
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

  return (
    <div className="bg-white/60 backdrop-blur-xl p-6 rounded-2xl shadow-md h-full border border-slate-200/60 flex flex-col justify-center">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        <div className="space-y-3">
          <div>
            <p className="text-sm text-slate-500">Total Invested Amount</p>
            <p className="text-2xl font-bold text-slate-800">{formatIndianCurrency(investedAmount)}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Total Est. Returns</p>
            <p className="text-2xl font-bold text-emerald-600">{formatIndianCurrency(estimatedReturns)}</p>
          </div>
          <div className="pt-2">
            <p className="text-sm text-slate-500">Projected Total Value</p>
            <p className={`${totalValueClass} font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-700`}>
              {formattedTotalValue}
            </p>
            {inflationRate > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-200/75">
                   <p className="text-sm text-slate-500">Value in today's terms (adj. for inflation)</p>
                   <p className="text-2xl font-bold text-slate-700">
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
            <div className="flex items-center justify-center h-full w-full bg-slate-100/50 rounded-lg">
                <p className="text-slate-500 text-center">Enter inputs to see the projection.</p>
            </div>
           )}
        </div>
      </div>

      {sipResults.investedAmount > 0 && lumpsumResults.investedAmount > 0 && (
        <div className="mt-6 pt-4 border-t border-slate-200/75 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-100/50 p-4 rounded-lg border border-slate-200/75">
                <h3 className="font-semibold text-slate-700 mb-2 text-center sm:text-left">SIP Details</h3>
                <div className="space-y-1 text-sm">
                    <p className="flex justify-between sm:grid sm:grid-cols-2">
                        <span className="text-slate-600">Invested:</span>
                        <span className="font-medium text-slate-800 text-right sm:text-left">{formatIndianCurrency(sipResults.investedAmount)}</span>
                    </p>
                    <p className="flex justify-between sm:grid sm:grid-cols-2">
                        <span className="text-slate-600">Returns:</span>
                        <span className="font-medium text-emerald-700 text-right sm:text-left">{formatIndianCurrency(sipResults.estimatedReturns)}</span>
                    </p>
                    <p className="flex justify-between sm:grid sm:grid-cols-2 mt-1 pt-1 border-t border-slate-200">
                        <span className="text-slate-600 font-semibold">Total:</span>
                        <span className="font-semibold text-emerald-700 text-right sm:text-left">{formatIndianCurrency(sipResults.totalValue)}</span>
                    </p>
                </div>
            </div>
            <div className="bg-slate-100/50 p-4 rounded-lg border border-slate-200/75">
                <h3 className="font-semibold text-slate-700 mb-2 text-center sm:text-left">Lumpsum Details</h3>
                <div className="space-y-1 text-sm">
                    <p className="flex justify-between sm:grid sm:grid-cols-2">
                        <span className="text-slate-600">Invested:</span>
                        <span className="font-medium text-slate-800 text-right sm:text-left">{formatIndianCurrency(lumpsumResults.investedAmount)}</span>
                    </p>
                    <p className="flex justify-between sm:grid sm:grid-cols-2">
                        <span className="text-slate-600">Returns:</span>
                        <span className="font-medium text-emerald-700 text-right sm:text-left">{formatIndianCurrency(lumpsumResults.estimatedReturns)}</span>
                    </p>
                     <p className="flex justify-between sm:grid sm:grid-cols-2 mt-1 pt-1 border-t border-slate-200">
                        <span className="text-slate-600 font-semibold">Total:</span>
                        <span className="font-semibold text-emerald-700 text-right sm:text-left">{formatIndianCurrency(lumpsumResults.totalValue)}</span>
                    </p>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default ResultsCard;
