import React, { memo } from 'react';
import { formatToWords } from '../../../utils/formatters';
import { TrendUpIcon, WalletIcon, ChartIcon, CheckCircleIcon } from './icons';
import { formatSmartNumber } from '../utils/planMetrics';
import { PlanDisplayData, FinancialIndependenceInputs, MinimumInvestmentData } from '../types';
import { SWP_STEP_UP_PERCENTAGE } from '../constants';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { resolveAssetPath } from '../../../utils/basePath';

interface CurrentPlanCardProps {
    planData: PlanDisplayData | null;
    inputs: FinancialIndependenceInputs;
    minimumInvestmentData?: MinimumInvestmentData | null;
}

export const CurrentPlanCard = memo<CurrentPlanCardProps>(function CurrentPlanCard({
    planData,
    inputs,
    minimumInvestmentData
}) {

    if (!planData) {
        return (
            <div className="group relative bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-black/30 border border-slate-200/60 dark:border-slate-700/60 p-5 sm:p-6 flex flex-col h-full transition-all duration-300">
                {/* Header */}
                <div className="flex items-center gap-3 mb-5">
                    <div className="p-2.5 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
                        <TrendUpIcon className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Current Plan</h2>
                </div>

                <div className="flex-1 flex flex-col">
                    {/* Status Message */}
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/10 border border-amber-200/60 dark:border-amber-700/40 rounded-2xl p-5 mb-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none"></div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-2xl">⏳</span>
                                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest">Needs Optimization</span>
                            </div>
                            <p className="text-base sm:text-lg font-semibold text-amber-900 dark:text-amber-100 leading-relaxed">
                                Your current investment of <span className="font-bold">₹{inputs.monthlyInvestment.toLocaleString('en-IN')}/month</span> won't achieve financial independence before age 60.
                            </p>
                        </div>
                    </div>

                    {/* Lottie Animation */}
                    <div className="flex-1 flex items-center justify-center -mt-2 mb-4 overflow-hidden">
                        <div className="w-full max-w-[200px] opacity-60">
                            <DotLottieReact
                                src={resolveAssetPath('/animations/financial-planning.lottie')}
                                loop
                                autoplay
                                speed={0.6}
                                renderConfig={{ autoResize: true }}
                            />
                        </div>
                    </div>

                    {/* Actionable Insight */}
                    {minimumInvestmentData && minimumInvestmentData.investmentGap > 0 && (
                        <div className="mt-auto space-y-4">
                            {/* Minimum Investment Card */}
                            <div className="relative p-5 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700/30 dark:to-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-600/50">
                                <div className="flex items-start gap-4">
                                    <div className="mt-0.5 w-10 h-10 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-600 flex items-center justify-center flex-shrink-0">
                                        <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Minimum Investment for FI by {minimumInvestmentData.targetFIAge}</p>
                                        <p className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">
                                            ₹{minimumInvestmentData.minimumInvestment.toLocaleString('en-IN')}<span className="text-base font-semibold text-slate-500 dark:text-slate-400"> / month</span>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Gap Indicator */}
                            <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800/40">
                                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-800/50 flex items-center justify-center flex-shrink-0">
                                    <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M12 19V5M5 12l7-7 7 7" />
                                    </svg>
                                </div>
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-200 leading-relaxed">
                                    Increase your investment by <span className="font-bold text-blue-600 dark:text-blue-400">₹{minimumInvestmentData.investmentGap.toLocaleString('en-IN')} /month</span> to reach FI by age {minimumInvestmentData.targetFIAge}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Fallback message if calculation fails */}
                    {(!minimumInvestmentData || minimumInvestmentData.investmentGap <= 0) && (
                        <div className="mt-auto p-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-slate-200 dark:border-slate-600/50">
                            <p className="text-sm text-slate-600 dark:text-slate-300 text-center">
                                Consider increasing your monthly investment or check the AI-Optimised plan for actionable recommendations.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="group relative bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-black/30 border border-slate-200/60 dark:border-slate-700/60 p-5 sm:p-6 flex flex-col h-full transition-all duration-300 hover:shadow-2xl hover:border-blue-200/60 dark:hover:border-blue-800/30">
            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
                <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                    <TrendUpIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Current Plan</h2>
            </div>

            <div className="flex-1 flex flex-col">
                {/* Hero Summary */}
                <div className="bg-gradient-to-br from-blue-50 to-slate-50 dark:from-blue-900/10 dark:to-slate-900/20 border border-blue-100 dark:border-blue-800/50 rounded-2xl p-5 mb-6 shadow-sm">
                    <p className="text-sm sm:text-base text-slate-700 dark:text-blue-100 leading-relaxed font-medium">
                        If you continue investing <span className="font-bold whitespace-nowrap">₹{inputs.monthlyInvestment.toLocaleString('en-IN')}</span> per month, you can become financially independent by{' '}
                        <span className="block mt-1.5 text-xl sm:text-2xl font-extrabold text-blue-600 dark:text-blue-400">
                            Age {planData.fiAge}
                            <span className="text-sm sm:text-lg font-medium text-slate-500 dark:text-slate-400 ml-2">({planData.yearsToFI} years from now)</span>
                        </span>
                    </p>
                </div>

                {/* Lottie Animation Filler */}
                <div className="flex-1 flex items-center justify-center -mt-2 mb-3 sm:-mt-2 overflow-hidden">
                    <div className="w-full max-w-[240px]">
                        <DotLottieReact
                            src={resolveAssetPath('/animations/financial-planning.lottie')}
                            loop
                            autoplay
                            speed={0.8}
                            renderConfig={{ autoResize: true }}
                        />
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 gap-6 mt-auto">
                    {/* Final Corpus */}
                    <div className="flex items-start gap-4">
                        <div className="mt-1 w-10 h-10 rounded-2xl bg-white dark:bg-slate-700/50 shadow-sm border border-slate-100 dark:border-slate-600 flex items-center justify-center flex-shrink-0">
                            <WalletIcon className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Final Corpus at Age {planData.fiAge}</p>
                            <p className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">₹{formatToWords(planData.finalCorpus)}</p>
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
                            <span className="font-bold text-slate-900 dark:text-white">₹{formatSmartNumber(planData.monthlyWithdrawal)}</span> at age {planData.fiAge} equals <span className="font-bold text-slate-900 dark:text-white">₹{formatSmartNumber(planData.todayValue)}</span> in today's terms
                            <span className="relative inline-flex items-center ml-0.5 group/tooltip cursor-pointer align-middle">
                                <svg className="w-4 h-4 text-slate-400 hover:text-slate-500 dark:text-slate-500 dark:hover:text-slate-400 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" />
                                    <path d="M12 16v-4" />
                                    <path d="M12 8h.01" />
                                </svg>
                                <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 px-3 py-2 text-[13px] font-normal text-white bg-[#3c4043] dark:bg-[#5f6368] rounded shadow-[0_1px_3px_0_rgba(60,64,67,0.3),0_4px_8px_3px_rgba(60,64,67,0.15)] opacity-0 scale-95 group-hover/tooltip:opacity-100 group-hover/tooltip:scale-100 transition-all duration-150 ease-out whitespace-nowrap z-50">
                                    Adjusted for inflation & 12.5% LTCG tax
                                </span>
                            </span>. That is <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-bold text-xs">{planData.lifestyleImprovement}% better lifestyle</span> than your current expenses!
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
});
