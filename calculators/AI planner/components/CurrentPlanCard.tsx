import React from 'react';
import { formatToWords } from '../../../utils/formatters';
import { TrendUpIcon, WalletIcon, ChartIcon, CheckCircleIcon } from './icons';
import { formatSmartNumber } from '../utils/planMetrics';
import { PlanDisplayData, FinancialIndependenceInputs } from '../types';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

interface CurrentPlanCardProps {
    planData: PlanDisplayData;
    inputs: FinancialIndependenceInputs;
    message?: string;
}

export const CurrentPlanCard: React.FC<CurrentPlanCardProps> = ({
    planData,
    inputs,
    message
}) => {
    if (!planData) {
        return (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                <p className="text-amber-800 dark:text-amber-200 font-medium">
                    {message || 'Unable to calculate plan data.'}
                </p>
            </div>
        );
    }

    return (
        <div className="group relative bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-black/30 border border-slate-200/60 dark:border-slate-700/60 p-6 sm:p-8 flex flex-col h-full transition-all duration-300 hover:shadow-2xl hover:border-blue-200/60 dark:hover:border-blue-800/30">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                    <TrendUpIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Current Plan</h2>
            </div>

            <div className="flex-1 flex flex-col">
                {/* Hero Summary */}
                <div className="bg-gradient-to-br from-blue-50 to-slate-50 dark:from-blue-900/10 dark:to-slate-900/20 border border-blue-100 dark:border-blue-800/50 rounded-2xl p-6 mb-8 shadow-sm">
                    <p className="text-base sm:text-lg text-slate-700 dark:text-blue-100 leading-relaxed font-medium">
                        If you continue investing <span className="font-bold whitespace-nowrap">₹{inputs.monthlyInvestment.toLocaleString('en-IN')}</span> per month, you can become financially independent by{' '}
                        <span className="block mt-2 text-2xl sm:text-3xl font-extrabold text-blue-600 dark:text-blue-400">
                            Age {planData.fiAge}
                            <span className="text-sm sm:text-lg font-medium text-slate-500 dark:text-slate-400 ml-2">({planData.yearsToFI} years from now)</span>
                        </span>
                    </p>
                </div>

                {/* Lottie Animation Filler */}
                <div className="flex-1 flex items-center justify-center -mt-4 mb-4 sm:-mt-4 overflow-hidden">
                    <div className="w-full max-w-[280px]">
                        <DotLottieReact
                            src="https://lottie.host/00e578e3-64b1-424a-872c-46fb72938e94/sIFnrUv63S.lottie"
                            loop
                            autoplay
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
                                From age <span className="font-bold">{planData.fiAge}</span>, you can withdraw <span className="font-bold">₹{formatSmartNumber(planData.monthlyWithdrawal)}</span> per month (till age {planData.maxAge}), increasing by 10% every year!
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
        </div>
    );
};
