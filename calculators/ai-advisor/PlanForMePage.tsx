import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useFinancialIndependencePlanner, calculateMinimumInvestmentForFI, calculateCorpusWithVariableRate, calculateExistingCorpusGrowth } from './useFinancialIndependencePlanner';
import { useOptimizationWorker } from './hooks/useOptimizationWorker';
import { FinancialIndependenceInputs, OptimizationResult, HealthStatus, PlanDisplayData, MinimumInvestmentData } from './types';
import { INFLATION_RATE, LIFESTYLE_BUFFER, OPTIMIZATION_TARGET_FI_AGE } from './constants';
import { getAIRecommendation } from './geminiService';
import { runOptimizationFallback } from './optimizationFallback';

// Components
import { CurrentPlanCard, AIPlanCard, FinancialPlannerForm, FormData } from './components';
import { calculatePlanMetrics, getProposedChangeText } from './utils/planMetrics';

const PlanForMePage: React.FC = () => {
    const [formData, setFormData] = useState<FormData>({
        age: '',
        monthlyExpenditure: '',
        monthlyInvestment: '',
        healthLifestyle: 'generally_healthy',
        hasExistingCorpus: false,
        fdCorpus: '',
        mfCorpus: '',
    });

    const [showResults, setShowResults] = useState(false);
    // Use a unique run ID instead of boolean flags to ensure effect re-runs on every new request
    // Each "Plan for me" click increments this, guaranteeing the effect dependency changes
    const [optimizationRunId, setOptimizationRunId] = useState<number | null>(null);
    const currentRunIdRef = useRef<number | null>(null); // Track current run for cancellation
    const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);

    // Use Web Worker for optimization
    const { runOptimization } = useOptimizationWorker();

    // Validation helper
    const isFieldValid = useCallback((field: keyof FormData): boolean => {
        const value = formData[field];
        if (typeof value === 'boolean') return true; // Boolean fields are always valid
        return value !== '' && parseInt(value) > 0;
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
            existingFDCorpus: formData.hasExistingCorpus && formData.fdCorpus ? parseInt(formData.fdCorpus) : 0,
            existingMFCorpus: formData.hasExistingCorpus && formData.mfCorpus ? parseInt(formData.mfCorpus) : 0,
        };
    }, [formData, isFormValid, showResults]);

    // Use the financial independence planner hook
    const fiResult = useFinancialIndependencePlanner(fiInputs);


    // Optimization effect - triggers when optimizationRunId changes
    // Using a unique run ID ensures the effect ALWAYS re-runs for each new request
    useEffect(() => {
        // Only run if we have a valid run ID and all required data
        if (optimizationRunId === null || !fiInputs || !fiResult) return;

        // Track this run ID for cancellation
        const thisRunId = optimizationRunId;
        currentRunIdRef.current = thisRunId;

        const fetchOptimization = async () => {
            let workerResult: OptimizationResult | null = null;

            try {
                // Step 1: Try to get solutions from worker (heavy CPU calculations)
                console.log(`⚙️ [Optimization] Run #${thisRunId}: Starting worker calculations...`);
                workerResult = await runOptimization(fiInputs, fiResult.earliestFinancialIndependenceAge);
            } catch (workerError) {
                // Worker failed - use main-thread fallback
                console.warn(`⚠️ [Optimization] Run #${thisRunId}: Worker failed, using fallback...`);
                try {
                    workerResult = runOptimizationFallback(fiInputs, fiResult.earliestFinancialIndependenceAge);
                } catch (fallbackError) {
                    console.error(`[Optimization] Run #${thisRunId}: Fallback also failed:`, fallbackError);
                }
            }

            // Check if this run was cancelled (a newer run started)
            if (currentRunIdRef.current !== thisRunId) {
                console.log(`🚫 [Optimization] Run #${thisRunId}: Cancelled (newer run started)`);
                return;
            }

            if (!workerResult) {
                setOptimizationResult({
                    baselineFiAge: fiResult.earliestFinancialIndependenceAge,
                    solutions: [],
                    recommendedSolution: null,
                    recommendation: null,
                    skipOptimization: false,
                    error: 'Failed to run optimization. Please try again.'
                });
                return;
            }

            try {
                // Step 2: If we have solutions, get AI recommendation
                if (workerResult.solutions.length > 0 && !workerResult.skipOptimization) {
                    console.log(`🔄 [Optimization] Run #${thisRunId}: Requesting AI recommendation...`);
                    const { recommendation, source } = await getAIRecommendation(
                        workerResult.baselineFiAge ?? 60,
                        workerResult.solutions,
                        {
                            preferLowerStepUp: true,
                            preferLowerSipIncrease: true,
                            targetAge: OPTIMIZATION_TARGET_FI_AGE
                        }
                    );

                    // Check cancellation again after async call
                    if (currentRunIdRef.current !== thisRunId) {
                        console.log(`🚫 [Optimization] Run #${thisRunId}: Cancelled after AI call`);
                        return;
                    }

                    // Enhance result with AI recommendation
                    const recommendedSolution = recommendation.recommendedIndex >= 0
                        && recommendation.recommendedIndex < workerResult.solutions.length
                        ? workerResult.solutions[recommendation.recommendedIndex]
                        : workerResult.solutions[0];

                    if (source === 'openrouter') {
                        console.log(`🤖✅ [Optimization] Run #${thisRunId}: Complete! (OPENROUTER)`);
                    } else if (source === 'gemini') {
                        console.log(`🤖✅ [Optimization] Run #${thisRunId}: Complete! (GEMINI)`);
                    } else {
                        console.log(`⚠️🏁 [Optimization] Run #${thisRunId}: Complete! (FALLBACK)`);
                    }

                    setOptimizationResult({
                        ...workerResult,
                        recommendation,
                        recommendedSolution
                    });
                } else {
                    // No solutions or skip optimization - use result as-is
                    console.log(`🏁 [Optimization] Run #${thisRunId}: Complete (No optimization needed)`);
                    setOptimizationResult(workerResult);
                }
            } catch (error) {
                console.error(`❌ [Optimization] Run #${thisRunId}: AI step failed:`, error);
                // Still show the worker result even if AI fails
                if (currentRunIdRef.current === thisRunId) {
                    setOptimizationResult(workerResult);
                }
            }
        };

        fetchOptimization();

        // Cleanup: mark this run as cancelled if effect re-runs
        return () => {
            if (currentRunIdRef.current === thisRunId) {
                currentRunIdRef.current = null;
            }
        };
    }, [optimizationRunId, fiInputs, fiResult, runOptimization]);

    // Handlers - wrapped in useCallback for stable references
    const handlePlanForMe = useCallback(() => {
        if (!isFormValid) return;
        setShowResults(true);
        setOptimizationResult(null);
        // Increment run ID to trigger a new optimization run
        // requestAnimationFrame ensures fiInputs is computed before we trigger the effect
        requestAnimationFrame(() => {
            setOptimizationRunId(prev => (prev ?? 0) + 1);
        });
    }, [isFormValid]);


    const handleFormChange = useCallback((newData: FormData) => {
        setFormData(newData);
    }, []);

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

    // Calculate minimum investment data when FI is not achievable before 60
    const minimumInvestmentData = useMemo<MinimumInvestmentData | null>(() => {
        if (!fiInputs || currentPlanData) return null; // Only when FI not achievable

        const result = calculateMinimumInvestmentForFI(
            fiInputs.currentAge,
            fiInputs.monthlyExpense,
            fiInputs.healthStatus,
            60,
            fiInputs.existingFDCorpus || 0,
            fiInputs.existingMFCorpus || 0
        );

        if (!result) return null;

        return {
            minimumInvestment: result.minimumInvestment,
            currentInvestment: fiInputs.monthlyInvestment,
            investmentGap: result.minimumInvestment - fiInputs.monthlyInvestment,
            targetFIAge: 60,
        };
    }, [fiInputs, currentPlanData]);

    // Calculate AI plan display data
    const aiPlanData = useMemo(() => {
        if (!optimizationResult?.recommendedSolution || !fiInputs || !fiResult) return null;

        const rec = optimizationResult.recommendedSolution;
        const baselineAge = fiResult.earliestFinancialIndependenceAge ?? 60;
        const yearsSaved = baselineAge - rec.fiAge;
        const yearsToFI = rec.fiAge - fiInputs.currentAge;

        // Calculate estimated corpus using the correct hybrid rate logic (consistent with Current Plan Card)
        const sipCorpus = calculateCorpusWithVariableRate(rec.newMonthlySip, yearsToFI, rec.stepUpPercent);

        // Add grown existing corpus (FD at 7%, MF at 12%)
        const existingCorpusGrown = calculateExistingCorpusGrowth(
            fiInputs.existingFDCorpus || 0,
            fiInputs.existingMFCorpus || 0,
            yearsToFI
        );

        const estimatedCorpus = sipCorpus + existingCorpusGrown;

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
                        <div className="animate-fade-in">
                            {/* Cards Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                                {/* Current Plan Card */}
                                <CurrentPlanCard
                                    planData={currentPlanData}
                                    inputs={fiInputs!}
                                    minimumInvestmentData={minimumInvestmentData}
                                />

                                {/* AI Plan Card */}
                                <AIPlanCard
                                    isOptimizing={optimizationRunId !== null && optimizationResult === null}
                                    planData={aiPlanData}
                                    optimizationResult={optimizationResult}
                                    inputs={fiInputs}
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