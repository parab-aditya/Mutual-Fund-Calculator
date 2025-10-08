
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
}

const GrowthChart: React.FC<GrowthChartProps> = ({ data, inflationRate, lumpsumAmount, monthlyInvestment }) => {
  const [visibility, setVisibility] = useState({
    investedAmount: true,
    totalValue: true,
    sipValue: true,
    lumpsumValue: true,
    inflationAdjustedTotalValue: true,
  });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize(); // Set initial value
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLegendClick = (data: any) => {
    const { dataKey } = data;
    setVisibility(prev => ({ ...prev, [dataKey]: !prev[dataKey as keyof typeof visibility] }));
  };
  
  const showBreakdown = monthlyInvestment > 0 && lumpsumAmount > 0;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white/70 backdrop-blur-lg p-4 border border-white/20 rounded-lg shadow-lg text-sm space-y-2">
          <p className="font-bold mb-2 text-slate-800">{`Year ${label}`}</p>
          <p className="flex justify-between">
            <span className="text-slate-500 mr-4">Invested:</span>
            <span className="font-semibold text-blue-600">{formatIndianCurrency(data.investedAmount)}</span>
          </p>
          {showBreakdown && (
            <>
              <div className="border-t border-slate-200/50 my-1"></div>
              <p className="flex justify-between">
                <span className="text-slate-500 mr-4">SIP Value:</span>
                <span className="font-semibold text-emerald-600">{formatIndianCurrency(data.sipValue)}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-slate-500 mr-4">Lumpsum Value:</span>
                <span className="font-semibold text-orange-500">{formatIndianCurrency(data.lumpsumValue)}</span>
              </p>
            </>
          )}
          <div className="border-t border-slate-200/50 my-1"></div>
          <p className="flex justify-between mt-1 font-bold">
            <span className="text-slate-600 mr-4">Total Value:</span>
            <span className="text-violet-600">{formatIndianCurrency(data.totalValue)}</span>
          </p>
          {inflationRate > 0 && (
             <p className="flex justify-between">
              <span className="text-slate-500 mr-4">Value (Today's terms):</span>
              <span className="font-semibold text-slate-700">{formatIndianCurrency(data.inflationAdjustedTotalValue)}</span>
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  if (!data || data.length === 0) {
    return (
        <div className="bg-white/60 backdrop-blur-xl p-8 rounded-3xl shadow-lg border border-white/20 text-center">
            <h2 className="text-xl font-bold text-slate-800 mb-2">Investment Growth Over Time</h2>
            <p className="text-slate-600">Your growth chart will appear here once you enter investment details.</p>
        </div>
    );
  }

  return (
    <div className="bg-white/60 backdrop-blur-xl py-6 sm:p-8 rounded-3xl shadow-lg border border-white/20">
      <h2 className="text-xl font-bold text-slate-800 mb-6 px-4 sm:px-0 text-center">Investment Growth Over Time</h2>
      <div style={{ width: '100%', height: 400 }}>
        <ResponsiveContainer>
          <ComposedChart
            data={data}
            margin={{
              top: 10,
              right: 20,
              left: 20,
              bottom: isMobile ? 50 : 10,
            }}
          >
            <defs>
              <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.7}/>
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.6} />
            <XAxis 
              dataKey="year" 
              tick={{ fontSize: 12, fill: '#64748b' }} 
              axisLine={{ stroke: '#cbd5e1' }}
              tickLine={{ stroke: '#cbd5e1' }}
              interval="preserveStartEnd"
              label={{ value: 'Years', position: 'insideBottom', offset: -5, fill: '#64748b', fontSize: 12 }}
            />
            <YAxis
              tickFormatter={formatAxisTick}
              tick={{ fontSize: 12, fill: '#64748b' }}
              axisLine={{ stroke: '#cbd5e1' }}
              tickLine={{ stroke: '#cbd5e1' }}
              width={80}
              domain={['dataMin', 'auto']}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign={isMobile ? 'bottom' : 'top'} height={36} iconType="circle" onClick={handleLegendClick} />
             <Area
              type="monotone"
              dataKey="totalValue"
              name="Total Value"
              stroke="#8b5cf6"
              strokeWidth={2.5}
              dot={false}
              hide={!visibility.totalValue}
              fillOpacity={1} 
              fill="url(#colorTotal)"
            />
            <Line
              type="monotone"
              dataKey="investedAmount"
              name="Invested Amount"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              hide={!visibility.investedAmount}
            />
            {showBreakdown && (
              <>
                <Line
                  type="monotone"
                  dataKey="sipValue"
                  name="SIP Value"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                  hide={!visibility.sipValue}
                />
                <Line
                  type="monotone"
                  dataKey="lumpsumValue"
                  name="Lumpsum Value"
                  stroke="#f97316"
                  strokeWidth={2}
                  dot={false}
                  hide={!visibility.lumpsumValue}
                />
              </>
            )}
            {inflationRate > 0 && (
                <Line
                type="monotone"
                dataKey="inflationAdjustedTotalValue"
                name="Inflation Adjusted Value"
                stroke="#718096"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                hide={!visibility.inflationAdjustedTotalValue}
                />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default GrowthChart;
