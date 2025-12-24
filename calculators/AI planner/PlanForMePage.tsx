import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useFinancialIndependencePlanner, runOptimization } from './useFinancialIndependencePlanner';
import { FinancialIndependenceInputs, OptimizationResult, HealthStatus, PlanDisplayData } from './types';
import { SIP_SHORT_TERM_THRESHOLD, SIP_RETURN_RATE_LONG_TERM, INFLATION_RATE, LIFESTYLE_BUFFER } from './constants';
import { calculateSipCorpus } from '../sip/useSipCalculator';

// Components
import { RefreshIcon, CurrentPlanCard, AIPlanCard, FinancialPlannerForm, FormData } from './components';
import { calculatePlanMetrics, getProposedChangeText } from './utils/planMetrics';

const PlanForMePage: React.FC = () => {
    const [formData, setFormData] = useState<FormData>({
        age: '',
        monthlyExpenditure: '',
        monthlyInvestment: '',
        healthLifestyle: 'generally_healthy',
    });

    const [showResults, setShowResults] = useState(false);
    const [shouldOptimize, setShouldOptimize] = useState(false);
    const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);

    // Validation helper
    const isFieldValid = useCallback((field: keyof FormData): boolean => {
        return formData[field] !== '' && parseInt(formData[field]) > 0;
    }, [formData]);

    const isFormValid = useMemo(() => {
        return isFieldValid('age') &&
            isFieldValid('monthlyExpenditure') &&
            isFieldValid('monthlyInvestment') &&
            formData.healthLifestyle !== '';
    }, [isFieldValid, formData.healthLifestyle]);

    // Derive fiInputs from formData using useMemo (eliminates duplicate state)
    const fiInputs = useMemo<FinancialIndependenceInputs | null>(() => {
        if (!isFormValid || !showResults) return null;
        return {
            currentAge: parseInt(formData.age),
            monthlyExpense: parseInt(formData.monthlyExpenditure),
            monthlyInvestment: parseInt(formData.monthlyInvestment),
            healthStatus: formData.healthLifestyle as HealthStatus,
        };
    }, [formData, isFormValid, showResults]);

    // Use the financial independence planner hook
    const fiResult = useFinancialIndependencePlanner(fiInputs);

    // Optimization effect with proper cleanup and trigger pattern
    useEffect(() => {
        if (!shouldOptimize || !fiInputs || !fiResult) return;

        let cancelled = false;

        const fetchOptimization = async () => {
            try {
                const result = await runOptimization(fiInputs, fiResult.earliestFinancialIndependenceAge);
                if (!cancelled) {
                    setOptimizationResult(result);
                }
            } catch (error) {
                console.error('Optimization failed:', error);
                if (!cancelled) {
                    setOptimizationResult({
                        baselineFiAge: fiResult.earliestFinancialIndependenceAge,
                        solutions: [],
                        recommendedSolution: null,
                        recommendation: null,
                        skipOptimization: false,
                        error: 'Failed to run optimization. Please try again.'
                    });
                }
            } finally {
                if (!cancelled) {
                    setShouldOptimize(false);
                }
            }
        };

        fetchOptimization();

        return () => {
            cancelled = true;
        };
    }, [shouldOptimize, fiInputs, fiResult]);

    // Handlers
    const handlePlanForMe = () => {
        if (!isFormValid) return;
        setShowResults(true);
        setShouldOptimize(true);
    };

    const handleReset = () => {
        setShowResults(false);
        setOptimizationResult(null);
        setShouldOptimize(false);
    };

    const handleFormChange = (newData: FormData) => {
        setFormData(newData);
    };

    // Calculate current plan display data
    const currentPlanData = useMemo<PlanDisplayData | null>(() => {
        if (!fiResult || !fiInputs) return null;

        const fiAge = fiResult.earliestFinancialIndependenceAge;
        if (fiAge === null) return null;

        const fiYearData = fiResult.yearlyBreakdown.find(row => row.year === fiAge);
        if (!fiYearData) return null;

        return calculatePlanMetrics(
            fiYearData.sipCorpus,
            fiYearData.targetWithdrawal,
            fiInputs.currentAge,
            fiAge,
            fiInputs.monthlyExpense,
            fiResult.maxAge
        );
    }, [fiResult, fiInputs]);

    // Calculate AI plan display data
    const aiPlanData = useMemo(() => {
        if (!optimizationResult?.recommendedSolution || !fiInputs || !fiResult) return null;

        const rec = optimizationResult.recommendedSolution;
        const baselineAge = fiResult.earliestFinancialIndependenceAge ?? 60;
        const yearsSaved = baselineAge - rec.fiAge;
        const yearsToFI = rec.fiAge - fiInputs.currentAge;
        const sipRate = yearsToFI < SIP_SHORT_TERM_THRESHOLD ? 0.12 : SIP_RETURN_RATE_LONG_TERM / 100;

        // Calculate estimated corpus with step-up
        let estimatedCorpus = 0;
        let currentSip = rec.newMonthlySip;
        for (let year = 0; year < yearsToFI; year++) {
            estimatedCorpus = (estimatedCorpus + currentSip * 12) * (1 + sipRate);
            if (rec.stepUpPercent > 0) {
                currentSip = currentSip * (1 + rec.stepUpPercent / 100);
            }
        }

        const inflationRate = INFLATION_RATE / 100;
        const inflatedExpense = fiInputs.monthlyExpense * Math.pow(1 + inflationRate, yearsToFI);
        const targetWithdrawal = inflatedExpense * (1 + LIFESTYLE_BUFFER);
        // Use target withdrawal directly (matches FI calculation logic)
        const monthlyWithdrawal = targetWithdrawal;
        const todayValue = monthlyWithdrawal / Math.pow(1 + inflationRate, yearsToFI);
        const lifestyleImprovement = ((todayValue / fiInputs.monthlyExpense) - 1) * 100;

        return {
            fiAge: rec.fiAge,
            yearsSaved,
            finalCorpus: Math.round(estimatedCorpus),
            monthlyWithdrawal: Math.round(monthlyWithdrawal),
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
            maxAge: fiResult.maxAge,
        };
    }, [optimizationResult, fiInputs, fiResult]);

    return (
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 pb-8">
            <div className="flex items-center justify-center py-4">
                <div className="w-full max-w-6xl">
                    {/* Results View */}
                    {showResults && fiResult ? (
                        <div className="space-y-6 animate-fade-in">
                            {/* Header with Summary */}
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

                            {/* Cards Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                                {/* Current Plan Card */}
                                {currentPlanData ? (
                                    <CurrentPlanCard
                                        planData={currentPlanData}
                                        inputs={fiInputs!}
                                    />
                                ) : (
                                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                                        <p className="text-amber-800 dark:text-amber-200 font-medium">
                                            {fiResult.message}
                                        </p>
                                    </div>
                                )}

                                {/* AI Plan Card */}
                                <AIPlanCard
                                    isOptimizing={shouldOptimize}
                                    planData={aiPlanData}
                                    optimizationResult={optimizationResult}
                                />
                            </div>
                        </div>
                    ) : (
                        /* Form View */
                        <FinancialPlannerForm
                            formData={formData}
                            onFormChange={handleFormChange}
                            onSubmit={handlePlanForMe}
                            isFormValid={isFormValid}
                        />
                    )}
                </div>
            </div>
        </main>
    );
};

export default PlanForMePage;