
import React from 'react';
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
  sipResults: ResultBreakdown;
  lumpsumResults: ResultBreakdown;
}

const COLORS = ['#3b82f6', '#10b981']; // Blue for invested, Green for returns

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border rounded-lg shadow-lg">
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
  sipResults,
  lumpsumResults,
}) => {
  const chartData = [
    { name: 'Invested Amount', value: investedAmount > 0 ? investedAmount : 1 }, // Min value for chart visibility
    { name: 'Estimated Returns', value: estimatedReturns > 0 ? estimatedReturns : 0 },
  ];

  const hasData = investedAmount > 0;

  return (
    <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg h-full border border-slate-200/80 flex flex-col justify-center">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="order-2 md:order-1 space-y-4">
          <div>
            <p className="text-sm text-slate-500">Total Invested Amount</p>
            <p className="text-2xl font-bold text-slate-800">{formatIndianCurrency(investedAmount)}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Total Est. Returns</p>
            <p className="text-2xl font-bold text-slate-800">{formatIndianCurrency(estimatedReturns)}</p>
          </div>
          <div className="pt-2 border-t border-slate-200">
            <p className="text-sm text-slate-500">Total Value</p>
            <p className="text-3xl font-extrabold text-indigo-600">{formatIndianCurrency(totalValue)}</p>
          </div>
        </div>

        <div className="order-1 md:order-2 h-64 sm:h-72 w-full">
           {hasData ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
           ) : (
            <div className="flex items-center justify-center h-full w-full bg-slate-50 rounded-lg">
                <p className="text-slate-500 text-center">Enter valid inputs to see the projection.</p>
            </div>
           )}
        </div>
      </div>

      {(sipResults.investedAmount > 0 || lumpsumResults.investedAmount > 0) && (
        <div className="mt-8 pt-6 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            {sipResults.investedAmount > 0 && (
                <div className="bg-slate-50/70 p-4 rounded-lg border border-slate-200/80">
                    <h3 className="font-bold text-slate-700 mb-2 text-center sm:text-left">SIP Details</h3>
                    <div className="space-y-1 text-sm">
                        <p className="flex justify-between sm:grid sm:grid-cols-2">
                            <span className="text-slate-500">Invested:</span>
                            <span className="font-medium text-slate-800 text-right sm:text-left">{formatIndianCurrency(sipResults.investedAmount)}</span>
                        </p>
                        <p className="flex justify-between sm:grid sm:grid-cols-2">
                            <span className="text-slate-500">Returns:</span>
                            <span className="font-medium text-slate-800 text-right sm:text-left">{formatIndianCurrency(sipResults.estimatedReturns)}</span>
                        </p>
                        <p className="flex justify-between sm:grid sm:grid-cols-2 mt-1 pt-1 border-t border-slate-200">
                            <span className="text-slate-500">Total:</span>
                            <span className="font-semibold text-indigo-600 text-right sm:text-left">{formatIndianCurrency(sipResults.totalValue)}</span>
                        </p>
                    </div>
                </div>
            )}
             {lumpsumResults.investedAmount > 0 && (
                <div className="bg-slate-50/70 p-4 rounded-lg border border-slate-200/80">
                    <h3 className="font-bold text-slate-700 mb-2 text-center sm:text-left">Lumpsum Details</h3>
                    <div className="space-y-1 text-sm">
                        <p className="flex justify-between sm:grid sm:grid-cols-2">
                            <span className="text-slate-500">Invested:</span>
                            <span className="font-medium text-slate-800 text-right sm:text-left">{formatIndianCurrency(lumpsumResults.investedAmount)}</span>
                        </p>
                        <p className="flex justify-between sm:grid sm:grid-cols-2">
                            <span className="text-slate-500">Returns:</span>
                            <span className="font-medium text-slate-800 text-right sm:text-left">{formatIndianCurrency(lumpsumResults.estimatedReturns)}</span>
                        </p>
                         <p className="flex justify-between sm:grid sm:grid-cols-2 mt-1 pt-1 border-t border-slate-200">
                            <span className="text-slate-500">Total:</span>
                            <span className="font-semibold text-indigo-600 text-right sm:text-left">{formatIndianCurrency(lumpsumResults.totalValue)}</span>
                        </p>
                    </div>
                </div>
            )}
        </div>
      )}
    </div>
  );
};

export default ResultsCard;
