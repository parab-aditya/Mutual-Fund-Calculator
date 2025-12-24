import React, { useState, useEffect } from 'react';
import { numberToIndianWords, formatToWords } from '../../utils/formatters';
import { useFinancialIndependencePlanner, runOptimization } from './useFinancialIndependencePlanner';
import { FinancialIndependenceInputs, OptimizationResult, DifficultyLevel } from './types';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

interface FormData {
    age: string;
    monthlyExpenditure: string;
    monthlyInvestment: string;
    healthLifestyle: string;
}

// Icons
const RefreshIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M23 4v6h-6" />
        <path d="M1 20v-6h6" />
        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
);

const TrendUpIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
        <polyline points="16 7 22 7 22 13" />
    </svg>
);

const SparkleIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
    </svg>
);

const WalletIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
        <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
);

const ChartIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="20" x2="12" y2="10" />
        <line x1="18" y1="20" x2="18" y2="4" />
        <line x1="6" y1="20" x2="6" y2="16" />
    </svg>
);

const ArrowUpIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="19" x2="12" y2="5" />
        <polyline points="5 12 12 5 19 12" />
    </svg>
);

const CheckCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
);

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

const getProposedChangeText = (
    currentSip: number,
    newSip: number,
    stepUpPercent: number,
    sipIncreasePercent: number
): string => {
    const hasStepUp = stepUpPercent > 0;
    const hasSipIncrease = sipIncreasePercent > 0;

    if (hasStepUp && hasSipIncrease) {
        return `Increase your SIP from ₹${currentSip.toLocaleString('en-IN')} to ₹${newSip.toLocaleString('en-IN')} per month, and increase it by ${stepUpPercent}% every year.`;
    } else if (hasStepUp) {
        return `Keep investing ₹${currentSip.toLocaleString('en-IN')} per month but increase it by ${stepUpPercent}% every year.`;
    } else if (hasSipIncrease) {
        return `Increase your SIP from ₹${currentSip.toLocaleString('en-IN')} to ₹${newSip.toLocaleString('en-IN')} per month.`;
    }
    return 'Continue with your current investment plan.';
};

const PlanForMePage: React.FC = () => {
    const [formData, setFormData] = useState<FormData>({
        age: '',
        monthlyExpenditure: '',
        monthlyInvestment: '',
        healthLifestyle: 'generally_healthy',
    });

    const [fiInputs, setFiInputs] = useState<FinancialIndependenceInputs | null>(null);
    const [showResults, setShowResults] = useState(false);
    const fiResult = useFinancialIndependencePlanner(fiInputs);

    const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
    const [isOptimizing, setIsOptimizing] = useState(false);

    const handlePlanForMe = async () => {
        if (!isFormValid()) return;

        const inputs: FinancialIndependenceInputs = {
            currentAge: parseInt(formData.age),
            monthlyExpense: parseInt(formData.monthlyExpenditure),
            monthlyInvestment: parseInt(formData.monthlyInvestment),
            healthStatus: formData.healthLifestyle,
        };

        setFiInputs(inputs);
        setShowResults(true);
        setIsOptimizing(true);
    };

    useEffect(() => {
        const fetchOptimization = async () => {
            if (fiInputs && fiResult && isOptimizing) {
                try {
                    const result = await runOptimization(fiInputs, fiResult.earliestFinancialIndependenceAge);
                    setOptimizationResult(result);
                } catch (error) {
                    console.error('Optimization failed:', error);
                    setOptimizationResult({
                        baselineFiAge: fiResult.earliestFinancialIndependenceAge,
                        solutions: [],
                        recommendedSolution: null,
                        recommendation: null,
                        skipOptimization: false,
                        error: 'Failed to run optimization. Please try again.'
                    });
                } finally {
                    setIsOptimizing(false);
                }
            }
        };
        fetchOptimization();
    }, [fiInputs, fiResult, isOptimizing]);

    const handleReset = () => {
        setShowResults(false);
        setOptimizationResult(null);
        setIsOptimizing(false);
    };

    const handleInputChange = (field: keyof FormData, value: string) => {
        const numericValue = value.replace(/[^0-9]/g, '');

        if (field === 'age' && numericValue !== '') {
            const ageNum = parseInt(numericValue);
            if (ageNum > 99) return;
        }

        if (field === 'monthlyExpenditure' && numericValue !== '') {
            const expenditureNum = parseInt(numericValue);
            if (expenditureNum > 1000000) return;
        }

        if (field === 'monthlyInvestment' && numericValue !== '') {
            const investmentNum = parseInt(numericValue);
            if (investmentNum > 500000) return;
        }

        setFormData(prev => ({
            ...prev,
            [field]: numericValue
        }));
    };

    const formatCurrency = (value: string): string => {
        if (!value) return '';
        const num = parseInt(value);
        return num.toLocaleString('en-IN');
    };

    const isFieldValid = (field: keyof FormData): boolean => {
        return formData[field] !== '' && parseInt(formData[field]) > 0;
    };

    const isFormValid = (): boolean => {
        return isFieldValid('age') && isFieldValid('monthlyExpenditure') && isFieldValid('monthlyInvestment') && formData.healthLifestyle !== '';
    };

    const handleHealthLifestyleChange = (value: string) => {
        setFormData(prev => ({
            ...prev,
            healthLifestyle: value
        }));
    };

    const getCurrentPlanData = () => {
        if (!fiResult || !fiInputs) return null;

        const fiAge = fiResult.earliestFinancialIndependenceAge;
        if (fiAge === null) return null;

        const yearsToFI = fiAge - fiInputs.currentAge;
        const fiYearData = fiResult.yearlyBreakdown.find(row => row.year === fiAge);

        if (!fiYearData) return null;

        const inflationRate = 0.07;
        const todayValue = fiYearData.targetWithdrawal / Math.pow(1 + inflationRate, yearsToFI);
        const lifestyleImprovement = ((todayValue / fiInputs.monthlyExpense) - 1) * 100;

        return {
            fiAge,
            yearsToFI,
            finalCorpus: fiYearData.sipCorpus,
            monthlyWithdrawal: fiYearData.targetWithdrawal,
            todayValue: Math.round(todayValue),
            lifestyleImprovement: Math.round(lifestyleImprovement),
        };
    };

    const getAIPlanData = () => {
        if (!optimizationResult?.recommendedSolution || !fiInputs || !fiResult) return null;

        const rec = optimizationResult.recommendedSolution;
        const baselineAge = fiResult.earliestFinancialIndependenceAge ?? 60;
        const yearsSaved = baselineAge - rec.fiAge;

        const yearsToFI = rec.fiAge - fiInputs.currentAge;
        const sipRate = yearsToFI < 7 ? 0.12 : 0.14;

        let estimatedCorpus = 0;
        let currentSip = rec.newMonthlySip;
        for (let year = 0; year < yearsToFI; year++) {
            estimatedCorpus = (estimatedCorpus + currentSip * 12) * (1 + sipRate);
            if (rec.stepUpPercent > 0) {
                currentSip = currentSip * (1 + rec.stepUpPercent / 100);
            }
        }

        const inflationRate = 0.07;
        const inflatedExpense = fiInputs.monthlyExpense * Math.pow(1 + inflationRate, yearsToFI);
        const monthlyWithdrawal = Math.round(inflatedExpense * 1.25);
        const todayValue = monthlyWithdrawal / Math.pow(1 + inflationRate, yearsToFI);
        const lifestyleImprovement = ((todayValue / fiInputs.monthlyExpense) - 1) * 100;

        return {
            fiAge: rec.fiAge,
            yearsSaved,
            finalCorpus: Math.round(estimatedCorpus),
            monthlyWithdrawal,
            todayValue: Math.round(todayValue),
            lifestyleImprovement: Math.round(lifestyleImprovement),
            stepUpPercent: rec.stepUpPercent,
            sipIncreasePercent: rec.sipIncreasePercent,
            newMonthlySip: rec.newMonthlySip,
            difficulty: optimizationResult.recommendation?.difficulty || 'Moderate',
            proposedChange: getProposedChangeText(
                fiInputs.monthlyInvestment,
                rec.newMonthlySip,
                rec.stepUpPercent,
                rec.sipIncreasePercent
            ),
        };
    };

    const currentPlanData = getCurrentPlanData();
    const aiPlanData = getAIPlanData();

    return (
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 pb-8">
            <div className="flex items-center justify-center py-4">
                <div className="w-full max-w-6xl">
                    {/* Results View */}
                    {showResults && fiResult ? (
                        <div className="space-y-6 animate-fade-in">
                            {/* Refresh Button - Floating Top Right */}
                            <div className="flex justify-between items-center bg-white/50 dark:bg-slate-800/50 backdrop-blur-md rounded-2xl p-2 px-4 shadow-sm border border-slate-100 dark:border-slate-700">
                                <div className="flex gap-6 text-sm">
                                    <div className="flex flex-col">
                                        <span className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">Present Age</span>
                                        <span className="font-bold text-slate-800 dark:text-slate-200">{fiInputs?.currentAge} years</span>
                                    </div>
                                    <div className="w-px bg-slate-200 dark:bg-slate-700"></div>
                                    <div className="flex flex-col">
                                        <span className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">Expenses</span>
                                        <span className="font-bold text-slate-800 dark:text-slate-200">₹{fiInputs?.monthlyExpense.toLocaleString('en-IN')} /mo</span>
                                    </div>
                                    <div className="w-px bg-slate-200 dark:bg-slate-700"></div>
                                    <div className="flex flex-col">
                                        <span className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">Investment</span>
                                        <span className="font-bold text-slate-800 dark:text-slate-200">₹{fiInputs?.monthlyInvestment.toLocaleString('en-IN')} /mo</span>
                                    </div>
                                </div>

                                <button
                                    onClick={handleReset}
                                    className="p-2.5 rounded-full bg-white dark:bg-slate-800 shadow-sm text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 hover:scale-110 border border-slate-100 dark:border-slate-700"
                                    title="Start Over"
                                >
                                    <RefreshIcon className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                                {/* Left Container: Current Plan */}
                                <div className="group relative bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-black/30 border border-slate-200/60 dark:border-slate-700/60 p-6 sm:p-8 flex flex-col h-full transition-all duration-300 hover:shadow-2xl hover:border-blue-200/60 dark:hover:border-blue-800/30">
                                    {/* Header */}
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                                            <TrendUpIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Current Plan</h2>
                                    </div>

                                    {currentPlanData ? (
                                        <div className="flex-1 flex flex-col">
                                            {/* Hero Summary */}
                                            <div className="bg-gradient-to-br from-blue-50 to-slate-50 dark:from-blue-900/10 dark:to-slate-900/20 border border-blue-100 dark:border-blue-800/50 rounded-2xl p-6 mb-8 shadow-sm">
                                                <p className="text-lg text-slate-700 dark:text-blue-100 leading-relaxed font-medium">
                                                    If you continue investing <span className="font-bold whitespace-nowrap">₹{fiInputs?.monthlyInvestment.toLocaleString('en-IN')}</span> per month, you can become financially independent by{' '}
                                                    <span className="block mt-2 text-3xl font-extrabold text-blue-600 dark:text-blue-400">
                                                        Age {currentPlanData.fiAge}
                                                        <span className="text-lg font-medium text-slate-500 dark:text-slate-400 ml-2">({currentPlanData.yearsToFI} years from now)</span>
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
                                                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Final Corpus at Age {currentPlanData.fiAge}</p>
                                                        <p className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">₹{formatToWords(currentPlanData.finalCorpus)}</p>
                                                    </div>
                                                </div>

                                                {/* Passive Income */}
                                                <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/20 border border-slate-100 dark:border-slate-700/50">
                                                    <div className="mt-1 w-10 h-10 rounded-2xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center flex-shrink-0">
                                                        <ChartIcon className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Passive Income</p>
                                                        <p className="text-base font-medium text-slate-800 dark:text-slate-100 leading-relaxed">
                                                            From age <span className="font-bold">{currentPlanData.fiAge}</span>, you can withdraw <span className="font-bold">₹{(currentPlanData.monthlyWithdrawal / 100000).toFixed(1)}L</span> per month, increasing by 10% every year!
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Lifestyle Check */}
                                                <div className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300">
                                                    <CheckCircleIcon className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                                                    <span className="leading-relaxed">
                                                        <span className="font-bold text-slate-900 dark:text-white">₹{(currentPlanData.monthlyWithdrawal / 100000).toFixed(1)}L</span> at age {currentPlanData.fiAge} equals <span className="font-bold text-slate-900 dark:text-white">₹{Math.round(currentPlanData.todayValue / 1000)}k</span> in today's terms (inflation-adjusted). That is <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-bold text-xs">{currentPlanData.lifestyleImprovement}% better lifestyle</span> than your current expenses!
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                                            <p className="text-amber-800 dark:text-amber-200 font-medium">
                                                {fiResult.message}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Right Container: AI-Optimized Plan */}
                                <div className="group relative bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-3xl shadow-2xl shadow-emerald-500/10 dark:shadow-emerald-900/20 border-2 border-emerald-400/30 dark:border-emerald-500/30 p-6 sm:p-8 flex flex-col h-full transform transition-all duration-300 hover:scale-[1.01]">
                                    {/* Recommended Badge */}
                                    <div className="absolute -top-4 right-8 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-bold px-4 py-1.5 rounded-full shadow-lg shadow-emerald-500/30 flex items-center gap-1.5">
                                        <SparkleIcon className="w-4 h-4" />
                                        RECOMMENDED
                                    </div>

                                    {/* Header */}
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                                                <SparkleIcon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                                            </div>
                                            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">AI-Optimised</h2>
                                        </div>

                                        {aiPlanData && (
                                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide border ${difficultyConfig[aiPlanData.difficulty].bg} ${difficultyConfig[aiPlanData.difficulty].text} ${difficultyConfig[aiPlanData.difficulty].border}`}>
                                                <span>{difficultyConfig[aiPlanData.difficulty].icon}</span>
                                                {aiPlanData.difficulty}
                                            </div>
                                        )}
                                    </div>

                                    {isOptimizing ? (
                                        <div className="flex-1 flex flex-col items-center justify-center space-y-4 py-12">
                                            <div className="relative w-16 h-16">
                                                <div className="absolute inset-0 border-4 border-slate-100 dark:border-slate-700 rounded-full"></div>
                                                <div className="absolute inset-0 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                                                <SparkleIcon className="absolute inset-0 m-auto w-6 h-6 text-emerald-500 animate-pulse" />
                                            </div>
                                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 animate-pulse">Running AI Optimization...</p>
                                        </div>
                                    ) : aiPlanData ? (
                                        <div className="flex-1 flex flex-col">
                                            {/* Hero Summary */}
                                            <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-500/20 rounded-2xl p-6 mb-8 relative overflow-hidden">
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400/10 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none"></div>
                                                <p className="text-lg text-emerald-900 dark:text-emerald-100 leading-relaxed font-medium relative z-10">
                                                    By making a small change, you can reach financial independence by{' '}
                                                    <span className="block mt-2 text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                                                        Age {aiPlanData.fiAge}
                                                        {aiPlanData.yearsSaved > 0 && (
                                                            <span className="inline-flex items-center ml-3 px-3 py-1 bg-emerald-100 dark:bg-emerald-500/20 rounded-full text-sm font-bold text-emerald-700 dark:text-emerald-300">
                                                                🚀 {aiPlanData.yearsSaved} Years Earlier
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
                                                            {aiPlanData.proposedChange}
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
                                                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Final Corpus at Age {aiPlanData.fiAge}</p>
                                                        <p className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">₹{formatToWords(aiPlanData.finalCorpus)}</p>
                                                    </div>
                                                </div>

                                                {/* Passive Income */}
                                                <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/20 border border-slate-100 dark:border-slate-700/50">
                                                    <div className="mt-1 w-10 h-10 rounded-2xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center flex-shrink-0">
                                                        <ChartIcon className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Passive Income</p>
                                                        <p className="text-base font-medium text-slate-800 dark:text-slate-100 leading-relaxed">
                                                            From age <span className="font-bold">{aiPlanData.fiAge}</span>, you can withdraw <span className="font-bold">₹{(aiPlanData.monthlyWithdrawal / 100000).toFixed(1)}L</span> per month, increasing by 10% every year!
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Lifestyle Check */}
                                                <div className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300">
                                                    <CheckCircleIcon className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                                                    <span className="leading-relaxed">
                                                        <span className="font-bold text-slate-900 dark:text-white">₹{(aiPlanData.monthlyWithdrawal / 100000).toFixed(1)}L</span> at age {aiPlanData.fiAge} equals <span className="font-bold text-slate-900 dark:text-white">₹{Math.round(aiPlanData.todayValue / 1000)}k</span> in today's terms (inflation-adjusted). That is <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-bold text-xs">{aiPlanData.lifestyleImprovement}% better lifestyle</span> than your current expenses!
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ) : optimizationResult?.skipOptimization ? (
                                        <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100">
                                            <SparkleIcon className="w-12 h-12 text-emerald-500 mb-4" />
                                            <h3 className="text-xl font-bold text-emerald-900 dark:text-emerald-100 mb-2">You're on track!</h3>
                                            <p className="text-emerald-700 dark:text-emerald-300">
                                                {optimizationResult.skipReason}
                                            </p>
                                        </div>
                                    ) : optimizationResult?.error ? (
                                        <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100">
                                            <span className="text-3xl mb-4">⚠️</span>
                                            <p className="text-red-800 dark:text-red-200 font-medium">
                                                {optimizationResult.error}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-700 rounded-xl p-6 text-center">
                                            <p className="text-slate-500 dark:text-slate-400">
                                                Analysis currently unavailable.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Form View */
                        <div className="max-w-xl mx-auto py-12">
                            {/* Main Card */}
                            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200/60 dark:border-slate-700/60 p-8 transform transition-all hover:shadow-2xl hover:scale-[1.005]">
                                {/* Heading */}
                                <h1 className="text-2xl font-bold text-center text-slate-800 dark:text-slate-100 mb-8 leading-tight">
                                    Financial Independence Plan
                                </h1>

                                {/* Form Fields */}
                                <div className="space-y-6">
                                    {/* Age Input */}
                                    <div className="bg-slate-50 dark:bg-slate-900/30 rounded-2xl p-4 border border-slate-200/60 dark:border-slate-700/60 transition-colors focus-within:border-blue-400 dark:focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10">
                                        <div className="flex items-center justify-between gap-4">
                                            <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                                                My current age
                                            </label>
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                value={formData.age}
                                                onChange={(e) => handleInputChange('age', e.target.value)}
                                                placeholder="30"
                                                maxLength={2}
                                                className="w-20 text-xl font-bold bg-white dark:bg-slate-800 rounded-xl px-4 py-2 border border-slate-200 dark:border-slate-600 text-center text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                                            />
                                        </div>
                                    </div>

                                    {/* Monthly Expenditure Input */}
                                    <div className="bg-slate-50 dark:bg-slate-900/30 rounded-2xl p-4 border border-slate-200/60 dark:border-slate-700/60 transition-colors focus-within:border-blue-400 dark:focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10">
                                        <div className="flex items-center justify-between gap-4 mb-2">
                                            <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                                                Monthly expenditure
                                            </label>
                                            <div className="flex items-center bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600 px-3 py-2 w-40">
                                                <span className="text-slate-400 font-medium mr-2">₹</span>
                                                <input
                                                    type="text"
                                                    inputMode="numeric"
                                                    value={formatCurrency(formData.monthlyExpenditure)}
                                                    onChange={(e) => handleInputChange('monthlyExpenditure', e.target.value)}
                                                    placeholder="1,00,000"
                                                    className="w-full text-lg font-bold bg-transparent text-right text-slate-900 dark:text-white focus:outline-none"
                                                />
                                            </div>
                                        </div>
                                        {formData.monthlyExpenditure && parseInt(formData.monthlyExpenditure) > 0 && (
                                            <div className="text-right text-xs font-medium text-slate-500 dark:text-slate-400">
                                                {numberToIndianWords(parseInt(formData.monthlyExpenditure))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Monthly Investment Input */}
                                    <div className="bg-slate-50 dark:bg-slate-900/30 rounded-2xl p-4 border border-slate-200/60 dark:border-slate-700/60 transition-colors focus-within:border-blue-400 dark:focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10">
                                        <div className="flex items-center justify-between gap-4 mb-2">
                                            <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                                                Monthly SIP amount
                                            </label>
                                            <div className="flex items-center bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600 px-3 py-2 w-40">
                                                <span className="text-slate-400 font-medium mr-2">₹</span>
                                                <input
                                                    type="text"
                                                    inputMode="numeric"
                                                    value={formatCurrency(formData.monthlyInvestment)}
                                                    onChange={(e) => handleInputChange('monthlyInvestment', e.target.value)}
                                                    placeholder="50,000"
                                                    className="w-full text-lg font-bold bg-transparent text-right text-slate-900 dark:text-white focus:outline-none"
                                                />
                                            </div>
                                        </div>
                                        {formData.monthlyInvestment && parseInt(formData.monthlyInvestment) > 0 && (
                                            <div className="text-right text-xs font-medium text-slate-500 dark:text-slate-400">
                                                {numberToIndianWords(parseInt(formData.monthlyInvestment))} /month
                                            </div>
                                        )}
                                    </div>

                                    {/* Health & Lifestyle Question */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-3 ml-1">
                                            Health & Lifestyle Profile
                                        </label>
                                        <div className="grid grid-cols-3 gap-3">
                                            {[
                                                { value: 'needs_improvement', label: 'Needs Improvement', emoji: '❤️‍🩹' },
                                                { value: 'generally_healthy', label: 'Generally Healthy', emoji: '👍' },
                                                { value: 'very_healthy', label: 'Very Healthy', emoji: '💪' }
                                            ].map((option) => (
                                                <label
                                                    key={option.value}
                                                    className={`cursor-pointer group relative flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all duration-200 ${formData.healthLifestyle === option.value
                                                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 dark:border-blue-400 shadow-md'
                                                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-800'
                                                        }`}
                                                >
                                                    <input
                                                        type="radio"
                                                        name="healthLifestyle"
                                                        value={option.value}
                                                        checked={formData.healthLifestyle === option.value}
                                                        onChange={(e) => handleHealthLifestyleChange(e.target.value)}
                                                        className="sr-only"
                                                    />
                                                    <span className="text-xl mb-1 filter grayscale group-hover:grayscale-0 transition-all duration-300 transform group-hover:scale-110">
                                                        {option.emoji}
                                                    </span>
                                                    <span className={`text-[10px] sm:text-xs font-bold text-center leading-tight ${formData.healthLifestyle === option.value
                                                        ? 'text-blue-700 dark:text-blue-300'
                                                        : 'text-slate-500 dark:text-slate-400'
                                                        }`}>
                                                        {option.label}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="button"
                                    disabled={!isFormValid()}
                                    onClick={handlePlanForMe}
                                    className={`mt-8 w-full py-4 rounded-2xl text-lg font-bold shadow-lg transition-all duration-300 transform hover:-translate-y-1 ${isFormValid()
                                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-blue-500/25 dark:hover:shadow-blue-900/40'
                                        : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                                        }`}
                                >
                                    Plan For Me
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
};

export default PlanForMePage;