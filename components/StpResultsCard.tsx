import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { formatIndianCurrency, getDynamicValueClass } from '../utils/formatters';
import { Palette } from '../design-system';
import CollapsibleSection from './CollapsibleSection';

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
      <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg p-3 border border-slate-200/60 dark:border-slate-700/60 rounded-lg shadow-lg">
        <p className="font-semibold text-slate-800 dark:text-slate-100">{`${payload[0].name}`}</p>
        <p className="text-sm text-slate-600 dark:text-slate-300">{formatIndianCurrency(payload[0].value)}</p>
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

  return (
    <CollapsibleSection
      title="STP Results"
      isOpen={isSectionOpen}
      toggle={() => setIsSectionOpen(!isSectionOpen)}
      isMobile={isMobile}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        <div className="space-y-3">
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Initial Investment</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{formatIndianCurrency(investedAmount)}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Amount at Source Fund</p>
            <p className="text-2xl font-bold text-slate-700 dark:text-slate-200">{formatIndianCurrency(sourceFundValue)}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Amount at Destination Fund</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatIndianCurrency(destinationFundValue)}</p>
          </div>
          <div className="pt-2">
            <p className="text-sm text-slate-500 dark:text-slate-400">Total Investment Value</p>
            <p className={`${totalValueClass} font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300`}>
              {formattedTotalValue}
            </p>
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
    </CollapsibleSection>
  );
};

export default StpResultsCard;
