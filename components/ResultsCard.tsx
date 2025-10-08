
import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { formatIndianCurrency } from '../utils/formatters';

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
}

const COLORS = ['#6366f1', '#10b981']; // Indigo for invested, Emerald for returns

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/70 backdrop-blur-lg p-3 border border-white/20 rounded-lg shadow-lg">
        <p className="font-semibold">{`${payload[0].name}`}</p>
        <p className="text-sm text-slate-600">{formatIndianCurrency(payload[0].value)}</p>
      </div>
    );
  }
  return null;
};

const ResultsCard: React.FC<ResultsCardProps> = ({
  investedAmount,
  estimatedReturns,
  totalValue,
  inflationAdjustedTotalValue,
  sipResults,
  lumpsumResults,
  inflationRate,
}) => {
  const chartData = [
    { name: 'Invested Amount', value: investedAmount > 0 ? investedAmount : 1 }, // Min value for chart visibility
    { name: 'Estimated Returns', value: estimatedReturns > 0 ? estimatedReturns : 0 },
  ];

  const hasData = investedAmount > 0;
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768); // Tailwind's `md` breakpoint
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="bg-white/60 backdrop-blur-xl p-6 sm:p-8 rounded-3xl shadow-lg h-full border border-white/20 flex flex-col justify-center">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="order-2 md:order-1 space-y-4">
          <div>
            <p className="text-sm text-slate-600">Total Invested Amount</p>
            <p className="text-2xl font-bold text-slate-800">{formatIndianCurrency(investedAmount)}</p>
          </div>
          <div>
            <p className="text-sm text-slate-600">Total Est. Returns</p>
            <p className="text-2xl font-bold text-emerald-600">{formatIndianCurrency(estimatedReturns)}</p>
          </div>
          <div className="pt-2">
            <p className="text-sm text-slate-600">Projected Total Value</p>
            <p className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
              {formatIndianCurrency(totalValue)}
            </p>
            {inflationRate > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-300/70">
                   <p className="text-sm text-slate-600">Value in today's terms (adj. for inflation)</p>
                   <p className="text-2xl font-bold text-slate-700">
                       {formatIndianCurrency(inflationAdjustedTotalValue)}
                   </p>
              </div>
            )}
          </div>
        </div>

        <div className="order-1 md:order-2 h-64 sm:h-72 w-full">
           {hasData ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
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
            <div className="flex items-center justify-center h-full w-full bg-slate-50/50 rounded-lg">
                <p className="text-slate-500 text-center">Enter inputs to see the projection.</p>
            </div>
           )}
        </div>
      </div>

      {sipResults.investedAmount > 0 && lumpsumResults.investedAmount > 0 && (
        <div className="mt-8 pt-6 border-t border-white/30 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/60">
                <h3 className="font-bold text-slate-700 mb-2 text-center sm:text-left">SIP Details</h3>
                <div className="space-y-1 text-sm">
                    <p className="flex justify-between sm:grid sm:grid-cols-2">
                        <span className="text-slate-600">Invested:</span>
                        <span className="font-medium text-slate-800 text-right sm:text-left">{formatIndianCurrency(sipResults.investedAmount)}</span>
                    </p>
                    <p className="flex justify-between sm:grid sm:grid-cols-2">
                        <span className="text-slate-600">Returns:</span>
                        <span className="font-medium text-emerald-700 text-right sm:text-left">{formatIndianCurrency(sipResults.estimatedReturns)}</span>
                    </p>
                    <p className="flex justify-between sm:grid sm:grid-cols-2 mt-1 pt-1 border-t border-slate-300/50">
                        <span className="text-slate-600">Total:</span>
                        <span className="font-semibold text-indigo-700 text-right sm:text-left">{formatIndianCurrency(sipResults.totalValue)}</span>
                    </p>
                </div>
            </div>
            <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/60">
                <h3 className="font-bold text-slate-700 mb-2 text-center sm:text-left">Lumpsum Details</h3>
                <div className="space-y-1 text-sm">
                    <p className="flex justify-between sm:grid sm:grid-cols-2">
                        <span className="text-slate-600">Invested:</span>
                        <span className="font-medium text-slate-800 text-right sm:text-left">{formatIndianCurrency(lumpsumResults.investedAmount)}</span>
                    </p>
                    <p className="flex justify-between sm:grid sm:grid-cols-2">
                        <span className="text-slate-600">Returns:</span>
                        <span className="font-medium text-emerald-700 text-right sm:text-left">{formatIndianCurrency(lumpsumResults.estimatedReturns)}</span>
                    </p>
                     <p className="flex justify-between sm:grid sm:grid-cols-2 mt-1 pt-1 border-t border-slate-300/50">
                        <span className="text-slate-600">Total:</span>
                        <span className="font-semibold text-indigo-700 text-right sm:text-left">{formatIndianCurrency(lumpsumResults.totalValue)}</span>
                    </p>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default ResultsCard;
