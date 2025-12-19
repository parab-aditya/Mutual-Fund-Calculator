import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { formatIndianCurrency, getDynamicValueClass, numberToIndianWords, formatToWords } from '../utils/formatters';
import { Palette } from '../design-system';
import CollapsibleSection from './CollapsibleSection';

interface SwpResultsCardProps {
  totalInvestment: number;
  totalWithdrawal: number;
  finalValue: number;
  numberOfWithdrawals: number;
  timePeriod: number;
  inflationAdjustedFinalValue?: number;
  inflationRate?: number;
  isActive: boolean;
  hideContainer?: boolean;
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
  timePeriod,
  inflationAdjustedFinalValue,
  inflationRate = 0,
  isActive,
  hideContainer = false,
}) => {
  const currentYear = new Date().getFullYear();
  const futureYear = currentYear + timePeriod;

  const chartData = [
    { name: 'Initial Investment', value: totalInvestment > 0 ? totalInvestment : 1 }, // Min value for chart visibility
    { name: 'Total Withdrawal', value: totalWithdrawal > 0 ? totalWithdrawal : 0 },
  ];

  const hasData = totalInvestment > 0;
  const [isMobile, setIsMobile] = useState(false);
  const [isSectionOpen, setIsSectionOpen] = useState(true);

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

  const cardContent = (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
      <div className="space-y-3">
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
          <p className="text-xs text-slate-500 text-left pt-2 min-h-4">
            {finalValue > 0 ? numberToIndianWords(finalValue) : <>&nbsp;</>}
          </p>
          {inflationRate > 0 && inflationAdjustedFinalValue !== undefined && (
            <div className="mt-3 pt-3 border-t border-slate-200/75">
              <div className="flex items-center gap-1.5 mb-0.5">
                <p className="text-sm text-slate-500">Inflation Adjusted for {futureYear}</p>
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
                    className="text-slate-400 cursor-help hover:text-slate-600 transition-colors"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 16v-4" />
                    <path d="M12 8h.01" />
                  </svg>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2.5 bg-slate-800 text-white text-xs rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none">
                    In <span className="font-bold">{futureYear}</span>, your portfolio may be worth <span className="font-bold">{formatToWords(finalValue)}</span>. Adjusted for inflation, that’s equivalent to <span className="font-bold">{formatToWords(inflationAdjustedFinalValue)}</span> today.
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-800"></div>
                  </div>
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-700">
                {formatIndianCurrency(inflationAdjustedFinalValue)}
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
      title="SWP Results"
      isOpen={isSectionOpen}
      toggle={() => setIsSectionOpen(!isSectionOpen)}
      isMobile={isMobile}
    >
      {cardContent}
    </CollapsibleSection>
  );
};

export default SwpResultsCard;
