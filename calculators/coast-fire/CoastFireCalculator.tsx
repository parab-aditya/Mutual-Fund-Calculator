import React, { useState, useEffect, useCallback } from 'react';
import SliderInput from '../../components/SliderInput';
import CoastFireGrowthChart from './CoastFireGrowthChart';
import { useCoastFireCalculator } from './useCoastFireCalculator';
import { GOAL_CORPUS_OPTIONS } from './types';
import { formatIndianNumber, formatIndianCurrency } from '../../utils/formatters';

interface CoastFireCalculatorProps {
    isActive: boolean;
}

const CoastFireCalculator: React.FC<CoastFireCalculatorProps> = ({ isActive }) => {
    const [monthlyInvestment, setMonthlyInvestment] = useState<number>(25000);
    const [goalCorpus, setGoalCorpus] = useState<number>(10000000); // 1Cr default
    const [returnRate, setReturnRate] = useState<number>(12);
    const [stepUpPercentage, setStepUpPercentage] = useState<number>(0);

    const [isOptionalAdjustmentsOpen, setIsOptionalAdjustmentsOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

    // Input field state for formatted display
    const [inputValue, setInputValue] = useState(formatIndianNumber(monthlyInvestment));

    useEffect(() => {
        let resizeTimeout: ReturnType<typeof setTimeout>;

        const handleResize = () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                const mobile = window.innerWidth < 768;
                setIsMobile(mobile);
                if (!mobile) {
                    setIsOptionalAdjustmentsOpen(true);
                }
            }, 150);
        };

        handleResize();
        window.addEventListener('resize', handleResize, { passive: true });
        return () => {
            clearTimeout(resizeTimeout);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    const { results, growthData } = useCoastFireCalculator({
        monthlyInvestment,
        goalCorpus,
        returnRate,
        stepUpPercentage,
    });

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value.replace(/,/g, '');
        setInputValue(e.target.value);

        const numValue = Number(rawValue);
        if (!isNaN(numValue)) {
            // Limit to 10 Lakhs (1000000)
            const clampedValue = Math.min(Math.max(0, numValue), 1000000);
            setMonthlyInvestment(clampedValue);
        }
    }, []);

    const handleInputBlur = useCallback(() => {
        // Format the value on blur
        const clampedValue = Math.min(Math.max(1, monthlyInvestment), 1000000);
        setMonthlyInvestment(clampedValue);
        setInputValue(formatIndianNumber(clampedValue));
    }, [monthlyInvestment]);

    const handleGoalChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        setGoalCorpus(Number(e.target.value));
    }, []);

    // Format goal corpus for display
    const formatGoalDisplay = (value: number): string => {
        const option = GOAL_CORPUS_OPTIONS.find(opt => opt.value === value);
        return option ? option.label : formatIndianCurrency(value);
    };

    // Format years display
    const formatYearsDisplay = (): string => {
        if (!results.goalReached || results.yearsToGoal === 0) {
            return 'calculating...';
        }
        const years = results.yearsToGoal;
        const months = results.monthsToGoal % 12;

        if (months === 0) {
            return `${years} year${years !== 1 ? 's' : ''}`;
        }
        return `${years} year${years !== 1 ? 's' : ''} and ${months} month${months !== 1 ? 's' : ''}`;
    };

    return (
        <div className="px-2 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
                {/* Left Side - Input Form */}
                <div className="lg:col-span-2 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl p-4 sm:p-6 rounded-2xl shadow-md border border-slate-200/60 dark:border-slate-700/60">
                    <div className="space-y-6">
                        {/* Main Input Section */}
                        <div className="bg-slate-100/30 dark:bg-slate-900/30 border border-slate-200/60 dark:border-slate-700/60 rounded-xl p-3 sm:p-4">
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
                                Investment Goal
                            </h3>

                            {/* Sentence-style inputs */}
                            <div className="text-base sm:text-lg text-slate-700 dark:text-slate-300 leading-relaxed space-y-4">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span>I can invest</span>
                                    <div className="inline-flex items-center rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200/60 dark:border-emerald-700/60 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/40 transition-all duration-200 shadow-sm">
                                        <span className="pl-3 text-emerald-800 dark:text-emerald-300 font-medium">₹</span>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            pattern="[0-9,]*"
                                            value={inputValue}
                                            onChange={handleInputChange}
                                            onBlur={handleInputBlur}
                                            className="w-24 sm:w-28 p-2 text-right font-semibold text-slate-800 dark:text-slate-100 bg-transparent focus:outline-none"
                                            placeholder="25,000"
                                        />
                                    </div>
                                    <span>per month</span>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                    <span>and my goal is to build a corpus of</span>
                                    <select
                                        value={goalCorpus}
                                        onChange={handleGoalChange}
                                        className="inline-flex items-center px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200/60 dark:border-emerald-700/60 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/40 font-semibold text-slate-800 dark:text-slate-100 cursor-pointer transition-all duration-200 shadow-sm"
                                    >
                                        {GOAL_CORPUS_OPTIONS.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Optional Adjustments */}
                        <div>
                            <button
                                onClick={() => { if (isMobile) setIsOptionalAdjustmentsOpen(!isOptionalAdjustmentsOpen); }}
                                className="w-full flex justify-between items-center text-left lg:pointer-events-none"
                                aria-expanded={!isMobile || isOptionalAdjustmentsOpen}
                                aria-controls="optional-adjustments-content"
                            >
                                <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">
                                    Optional Adjustments
                                </h3>
                                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-slate-500 transition-transform duration-300 lg:hidden ${isOptionalAdjustmentsOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>

                            <div
                                id="optional-adjustments-content"
                                className={`grid transition-all duration-500 ease-in-out ${isMobile ? (isOptionalAdjustmentsOpen ? 'grid-rows-[1fr] opacity-100 mt-2' : 'grid-rows-[0fr] opacity-0') : 'grid-rows-[1fr] opacity-100 mt-2'}`}
                            >
                                <div className="overflow-hidden">
                                    <div className="space-y-6 pt-4 pb-2">
                                        <SliderInput
                                            label="Expected Return Rate (p.a.)"
                                            value={returnRate}
                                            onChange={setReturnRate}
                                            min={1}
                                            max={30}
                                            step={0.1}
                                            unit="%"
                                        />
                                        <SliderInput
                                            label="SIP Annual Step-up"
                                            value={stepUpPercentage}
                                            onChange={setStepUpPercentage}
                                            min={0}
                                            max={50}
                                            step={1}
                                            unit="%"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side - Results */}
                <div className="lg:col-span-3 flex flex-col gap-6 lg:gap-8">
                    {/* Years to Goal Display */}
                    <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl p-4 sm:p-6 rounded-2xl shadow-md border border-slate-200/60 dark:border-slate-700/60">
                        <div className="text-center">
                            {results.goalReached && results.yearsToGoal > 0 ? (
                                <>
                                    <p className="text-lg sm:text-xl text-slate-700 dark:text-slate-300 mb-2">
                                        It will take you
                                    </p>
                                    <p className="text-3xl sm:text-4xl font-bold text-emerald-600 mb-2">
                                        {formatYearsDisplay()}
                                    </p>
                                    <p className="text-lg sm:text-xl text-slate-700 dark:text-slate-300">
                                        to reach your goal of <span className="font-semibold text-slate-800 dark:text-slate-100">{formatIndianCurrency(goalCorpus)}</span>
                                    </p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-4">
                                        Total Investment: <span className="font-medium">{formatIndianCurrency(results.totalInvested)}</span>
                                    </p>
                                </>
                            ) : (
                                <p className="text-lg text-slate-500 dark:text-slate-400">
                                    Enter your investment details to see how long it will take to reach your goal.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Growth Chart */}
                    <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl p-4 sm:p-6 rounded-2xl shadow-md border border-slate-200/60 dark:border-slate-700/60">
                        <CoastFireGrowthChart
                            data={growthData}
                            goalCorpus={goalCorpus}
                            yearsToGoal={results.yearsToGoal}
                            isActive={isActive}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CoastFireCalculator;
