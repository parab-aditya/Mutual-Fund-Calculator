
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
import { StpGrowthData } from '../calculators/stp/types';

interface StpGrowthChartProps {
  data: StpGrowthData[];
  isActive: boolean;
}

const StpGrowthChart: React.FC<StpGrowthChartProps> = ({ data, isActive }) => {
  const [visibility, setVisibility] = useState({
    sourceFundValue: true,
    destinationFundValue: true,
    totalValue: true,
  });
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

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

  const showChart = isActive && data && data.length > 0;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload;
      return (
        <div className="bg-white/70 backdrop-blur-lg p-4 border border-slate-200/60 rounded-lg shadow-lg text-sm space-y-2">
          <p className="font-bold mb-2 text-slate-800">{`Year ${label}`}</p>
          <p className="flex justify-between">
            <span className="text-slate-500 mr-4">Source Fund:</span>
            <span className="font-semibold text-indigo-600">{formatIndianCurrency(point.sourceFundValue)}</span>
          </p>
          <p className="flex justify-between">
            <span className="text-slate-500 mr-4">Destination Fund:</span>
            <span className="font-semibold text-emerald-600">{formatIndianCurrency(point.destinationFundValue)}</span>
          </p>
          <div className="border-t border-slate-200/75 my-1"></div>
          <p className="flex justify-between mt-1 font-bold">
            <span className="text-slate-600 mr-4">Total Value:</span>
            <span className="text-slate-800">{formatIndianCurrency(point.totalValue)}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const chartHeight = useMemo(() => isMobile ? 280 : isTablet ? 300 : 320, [isMobile, isTablet]);
  const legendHeight = useMemo(() => isMobile ? 60 : 40, [isMobile]);
  
  // Disable animations on mobile for better performance
  const animationDuration = useMemo(() => isMobile ? 0 : 800, [isMobile]);

  return (
    <div className="bg-white/60 backdrop-blur-xl py-4 sm:p-6 rounded-2xl shadow-md border border-slate-200/60 transition-all duration-300">
      <h2 className="text-xl font-bold text-slate-800 mb-4 px-4 sm:px-0 text-center">Growth Over Time</h2>
      <div style={{ width: '100%', height: chartHeight + legendHeight }}>
        {showChart ? (
          <ResponsiveContainer>
            <ComposedChart
              data={data}
              margin={{
                top: legendHeight,
                right: isMobile ? 10 : 20,
                left: isMobile ? 0 : 10,
                bottom: isMobile ? 20 : 15,
              }}
            >
              <defs>
                <linearGradient id="colorStpTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#334155" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#334155" stopOpacity={0}/>
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
                fill="url(#colorStpTotal)"
                animationDuration={animationDuration}
                isAnimationActive={!isMobile}
              />
              <Line
                type="monotone"
                dataKey="sourceFundValue"
                name="Source Fund"
                stroke="#4338ca"
                strokeWidth={isMobile ? 1.5 : 2}
                dot={false}
                hide={!visibility.sourceFundValue}
                animationDuration={animationDuration}
                isAnimationActive={!isMobile}
              />
              <Line
                type="monotone"
                dataKey="destinationFundValue"
                name="Destination Fund"
                stroke="#10b981"
                strokeWidth={isMobile ? 1.5 : 2}
                dot={false}
                hide={!visibility.destinationFundValue}
                animationDuration={animationDuration}
                isAnimationActive={!isMobile}
              />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full w-full bg-slate-100/50 rounded-lg transition-all duration-300">
            <p className="text-slate-500 text-center px-4 text-sm sm:text-base">Your growth chart will appear here once you enter STP details.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StpGrowthChart;