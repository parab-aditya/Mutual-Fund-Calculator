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
import { SwpGrowthData } from '../calculators/swp/types';

interface SwpGrowthChartProps {
  data: SwpGrowthData[];
  isActive: boolean;
}

const SwpGrowthChart: React.FC<SwpGrowthChartProps> = ({ data, isActive }) => {
  const [visibility, setVisibility] = useState({
    balance: true,
    totalWithdrawal: true,
    initialInvestment: false, // Hide by default as it's just a reference
  });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLegendClick = (data: any) => {
    const { dataKey } = data;
    setVisibility(prev => ({ ...prev, [dataKey]: !prev[dataKey as keyof typeof visibility] }));
  };

  const showChart = isActive && data && data.length > 0;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white/70 backdrop-blur-lg p-4 border border-slate-200/60 rounded-lg shadow-lg text-sm space-y-2">
          <p className="font-bold mb-2 text-slate-800">{`End of Year ${label}`}</p>
          <p className="flex justify-between">
            <span className="text-slate-500 mr-4">Total Withdrawn:</span>
            <span className="font-semibold text-emerald-600">{formatIndianCurrency(data.totalWithdrawal)}</span>
          </p>
          <div className="border-t border-slate-200/75 my-1"></div>
          <p className="flex justify-between mt-1 font-bold">
            <span className="text-slate-600 mr-4">Remaining Balance:</span>
            <span className={`font-semibold ${data.balance < 0 ? 'text-red-600' : 'text-slate-800'}`}>{formatIndianCurrency(data.balance)}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ width: '100%', height: 400 }}>
      {showChart ? (
        <ResponsiveContainer>
          <ComposedChart
            data={data}
            margin={{ top: 10, right: 20, left: 20, bottom: isMobile ? 50 : 20, }}
          >
            <defs>
              <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4338ca" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#4338ca" stopOpacity={0}/>
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
              domain={['auto', 'auto']} // Allow negative domain
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign={isMobile ? 'bottom' : 'top'} height={36} iconType="circle" onClick={handleLegendClick} />
            <Area
              type="monotone"
              dataKey="balance"
              name="Remaining Balance"
              stroke="#4338ca"
              strokeWidth={3}
              dot={false}
              hide={!visibility.balance}
              fillOpacity={1} 
              fill="url(#colorBalance)"
            />
            <Line
              type="monotone"
              dataKey="totalWithdrawal"
              name="Total Withdrawal"
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
              hide={!visibility.totalWithdrawal}
            />
            <Line
              type="monotone"
              dataKey="initialInvestment"
              name="Initial Investment"
              stroke="#3b82f6"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              hide={!visibility.initialInvestment}
            />
          </ComposedChart>
        </ResponsiveContainer>
      ) : (
          <div className="flex items-center justify-center h-full w-full bg-slate-100/50 rounded-lg">
            <p className="text-slate-500 text-center px-4">Your growth chart will appear here once you enter SWP details.</p>
          </div>
      )}
    </div>
  );
};

export default SwpGrowthChart;