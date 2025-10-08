import React, { useState, useEffect } from 'react';
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
}

const StpGrowthChart: React.FC<StpGrowthChartProps> = ({ data }) => {
  const [visibility, setVisibility] = useState({
    sourceFundValue: true,
    destinationFundValue: true,
    totalValue: true,
  });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLegendClick = (data: any) => {
    const { dataKey } = data;
    setVisibility(prev => ({ ...prev, [dataKey]: !prev[dataKey as keyof typeof visibility] }));
  };

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

  if (!data || data.length === 0) {
    return (
        <div className="bg-white/60 backdrop-blur-xl p-8 rounded-2xl shadow-md border border-slate-200/60 text-center">
            <h2 className="text-xl font-bold text-slate-800 mb-2">Growth Over Time</h2>
            <div className="h-[340px] flex items-center justify-center">
                <p className="text-slate-600">Your growth chart will appear here once you enter STP details.</p>
            </div>
        </div>
    );
  }

  return (
    <div className="bg-white/60 backdrop-blur-xl py-6 sm:p-8 rounded-2xl shadow-md border border-slate-200/60">
      <h2 className="text-xl font-bold text-slate-800 mb-6 px-4 sm:px-0 text-center">Growth Over Time</h2>
      <div style={{ width: '100%', height: 400 }}>
        <ResponsiveContainer>
          <ComposedChart
            data={data}
            margin={{
              top: 10,
              right: 20,
              left: 20,
              bottom: isMobile ? 50 : 20,
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
              tick={{ fontSize: 12, fill: '#64748b' }} 
              axisLine={{ stroke: '#cbd5e1' }}
              tickLine={{ stroke: '#cbd5e1' }}
              interval="preserveStartEnd"
              label={isMobile ? undefined : { value: 'Years', position: 'insideBottom', offset: -10, fill: '#64748b', fontSize: 12 }}
            />
            <YAxis
              tickFormatter={formatAxisTick}
              tick={{ fontSize: 12, fill: '#64748b' }}
              axisLine={{ stroke: '#cbd5e1' }}
              tickLine={{ stroke: '#cbd5e1' }}
              width={70}
              domain={['dataMin', 'auto']}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign={isMobile ? 'bottom' : 'top'} height={36} iconType="circle" onClick={handleLegendClick} />
             <Area
              type="monotone"
              dataKey="totalValue"
              name="Total Value"
              stroke="#1e293b"
              strokeWidth={3}
              dot={false}
              hide={!visibility.totalValue}
              fillOpacity={1} 
              fill="url(#colorStpTotal)"
            />
            <Line
              type="monotone"
              dataKey="sourceFundValue"
              name="Source Fund"
              stroke="#4338ca"
              strokeWidth={2}
              dot={false}
              hide={!visibility.sourceFundValue}
            />
            <Line
              type="monotone"
              dataKey="destinationFundValue"
              name="Destination Fund"
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
              hide={!visibility.destinationFundValue}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default StpGrowthChart;
