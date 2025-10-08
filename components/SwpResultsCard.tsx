import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { formatIndianCurrency, getDynamicValueClass } from '../utils/formatters';
import { Palette } from '../design-system';

interface SwpResultsCardProps {
  totalInvestment: number;
  totalWithdrawal: number;
  finalValue: number;
  numberOfWithdrawals: number;
  isActive: boolean;
}

const COLORS = [Palette.chart.invested, Palette.chart.returns];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/70 backdrop-blur-lg p-3 border border-slate-200/60 rounded-lg shadow-lg">
        <p className="font-semibold">{`${payload[0].name}`}</p>
        <p className="text-sm text-slate-600">{formatIndianCurrency(payload[0].value)}</p>
      </div>
    );
  }
  return null;
};

const SwpResultsCard: React.FC<SwpResultsCardProps> = ({
  totalInvestment,
  totalWithdrawal,
  finalValue,
  numberOfWithdrawals,
  isActive,
}) => {
  const chartData = [
    { name: 'Initial Investment', value: totalInvestment > 0 ? totalInvestment : 1 }, // Min value for chart visibility
    { name: 'Total Withdrawal', value: totalWithdrawal > 0 ? totalWithdrawal : 0 },
  ];

  const hasData = totalInvestment > 0;
  const [isMobile, setIsMobile] = useState(false);
  
  const formattedFinalValue = formatIndianCurrency(finalValue);
  const finalValueClass = getDynamicValueClass(formattedFinalValue);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768); // Tailwind's `md` breakpoint
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="bg-white/60 backdrop-blur-xl p-6 sm:p-8 rounded-2xl shadow-md h-full border border-slate-200/60 flex flex-col justify-center">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="order-2 md:order-1 space-y-4">
          <div>
            <p className="text-sm text-slate-500">Total Investment</p>
            <p className="text-2xl font-bold text-slate-800">{formatIndianCurrency(totalInvestment)}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Total Withdrawal</p>
            <p className="text-2xl font-bold text-emerald-600">{formatIndianCurrency(totalWithdrawal)}</p>
          </div>
           <div>
              <p className="text-sm text-slate-500">Number of Withdrawals</p>
              <p className="text-2xl font-bold text-slate-800">{numberOfWithdrawals} <span className="text-lg font-medium">months</span></p>
          </div>
          <div className="pt-2">
            <p className="text-sm text-slate-500">Final Balance</p>
            <p className={`${finalValueClass} font-extrabold ${finalValue < 0 ? 'text-red-600' : 'text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-700'}`}>
              {formattedFinalValue}
            </p>
          </div>
        </div>

        <div className="order-1 md:order-2 h-64 sm:h-72 w-full">
           {isActive && hasData ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
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
            <div className="flex items-center justify-center h-full w-full bg-slate-100/50 rounded-lg">
                <p className="text-slate-500 text-center">Enter inputs to see the projection.</p>
            </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default SwpResultsCard;