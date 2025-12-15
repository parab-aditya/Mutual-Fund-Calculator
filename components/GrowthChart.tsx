
import React, { useState, useEffect, useMemo } from 'react';
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { formatIndianCurrency, formatAxisTick } from '../utils/formatters';
import CollapsibleSection from './CollapsibleSection';

interface GrowthData {
  year: number;
  investedAmount: number;
  estimatedReturns: number;
  totalValue: number;
  sipValue: number;
  lumpsumValue: number;
  inflationAdjustedTotalValue: number;
}

interface GrowthChartProps {
  data: GrowthData[];
  inflationRate: number;
  lumpsumAmount: number;
  monthlyInvestment: number;
  isActive: boolean;
  hideContainer?: boolean;
  hideTitle?: boolean;
}

const GrowthChart: React.FC<GrowthChartProps> = ({
  data,
  inflationRate,
  lumpsumAmount,
  monthlyInvestment,
  isActive,
  hideContainer = false,
  hideTitle = false
}) => {
  const [visibility, setVisibility] = useState({
    investedAmount: true,
    totalValue: true,
    sipValue: true,
    lumpsumValue: true,
    inflationAdjustedTotalValue: true,
  });
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isSectionOpen, setIsSectionOpen] = useState(true);

  useEffect(() => {
    // FIX: Replaced NodeJS.Timeout with ReturnType<typeof setTimeout> for browser compatibility.
    let resizeTimeout: ReturnType<typeof setTimeout>;

    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        const width = window.innerWidth;
        setIsMobile(width < 640);
        setIsTablet(width >= 640 && width < 1024);
      }, 150);
    };

    handleResize();
    window.addEventListener('resize', handleResize, { passive: true });
    return () => {
      clearTimeout(resizeTimeout);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleLegendClick = (data: any) => {
    const { dataKey } = data;
    setVisibility(prev => ({ ...prev, [dataKey]: !prev[dataKey as keyof typeof visibility] }));
  };

  const showBreakdown = monthlyInvestment > 0 && lumpsumAmount > 0;
  const showChart = isActive && data && data.length > 0;

  const CustomTooltip = ({ active, payload, label }: any) => {
    const [hidden, setHidden] = useState(false);

    useEffect(() => {
      if (hidden) setHidden(false);
    }, [label]);

    if (active && payload && payload.length && !hidden) {
      const data = payload[0].payload;
      return (
        <div className="bg-white/70 backdrop-blur-lg p-4 border border-slate-200/60 rounded-lg shadow-lg text-sm space-y-2 relative pr-8">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setHidden(true);
            }}
            className="absolute top-2 right-2 p-1 rounded-full hover:bg-slate-200/50 transition-colors focus:outline-none"
            title="Close tooltip"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          <p className="font-bold mb-2 text-slate-800">{`Year ${label}`}</p>
          <p className="flex justify-between">
            <span className="text-slate-500 mr-4">Invested:</span>
            <span className="font-semibold text-blue-600">{formatIndianCurrency(data.investedAmount)}</span>
          </p>
          {showBreakdown && (
            <>
              <div className="border-t border-slate-200/75 my-1"></div>
              <p className="flex justify-between">
                <span className="text-slate-500 mr-4">SIP Value:</span>
                <span className="font-semibold text-emerald-600">{formatIndianCurrency(data.sipValue)}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-slate-500 mr-4">Lumpsum Value:</span>
                <span className="font-semibold text-violet-500">{formatIndianCurrency(data.lumpsumValue)}</span>
              </p>
            </>
          )}
          <div className="border-t border-slate-200/75 my-1"></div>
          <p className="flex justify-between mt-1 font-bold">
            <span className="text-slate-600 mr-4">Total Value:</span>
            <span className="text-slate-800">{formatIndianCurrency(data.totalValue)}</span>
          </p>
          {inflationRate > 0 && (
            <p className="flex justify-between">
              <span className="text-slate-500 mr-4">Value (Today's terms):</span>
              <span className="font-semibold text-slate-600">{formatIndianCurrency(data.inflationAdjustedTotalValue)}</span>
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  const chartHeight = useMemo(() => isMobile ? 280 : isTablet ? 300 : 320, [isMobile, isTablet]);
  const legendHeight = useMemo(() => isMobile ? 36 : 24, [isMobile]);

  // Disable animations on mobile for better performance
  const animationDuration = useMemo(() => isMobile ? 0 : 800, [isMobile]);

  const chartContent = (
    <div style={{ width: '100%', height: chartHeight + legendHeight }}>
      {showChart ? (
        <ResponsiveContainer>
          <ComposedChart
            data={data}
            margin={{
              top: 5,
              right: isMobile ? 10 : 20,
              left: isMobile ? 0 : 10,
              bottom: isMobile ? 20 : 15,
            }}
          >
            <defs>
              <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#334155" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#334155" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.8} />
            <XAxis
              dataKey="year"
              tick={{ fontSize: isMobile ? 10 : 12, fill: '#64748b' }}
              axisLine={{ stroke: '#cbd5e1' }}
              tickLine={{ stroke: '#cbd5e1' }}
              interval={isMobile ? 'preserveStartEnd' : 'preserveStart'}
              label={isMobile ? undefined : { value: 'Years', position: 'insideBottom', offset: -5, fill: '#64748b', fontSize: 12 }}
            />
            <YAxis
              tickFormatter={formatAxisTick}
              tick={{ fontSize: isMobile ? 10 : 12, fill: '#64748b' }}
              axisLine={{ stroke: '#cbd5e1' }}
              tickLine={{ stroke: '#cbd5e1' }}
              width={isMobile ? 55 : 70}
              domain={['dataMin', 'auto']}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '5 5' }}
              animationDuration={200}
              wrapperStyle={{ outline: 'none', pointerEvents: 'auto' }}
            />
            <Legend
              verticalAlign="top"
              height={legendHeight}
              iconType="circle"
              onClick={handleLegendClick}
              wrapperStyle={{
                paddingBottom: isMobile ? '12px' : '8px',
                cursor: 'pointer',
                userSelect: 'none',
              }}
              iconSize={isMobile ? 8 : 10}
              formatter={(value: string) => (
                <span style={{
                  fontSize: isMobile ? '11px' : '13px',
                  color: '#475569',
                  fontWeight: 500,
                }}>
                  {value}
                </span>
              )}
            />
            <Area
              type="monotone"
              dataKey="totalValue"
              name="Total Value"
              stroke="#1e293b"
              strokeWidth={isMobile ? 2 : 3}
              dot={false}
              hide={!visibility.totalValue}
              fillOpacity={1}
              fill="url(#colorTotal)"
              animationDuration={animationDuration}
              isAnimationActive={!isMobile}
            />
            <Line
              type="monotone"
              dataKey="investedAmount"
              name="Invested Amount"
              stroke="#3b82f6"
              strokeWidth={isMobile ? 1.5 : 2}
              dot={false}
              hide={!visibility.investedAmount}
              animationDuration={animationDuration}
              isAnimationActive={!isMobile}
            />
            {showBreakdown && (
              <>
                <Line
                  type="monotone"
                  dataKey="sipValue"
                  name="SIP Value"
                  stroke="#10b981"
                  strokeWidth={isMobile ? 1.5 : 2}
                  dot={false}
                  hide={!visibility.sipValue}
                  animationDuration={animationDuration}
                  isAnimationActive={!isMobile}
                />
                <Line
                  type="monotone"
                  dataKey="lumpsumValue"
                  name="Lumpsum Value"
                  stroke="#8b5cf6"
                  strokeWidth={isMobile ? 1.5 : 2}
                  dot={false}
                  hide={!visibility.lumpsumValue}
                  animationDuration={animationDuration}
                  isAnimationActive={!isMobile}
                />
              </>
            )}
            {inflationRate > 0 && (
              <Line
                type="monotone"
                dataKey="inflationAdjustedTotalValue"
                name="Inflation Adjusted Value"
                stroke="#475569"
                strokeWidth={isMobile ? 1.5 : 2}
                strokeDasharray="5 5"
                dot={false}
                hide={!visibility.inflationAdjustedTotalValue}
                animationDuration={animationDuration}
                isAnimationActive={!isMobile}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-full w-full bg-slate-100/50 rounded-lg transition-all duration-300">
          <p className="text-slate-500 text-center px-4 text-sm sm:text-base">Your growth chart will appear here once you enter investment details.</p>
        </div>
      )}
    </div>
  );

  if (hideContainer) {
    return (
      <div className="transition-all duration-300">
        {!hideTitle && <h2 className="text-xl font-bold text-slate-800 mb-4 px-4 sm:px-0 text-center">Investment Growth Over Time</h2>}
        {chartContent}
      </div>
    );
  }

  return (
    <CollapsibleSection
      title="Investment Growth Over Time"
      isOpen={isSectionOpen}
      toggle={() => setIsSectionOpen(!isSectionOpen)}
      isMobile={isMobile}
    >
      {chartContent}
    </CollapsibleSection>
  );
};

export default GrowthChart;