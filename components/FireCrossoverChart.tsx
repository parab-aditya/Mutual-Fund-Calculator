import React, { useMemo, useState, useEffect } from 'react';
import {
    ComposedChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts';
import { SipGrowthData } from '../calculators/sip/types';
import { formatIndianCurrency, formatAxisTick } from '../utils/formatters';

interface FireCrossoverChartProps {
    data: SipGrowthData[];
    isActive: boolean;
    returnRate: number;
    hideContainer?: boolean;
    hideTitle?: boolean;
}

const FireCrossoverChart: React.FC<FireCrossoverChartProps> = ({
    data,
    isActive,
    returnRate,
    hideContainer = false,
    hideTitle = false
}) => {
    const [visibility, setVisibility] = useState({
        annualSipAmount: true,
        annualReturns: true,
    });
    const [stopInvesting, setStopInvesting] = useState(false);
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

    const showChart = isActive && data && data.length > 0;

    const handleLegendClick = (data: any) => {
        const { dataKey } = data;
        setVisibility(prev => ({ ...prev, [dataKey]: !prev[dataKey as keyof typeof visibility] }));
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
        const [hidden, setHidden] = useState(false);

        useEffect(() => {
            if (hidden) setHidden(false);
        }, [label]);

        if (active && payload && payload.length && !hidden) {
            const d = payload[0].payload;
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
                        <span className="text-slate-500 mr-4">Portfolio Size:</span>
                        <span className="font-semibold text-violet-600">{formatIndianCurrency(d.totalValue)}</span>
                    </p>
                    <div className="border-t border-slate-200/75 my-1"></div>
                    <p className="flex justify-between">
                        <span className="text-slate-500 mr-4">Annual SIP:</span>
                        <span className="font-semibold text-blue-600">{formatIndianCurrency(d.annualSipAmount)}</span>
                    </p>
                    <div className="border-t border-slate-200/75 my-1"></div>
                    <p className="flex justify-between">
                        <span className="text-slate-500 mr-4">Annual Returns:</span>
                        <span className="font-semibold text-emerald-600">{formatIndianCurrency(d.annualReturns)}</span>
                    </p>
                </div>
            );
        }
        return null;
    };

    const crossoverYear = useMemo(() => {
        if (!data || data.length === 0) return null;
        const crossoverPoint = data.find(d => d.annualReturns > d.annualSipAmount);
        return crossoverPoint ? crossoverPoint.year : null;
    }, [data]);

    const projectionData = useMemo(() => {
        if (!stopInvesting || !crossoverYear || !data.length) return data;

        // Clone data up to crossover year
        const crossoverIndex = data.findIndex(d => d.year === crossoverYear);
        if (crossoverIndex === -1) return data;

        const newData = data.slice(0, crossoverIndex + 1).map(d => ({ ...d }));
        let lastData = newData[newData.length - 1];
        let currentTotalValue = lastData.totalValue;

        // Project until year 40
        for (let year = lastData.year + 1; year <= 40; year++) {
            // No new investment, just returns on existing corpus
            const estimatedReturns = currentTotalValue * (returnRate / 100);
            const newTotalValue = currentTotalValue + estimatedReturns;

            newData.push({
                year,
                investedAmount: lastData.investedAmount, // Stays constant
                estimatedReturns: newTotalValue - lastData.investedAmount,
                totalValue: newTotalValue,
                sipValue: 0, // Not tracking separate components for projection
                lumpsumValue: 0,
                inflationAdjustedTotalValue: 0, // Not calculating for simple projection
                annualSipAmount: 0, // Stopped investing
                annualReturns: estimatedReturns
            });

            currentTotalValue = newTotalValue;
        }

        return newData;
    }, [data, stopInvesting, crossoverYear, returnRate]);

    const chartHeight = useMemo(() => isMobile ? 280 : isTablet ? 300 : 320, [isMobile, isTablet]);
    const legendHeight = useMemo(() => isMobile ? 36 : 24, [isMobile]);
    const animationDuration = useMemo(() => isMobile ? 0 : 800, [isMobile]);

    const containerClasses = hideContainer
        ? "transition-all duration-300"
        : "bg-white/60 backdrop-blur-xl py-4 sm:p-6 rounded-2xl shadow-md border border-slate-200/60 transition-all duration-300";

    return (
        <div className={containerClasses}>
            {!hideTitle && <h2 className="text-xl font-bold text-slate-800 mb-6 px-4 sm:px-0 text-center lg:text-left">The FIRE crossover</h2>}

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Left side text content */}
                <div className="lg:col-span-2 flex flex-col justify-start space-y-6 px-4 sm:px-0 order-2 lg:order-1">
                    {crossoverYear ? (
                        <>
                            <div className="space-y-2">
                                <p className="text-slate-600 text-lg leading-relaxed">
                                    By year <span className="font-bold text-slate-900 bg-emerald-100 px-2 py-0.5 rounded">{crossoverYear}</span>, your annual returns surpass your SIP amount. Here you can see the power of compounding.
                                </p>
                            </div>

                            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                                <p className="text-slate-700 italic font-medium">
                                    This is when your money starts working for you, instead of you working for it.
                                </p>
                            </div>

                            <div className="pt-4 border-t border-slate-200/60">
                                <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
                                    <span className="text-sm font-medium text-slate-700">What if I stop investing after year {crossoverYear}?</span>
                                    <button
                                        onClick={() => setStopInvesting(!stopInvesting)}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${stopInvesting ? 'bg-indigo-600' : 'bg-slate-200'}`}
                                    >
                                        <span
                                            className={`${stopInvesting ? 'translate-x-6' : 'translate-x-1'
                                                } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                                        />
                                    </button>
                                </div>
                                {stopInvesting && (
                                    <p className="text-xs text-slate-500 mt-2 px-1">
                                        Showing projection up to 40 years assuming SIP stops after year {crossoverYear}.
                                    </p>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-3 p-6 bg-slate-50 rounded-xl border border-slate-100">
                            <p className="text-slate-500 font-medium">Keep investing to reach the crossover point!</p>
                            <p className="text-sm text-slate-400">Increase your monthly investment or time period to see when your returns exceed your contributions.</p>
                        </div>
                    )}
                </div>

                {/* Right side chart */}
                <div className="lg:col-span-3 order-1 lg:order-2" style={{ width: '100%', height: chartHeight + legendHeight }}>
                    {showChart ? (
                        <ResponsiveContainer>
                            <ComposedChart
                                data={projectionData}
                                margin={{
                                    top: 5,
                                    right: isMobile ? 10 : 20,
                                    left: isMobile ? 0 : 10,
                                    bottom: isMobile ? 20 : 15,
                                }}
                            >
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
                                    scale="sqrt"
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

                                <Line
                                    type="monotone"
                                    dataKey="annualSipAmount"
                                    name="Annual SIP Amount"
                                    stroke="#3b82f6"
                                    strokeWidth={isMobile ? 1.5 : 2}
                                    dot={false}
                                    hide={!visibility.annualSipAmount}
                                    animationDuration={animationDuration}
                                    isAnimationActive={!isMobile}
                                />

                                <Line
                                    type="monotone"
                                    dataKey="annualReturns"
                                    name="Annual Returns"
                                    stroke="#10b981"
                                    strokeWidth={isMobile ? 1.5 : 2}
                                    dot={false}
                                    hide={!visibility.annualReturns}
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
        </div>
    );
};

export default FireCrossoverChart;
