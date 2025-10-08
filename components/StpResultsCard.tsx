import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { formatIndianCurrency, getDynamicValueClass } from '../utils/formatters';
import { Palette } from '../design-system';

interface StpResultsCardProps {
  investedAmount: number;
  sourceFundValue: number;
  destinationFundValue: number;
  totalValue: number;
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

const StpResultsCard: React.FC<StpResultsCardProps> = ({
  investedAmount,
  sourceFundValue,
  destinationFundValue,
  totalValue,
  isActive,
}) => {
  const hasData = investedAmount > 0;
  const estimatedGains = totalValue - investedAmount;
  
  const chartData = [
    { name: 'Initial Investment', value: investedAmount > 0 ? investedAmount : 1 },
    { name: 'Estimated Gains', value: estimatedGains > 0 ? estimatedGains : 0 },
  ];

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
    <div className="bg-white/60 backdrop-blur-xl p-6 sm:p-8 rounded-2xl shadow-md h-full border border-slate-200/60 flex flex-col justify-center">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="order-2 md:order-1 space-y-4">
          <div>
            <p className="text-sm text-slate-500">Initial Investment</p>
            <p className="text-2xl font-bold text-slate-800">{formatIndianCurrency(investedAmount)}</p>
          </div>
           <div>
            <p className="text-sm text-slate-500">Amount at Source Fund</p>
            <p className="text-2xl font-bold text-slate-700">{formatIndianCurrency(sourceFundValue)}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Amount at Destination Fund</p>
            <p className="text-2xl font-bold text-emerald-600">{formatIndianCurrency(destinationFundValue)}</p>
          </div>
          <div className="pt-2">
            <p className="text-sm text-slate-500">Total Investment Value</p>
            <p className={`${totalValueClass} font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-700`}>
              {formattedTotalValue}
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

export default StpResultsCard;