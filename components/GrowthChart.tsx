import React, { useState } from 'react';
import {
  LineChart,
  Line,
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
}

interface GrowthChartProps {
  data: GrowthData[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-4 border rounded-lg shadow-lg text-sm space-y-2">
        <p className="font-bold mb-2 text-slate-800">{`Year ${label}`}</p>
        <p className="flex justify-between">
          <span className="text-slate-500 mr-4">Invested:</span>
          <span className="font-semibold text-slate-700">{formatIndianCurrency(data.investedAmount)}</span>
        </p>
        <div className="border-t border-slate-200 my-1"></div>
        <p className="flex justify-between">
          <span className="text-slate-500 mr-4">SIP Value:</span>
          <span className="font-semibold text-slate-700">{formatIndianCurrency(data.sipValue)}</span>
        </p>
         <p className="flex justify-between">
          <span className="text-slate-500 mr-4">Lumpsum Value:</span>
          <span className="font-semibold text-slate-700">{formatIndianCurrency(data.lumpsumValue)}</span>
        </p>
        <div className="border-t border-slate-200 my-1"></div>
        <p className="flex justify-between mt-1 font-bold">
          <span className="text-slate-600 mr-4">Total Value:</span>
          <span className="text-indigo-600">{formatIndianCurrency(data.totalValue)}</span>
        </p>
      </div>
    );
  }
  return null;
};


const GrowthChart: React.FC<GrowthChartProps> = ({ data }) => {
  const [visibility, setVisibility] = useState({
    investedAmount: true,
    totalValue: true,
    sipValue: true,
    lumpsumValue: true,
  });

  const handleLegendClick = (data: any) => {
    const { dataKey } = data;
    setVisibility(prev => ({ ...prev, [dataKey]: !prev[dataKey as keyof typeof visibility] }));
  };

  if (!data || data.length === 0) {
    return (
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200/80 text-center">
            <h2 className="text-xl font-bold text-slate-800 mb-2">Investment Growth Over Time</h2>
            <p className="text-slate-500">Your growth chart will appear here once you enter investment details.</p>
        </div>
    );
  }

  return (
    <div className="bg-white py-6 sm:p-8 rounded-none sm:rounded-2xl shadow-lg border-x-0 sm:border border-slate-200/80">
      <h2 className="text-xl font-bold text-slate-800 mb-6 px-4 sm:px-0">Investment Growth Over Time</h2>
      <div style={{ width: '100%', height: 400 }}>
        <ResponsiveContainer>
          <LineChart
            data={data}
            margin={{
              top: 10,
              right: 20,
              left: 20,
              bottom: 10,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
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
            <Legend verticalAlign="top" height={36} iconType="circle" onClick={handleLegendClick} />
            <Line
              type="monotone"
              dataKey="investedAmount"
              name="Invested Amount"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              hide={!visibility.investedAmount}
            />
            <Line
              type="monotone"
              dataKey="totalValue"
              name="Total Value"
              stroke="#4f46e5"
              strokeWidth={2.5}
              dot={false}
              hide={!visibility.totalValue}
            />
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
              stroke="#8b5cf6"
              strokeWidth={2}
              dot={false}
              hide={!visibility.lumpsumValue}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default GrowthChart;
