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
    ReferenceLine,
} from 'recharts';
import { formatIndianCurrency, formatAxisTick } from '../../utils/formatters';
import { CoastFireGrowthData } from './types';

interface CoastFireGrowthChartProps {
    data: CoastFireGrowthData[];
    goalCorpus: number;
    yearsToGoal: number;
    isActive: boolean;
}

const CoastFireGrowthChart: React.FC<CoastFireGrowthChartProps> = ({
    data,
    goalCorpus,
    yearsToGoal,
    isActive,
}) => {
    const [visibility, setVisibility] = useState({
        investedAmount: true,
        totalValue: true,
    });
    const [isMobile, setIsMobile] = useState(false);
    const [isTablet, setIsTablet] = useState(false);

    useEffect(() => {
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
            const dataPoint = payload[0].payload;
            return (
                <div className="bg-white/70 backdrop-blur-lg p-4 border border-slate-200/60 rounded-lg shadow-lg text-sm space-y-2">
                    <p className="font-bold mb-2 text-slate-800">{`Year ${label}`}</p>
                    <p className="flex justify-between">
                        <span className="text-slate-500 mr-4">Invested:</span>
                        <span className="font-semibold text-blue-600">{formatIndianCurrency(dataPoint.investedAmount)}</span>
                    </p>
                    <div className="border-t border-slate-200/75 my-1"></div>
                    <p className="flex justify-between mt-1 font-bold">
                        <span className="text-slate-600 mr-4">Total Value:</span>
                        <span className="text-slate-800">{formatIndianCurrency(dataPoint.totalValue)}</span>
                    </p>
                    {dataPoint.totalValue >= goalCorpus && (
                        <p className="text-emerald-600 font-medium text-center mt-2">🎯 Goal Reached!</p>
                    )}
                </div>
            );
        }
        return null;
    };

    const chartHeight = useMemo(() => isMobile ? 280 : isTablet ? 300 : 320, [isMobile, isTablet]);
    const legendHeight = useMemo(() => isMobile ? 36 : 24, [isMobile]);
    const animationDuration = useMemo(() => isMobile ? 0 : 800, [isMobile]);

    return (
        <div className="transition-all duration-300">
            <h2 className="text-xl font-bold text-slate-800 mb-4 text-center">Corpus Growth Over Time</h2>
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
                                <linearGradient id="colorCorpus" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
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
                            <ReferenceLine
                                y={goalCorpus}
                                stroke="#f59e0b"
                                strokeDasharray="5 5"
                                strokeWidth={2}
                                label={{
                                    value: `Goal: ${formatAxisTick(goalCorpus)}`,
                                    fill: '#f59e0b',
                                    fontSize: isMobile ? 10 : 12,
                                    position: 'right',
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="totalValue"
                                name="Total Value"
                                stroke="#10b981"
                                strokeWidth={isMobile ? 2 : 3}
                                dot={false}
                                hide={!visibility.totalValue}
                                fillOpacity={1}
                                fill="url(#colorCorpus)"
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
                        </ComposedChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex items-center justify-center h-full w-full bg-slate-100/50 rounded-lg transition-all duration-300">
                        <p className="text-slate-500 text-center px-4 text-sm sm:text-base">Your growth chart will appear here once you enter investment details.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CoastFireGrowthChart;
