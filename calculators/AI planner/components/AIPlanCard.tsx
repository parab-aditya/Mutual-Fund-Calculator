import React from 'react';
import { formatToWords } from '../../../utils/formatters';
import { SparkleIcon, WalletIcon, ChartIcon, ArrowUpIcon, CheckCircleIcon } from './icons';
import { formatSmartNumber } from '../utils/planMetrics';
import { DifficultyLevel, OptimizationResult } from '../types';
import { SWP_STEP_UP_PERCENTAGE } from '../constants';

// Difficulty pill config
const difficultyConfig: Record<DifficultyLevel, { bg: string; text: string; icon: string; border: string }> = {
    'Easy': {
        bg: 'bg-emerald-50 dark:bg-emerald-900/20',
        text: 'text-emerald-700 dark:text-emerald-300',
        icon: '🟢',
        border: 'border-emerald-200 dark:border-emerald-800'
    },
    'Moderate': {
        bg: 'bg-amber-50 dark:bg-amber-900/20',
        text: 'text-amber-700 dark:text-amber-300',
        icon: '🟡',
        border: 'border-amber-200 dark:border-amber-800'
    },
    'Aggressive': {
        bg: 'bg-red-50 dark:bg-red-900/20',
        text: 'text-red-700 dark:text-red-300',
        icon: '🔴',
        border: 'border-red-200 dark:border-red-800'
    },
};

interface AIPlanDisplayData {
    fiAge: number;
    yearsSaved: number;
    finalCorpus: number;
    monthlyWithdrawal: number;
    todayValue: number;
    lifestyleImprovement: number;
    stepUpPercent: number;
    sipIncreasePercent: number;
    newMonthlySip: number;
    difficulty: DifficultyLevel;
    proposedChange: string;
    maxAge: number;
}

interface AIPlanCardProps {
    isOptimizing: boolean;
    planData: AIPlanDisplayData | null;
    optimizationResult: OptimizationResult | null;
}

export const AIPlanCard: React.FC<AIPlanCardProps> = ({
    isOptimizing,
    planData,
    optimizationResult
}) => {
    // Loading state
    if (isOptimizing) {
        return (
            <CardWrapper>
                <CardHeader difficulty={null} />
                <div className="flex-1 flex flex-col items-center justify-center space-y-4 py-12">
                    <div className="relative w-16 h-16">
                        <div className="absolute inset-0 border-4 border-slate-100 dark:border-slate-700 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                        <SparkleIcon className="absolute inset-0 m-auto w-6 h-6 text-emerald-500 animate-pulse" />
                    </div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 animate-pulse">Running AI Optimization...</p>
                </div>
            </CardWrapper>
        );
    }

    // Success state with AI plan
    if (planData) {
        return (
            <CardWrapper>
                <CardHeader difficulty={planData.difficulty} />
                <div className="flex-1 flex flex-col">
                    {/* Hero Summary */}
                    <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-500/20 rounded-2xl p-6 mb-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400/10 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none"></div>
                        <p className="text-base sm:text-lg text-emerald-900 dark:text-emerald-100 leading-relaxed font-medium relative z-10">
                            By making a small change, you can reach financial independence by{' '}
                            <span className="block mt-2 text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                                Age {planData.fiAge}
                                {planData.yearsSaved > 0 && (
                                    <span className="inline-flex items-center ml-3 px-3 py-1 bg-emerald-100 dark:bg-emerald-500/20 rounded-full text-xs sm:text-sm font-bold text-emerald-700 dark:text-emerald-300">
                                        🚀 {planData.yearsSaved} Years Earlier
                                    </span>
                                )}
                            </span>
                        </p>
                    </div>

                    {/* Proposed Change - Ticket/Coupon Style */}
                    <div className="mb-8 relative">
                        <div className="absolute inset-0 bg-white dark:bg-slate-800 rounded-xl border-2 border-dashed border-emerald-200 dark:border-emerald-700/50"></div>
                        <div className="relative p-5 flex items-start gap-4">
                            <div className="mt-1 w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center flex-shrink-0 text-emerald-600">
                                <ArrowUpIcon className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block mb-1">Proposed Change</span>
                                <p className="text-base font-semibold text-slate-800 dark:text-slate-100 leading-snug">
                                    {planData.proposedChange}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 gap-6 mt-auto">
                        {/* Final Corpus */}
                        <div className="flex items-start gap-4">
                            <div className="mt-1 w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 shadow-sm border border-emerald-100 dark:border-emerald-800 flex items-center justify-center flex-shrink-0">
                                <WalletIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Final Corpus at Age {planData.fiAge}</p>
                                <p className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">₹{formatToWords(planData.finalCorpus)}</p>
                            </div>
                        </div>

                        {/* Passive Income */}
                        <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/20 border border-slate-100 dark:border-slate-700/50">
                            <div className="mt-0.5 w-10 h-10 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-center flex-shrink-0">
                                <ChartIcon className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Passive Income</p>
                                <p className="text-sm sm:text-[15px] font-medium text-slate-800 dark:text-slate-100 leading-relaxed">
                                    From age <span className="font-bold">{planData.fiAge}</span>, you can withdraw <span className="font-bold">₹{formatSmartNumber(planData.monthlyWithdrawal)}</span> per month (till age {planData.maxAge}), increasing by {SWP_STEP_UP_PERCENTAGE}% every year!
                                </p>
                            </div>
                        </div>

                        {/* Lifestyle Check */}
                        <div className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300">
                            <CheckCircleIcon className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                            <span className="leading-relaxed">
                                <span className="font-bold text-slate-900 dark:text-white">₹{formatSmartNumber(planData.monthlyWithdrawal)}</span> at age {planData.fiAge} equals <span className="font-bold text-slate-900 dark:text-white">₹{formatSmartNumber(planData.todayValue)}</span> in today's terms (inflation-adjusted). That is <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-bold text-xs">{planData.lifestyleImprovement}% better lifestyle</span> than your current expenses!
                            </span>
                        </div>
                    </div>
                </div>
            </CardWrapper>
        );
    }

    // Skip optimization state
    if (optimizationResult?.skipOptimization) {
        return (
            <CardWrapper>
                <CardHeader difficulty={null} />
                <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100">
                    <SparkleIcon className="w-12 h-12 text-emerald-500 mb-4" />
                    <h3 className="text-xl font-bold text-emerald-900 dark:text-emerald-100 mb-2">You're on track!</h3>
                    <p className="text-emerald-700 dark:text-emerald-300">
                        {optimizationResult.skipReason}
                    </p>
                </div>
            </CardWrapper>
        );
    }

    // Error state
    if (optimizationResult?.error) {
        return (
            <CardWrapper>
                <CardHeader difficulty={null} />
                <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100">
                    <span className="text-3xl mb-4">⚠️</span>
                    <p className="text-red-800 dark:text-red-200 font-medium">
                        {optimizationResult.error}
                    </p>
                </div>
            </CardWrapper>
        );
    }

    // Fallback unavailable state
    return (
        <CardWrapper>
            <CardHeader difficulty={null} />
            <div className="bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-700 rounded-xl p-6 text-center">
                <p className="text-slate-500 dark:text-slate-400">
                    Analysis currently unavailable.
                </p>
            </div>
        </CardWrapper>
    );
};

// Card wrapper component
const CardWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="group relative bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-3xl shadow-2xl shadow-emerald-500/10 dark:shadow-emerald-900/20 border-2 border-emerald-400/30 dark:border-emerald-500/30 p-6 sm:p-8 flex flex-col h-full transform transition-all duration-300 hover:scale-[1.01]">
        {/* Recommended Badge */}
        <div className="absolute -top-4 right-8 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-bold px-4 py-1.5 rounded-full shadow-lg shadow-emerald-500/30 flex items-center gap-1.5">
            <SparkleIcon className="w-4 h-4" />
            RECOMMENDED
        </div>
        {children}
    </div>
);

// Card header component
const CardHeader: React.FC<{ difficulty: DifficultyLevel | null }> = ({ difficulty }) => (
    <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                <SparkleIcon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">AI-Optimised</h2>
        </div>
        {difficulty && (
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide border ${difficultyConfig[difficulty].bg} ${difficultyConfig[difficulty].text} ${difficultyConfig[difficulty].border}`}>
                <span>{difficultyConfig[difficulty].icon}</span>
                {difficulty}
            </div>
        )}
    </div>
);
