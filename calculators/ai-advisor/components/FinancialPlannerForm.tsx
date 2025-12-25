import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { numberToIndianWords } from '../../../utils/formatters';
import {
    HEALTH_LIFESTYLE_OPTIONS,
    MAX_AGE_INPUT,
    MAX_MONTHLY_EXPENDITURE,
    MAX_MONTHLY_INVESTMENT,
    MAX_EXISTING_CORPUS
} from '../constants';
import { HealthStatus } from '../types';

export interface FormData {
    age: string;
    monthlyExpenditure: string;
    monthlyInvestment: string;
    healthLifestyle: HealthStatus | '';
    hasExistingCorpus: boolean;
    fdCorpus: string;
    mfCorpus: string;
}

interface FinancialPlannerFormProps {
    formData: FormData;
    onFormChange: (data: FormData) => void;
    onSubmit: () => void;
    isFormValid: boolean;
}

export const FinancialPlannerForm: React.FC<FinancialPlannerFormProps> = ({
    formData,
    onFormChange,
    onSubmit,
    isFormValid
}) => {
    // Local state for immediate UI updates (no lag while typing)
    const [localFormData, setLocalFormData] = useState(formData);

    // Refs for input fields to handle Enter key navigation
    const ageInputRef = useRef<HTMLInputElement>(null);
    const expenditureInputRef = useRef<HTMLInputElement>(null);
    const investmentInputRef = useRef<HTMLInputElement>(null);

    // Debounced callback to parent - 150ms delay for calculations
    const debouncedFormChange = useDebouncedCallback(
        (newData: FormData) => onFormChange(newData),
        150
    );

    // Keep local state in sync with parent when formData changes externally
    useEffect(() => {
        if (JSON.stringify(localFormData) !== JSON.stringify(formData)) {
            setLocalFormData(formData);
        }
    }, [formData]);

    const handleInputChange = (field: keyof FormData, value: string) => {
        const numericValue = value.replace(/[^0-9]/g, '');

        if (field === 'age' && numericValue !== '') {
            const ageNum = parseInt(numericValue);
            if (ageNum > MAX_AGE_INPUT) return;
        }

        if (field === 'monthlyExpenditure' && numericValue !== '') {
            const expenditureNum = parseInt(numericValue);
            if (expenditureNum > MAX_MONTHLY_EXPENDITURE) return;
        }

        if (field === 'monthlyInvestment' && numericValue !== '') {
            const investmentNum = parseInt(numericValue);
            if (investmentNum > MAX_MONTHLY_INVESTMENT) return;
        }

        // Validate corpus fields (max 5 crores each)
        if ((field === 'fdCorpus' || field === 'mfCorpus') && numericValue !== '') {
            const corpusNum = parseInt(numericValue);
            if (corpusNum > MAX_EXISTING_CORPUS) return;
        }

        const newFormData = {
            ...localFormData,
            [field]: numericValue
        };
        setLocalFormData(newFormData);
        debouncedFormChange(newFormData);
    };

    const handleHealthLifestyleChange = (value: string) => {
        const newFormData = {
            ...localFormData,
            healthLifestyle: value as HealthStatus
        };
        setLocalFormData(newFormData);
        debouncedFormChange(newFormData);
    };

    const handleExistingCorpusToggle = (checked: boolean) => {
        const newFormData = {
            ...localFormData,
            hasExistingCorpus: checked,
            // Reset corpus values when unchecked
            fdCorpus: checked ? localFormData.fdCorpus : '',
            mfCorpus: checked ? localFormData.mfCorpus : ''
        };
        setLocalFormData(newFormData);
        debouncedFormChange(newFormData);
    };

    // Handle Enter key navigation between inputs
    const handleKeyDown = useCallback((
        e: React.KeyboardEvent<HTMLInputElement>,
        nextInputRef?: React.RefObject<HTMLInputElement>
    ) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (nextInputRef?.current) {
                nextInputRef.current.focus();
            } else {
                // Last input - trigger submit if form is valid
                if (isFormValid) {
                    onSubmit();
                }
            }
        }
    }, [isFormValid, onSubmit]);

    const formatCurrency = (value: string): string => {
        if (!value) return '';
        const num = parseInt(value);
        return num.toLocaleString('en-IN');
    };

    return (
        <div className="max-w-xl mx-auto relative group transform transition-all duration-500 hover:scale-[1.005]">
            <style>{`
                @keyframes border-flow {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                .ai-border-animated {
                    background: linear-gradient(60deg, #4285F4, #9B72CB, #D96570, #9B72CB, #4285F4);
                    background-size: 300% 300%;
                    animation: border-flow 4s ease infinite;
                }
            `}</style>

            {/* Animated Glow */}
            <div className="absolute -inset-1 rounded-3xl ai-border-animated opacity-20 blur-lg group-hover:opacity-40 transition duration-500"></div>

            {/* Animated Border */}
            <div className="absolute -inset-[2px] rounded-3xl ai-border-animated opacity-70 group-hover:opacity-100 transition duration-500"></div>

            {/* Main Card */}
            <div className="relative bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-5 sm:p-6">
                {/* Heading */}
                <h1 className="text-xl sm:text-2xl font-bold text-center text-slate-800 dark:text-slate-100 mb-5 sm:mb-6 leading-tight">
                    Plan Your Financial Independence
                </h1>

                {/* Form Fields */}
                <div className="space-y-4 sm:space-y-5">
                    {/* Age Input */}
                    <div className="bg-slate-50 dark:bg-slate-900/30 rounded-2xl p-4 border border-slate-200/60 dark:border-slate-700/60 transition-colors focus-within:border-blue-400 dark:focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10">
                        <div className="flex items-center justify-between gap-4">
                            <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                                Your Current Age:
                            </label>
                            <input
                                ref={ageInputRef}
                                type="text"
                                inputMode="numeric"
                                value={localFormData.age}
                                onChange={(e) => handleInputChange('age', e.target.value)}
                                onKeyDown={(e) => handleKeyDown(e, expenditureInputRef)}
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
                                Your Monthly Expenditure (excluding EMIs):
                            </label>
                            <div className="flex items-center bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600 px-3 py-2 w-40">
                                <span className="text-slate-400 font-medium mr-2">₹</span>
                                <input
                                    ref={expenditureInputRef}
                                    type="text"
                                    inputMode="numeric"
                                    value={formatCurrency(localFormData.monthlyExpenditure)}
                                    onChange={(e) => handleInputChange('monthlyExpenditure', e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(e, investmentInputRef)}
                                    placeholder="1,00,000"
                                    className="w-full text-lg font-bold bg-transparent text-right text-slate-900 dark:text-white focus:outline-none"
                                />
                            </div>
                        </div>
                        {localFormData.monthlyExpenditure && parseInt(localFormData.monthlyExpenditure) > 0 && (
                            <div className="text-right text-xs font-medium text-slate-500 dark:text-slate-400">
                                {numberToIndianWords(parseInt(localFormData.monthlyExpenditure))}
                            </div>
                        )}
                    </div>

                    {/* Monthly Investment Input */}
                    <div className="bg-slate-50 dark:bg-slate-900/30 rounded-2xl p-4 border border-slate-200/60 dark:border-slate-700/60 transition-colors focus-within:border-blue-400 dark:focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10">
                        <div className="flex items-center justify-between gap-4 mb-2">
                            <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                                How much can you invest monthly?
                            </label>
                            <div className="flex items-center bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600 px-3 py-2 w-40">
                                <span className="text-slate-400 font-medium mr-2">₹</span>
                                <input
                                    ref={investmentInputRef}
                                    type="text"
                                    inputMode="numeric"
                                    value={formatCurrency(localFormData.monthlyInvestment)}
                                    onChange={(e) => handleInputChange('monthlyInvestment', e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(e)}
                                    placeholder="50,000"
                                    className="w-full text-lg font-bold bg-transparent text-right text-slate-900 dark:text-white focus:outline-none"
                                />
                            </div>
                        </div>
                        {localFormData.monthlyInvestment && parseInt(localFormData.monthlyInvestment) > 0 && (
                            <div className="text-right text-xs font-medium text-slate-500 dark:text-slate-400">
                                {numberToIndianWords(parseInt(localFormData.monthlyInvestment))}
                            </div>
                        )}
                    </div>

                    {/* Pre-existing Corpus Section */}
                    <div className="bg-slate-50 dark:bg-slate-900/30 rounded-2xl p-4 border border-slate-200/60 dark:border-slate-700/60 transition-all duration-300">
                        {/* Toggle Checkbox */}
                        <label className="flex items-center gap-3 cursor-pointer select-none">
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    checked={localFormData.hasExistingCorpus}
                                    onChange={(e) => handleExistingCorpusToggle(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 rounded-full peer-checked:bg-emerald-500 transition-colors"></div>
                                <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-5"></div>
                            </div>
                            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                                I have a pre-existing corpus
                            </span>
                        </label>

                        {/* Corpus Inputs - Shown when toggle is on */}
                        {localFormData.hasExistingCorpus && (
                            <div className="mt-4 grid grid-cols-2 gap-3 animate-fade-in">
                                {/* FD Corpus */}
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                                        FD Corpus
                                    </label>
                                    <div className="flex items-center bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600 px-3 py-2">
                                        <span className="text-slate-400 font-medium mr-1 text-sm">₹</span>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            value={formatCurrency(localFormData.fdCorpus)}
                                            onChange={(e) => handleInputChange('fdCorpus', e.target.value)}
                                            placeholder="0"
                                            className="w-full text-base font-bold bg-transparent text-right text-slate-900 dark:text-white focus:outline-none"
                                        />
                                    </div>
                                    {localFormData.fdCorpus && parseInt(localFormData.fdCorpus) > 0 && (
                                        <div className="text-right text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                                            {numberToIndianWords(parseInt(localFormData.fdCorpus))}
                                        </div>
                                    )}
                                </div>

                                {/* MF Corpus */}
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                                        MF Corpus
                                    </label>
                                    <div className="flex items-center bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600 px-3 py-2">
                                        <span className="text-slate-400 font-medium mr-1 text-sm">₹</span>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            value={formatCurrency(localFormData.mfCorpus)}
                                            onChange={(e) => handleInputChange('mfCorpus', e.target.value)}
                                            placeholder="0"
                                            className="w-full text-base font-bold bg-transparent text-right text-slate-900 dark:text-white focus:outline-none"
                                        />
                                    </div>
                                    {localFormData.mfCorpus && parseInt(localFormData.mfCorpus) > 0 && (
                                        <div className="text-right text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                                            {numberToIndianWords(parseInt(localFormData.mfCorpus))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-3 ml-1">
                            How would you describe your Health & Lifestyle?
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                            {HEALTH_LIFESTYLE_OPTIONS.map((option) => (
                                <label
                                    key={option.value}
                                    className={`cursor-pointer group relative flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all duration-200 ${localFormData.healthLifestyle === option.value
                                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 dark:border-blue-400 shadow-md'
                                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-800'
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        name="healthLifestyle"
                                        value={option.value}
                                        checked={localFormData.healthLifestyle === option.value}
                                        onChange={(e) => handleHealthLifestyleChange(e.target.value)}
                                        className="sr-only"
                                    />
                                    <span className="text-xl mb-1 filter grayscale group-hover:grayscale-0 transition-all duration-300 transform group-hover:scale-110">
                                        {option.emoji}
                                    </span>
                                    <span className={`text-[10px] sm:text-xs font-bold text-center leading-tight ${localFormData.healthLifestyle === option.value
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
                <div className="flex items-center justify-center mt-6">
                    <div className="relative group">
                        <button
                            type="button"
                            disabled={!isFormValid}
                            onClick={onSubmit}
                            className={`relative inline-block p-px font-semibold leading-6 text-white dark:text-black bg-neutral-900 dark:bg-neutral-100 shadow-2xl rounded-2xl shadow-emerald-900 transition-all duration-300 ease-in-out ${isFormValid
                                ? 'cursor-pointer hover:scale-105 active:scale-95 hover:shadow-emerald-600'
                                : 'cursor-not-allowed opacity-50'
                                }`}
                        >
                            <span className={`absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-500 via-cyan-500 to-sky-600 p-[2px] opacity-0 transition-opacity duration-500 ${isFormValid ? 'group-hover:opacity-100' : ''}`} />
                            <span className="relative z-10 block px-6 py-3 rounded-2xl bg-neutral-950 dark:bg-neutral-50">
                                <div className="relative z-10 flex items-center space-x-3">
                                    <span className={`transition-all duration-500 ${isFormValid ? 'group-hover:translate-x-1.5 group-hover:text-emerald-300' : ''}`}>Begin Journey</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-7 h-7 transition-all duration-500 ${isFormValid ? 'group-hover:translate-x-1.5 group-hover:text-emerald-300' : ''}`}>
                                        <path d="M16.172 11l-5.364-5.364 1.414-1.414L20 12l-7.778 7.778-1.414-1.414L16.172 13H4v-2z" />
                                    </svg>
                                </div>
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
