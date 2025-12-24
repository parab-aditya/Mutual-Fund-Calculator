import React from 'react';
import { numberToIndianWords } from '../../../utils/formatters';
import {
    HEALTH_LIFESTYLE_OPTIONS,
    MAX_AGE_INPUT,
    MAX_MONTHLY_EXPENDITURE,
    MAX_MONTHLY_INVESTMENT
} from '../constants';
import { HealthStatus } from '../types';

export interface FormData {
    age: string;
    monthlyExpenditure: string;
    monthlyInvestment: string;
    healthLifestyle: HealthStatus | '';
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

        onFormChange({
            ...formData,
            [field]: numericValue
        });
    };

    const handleHealthLifestyleChange = (value: string) => {
        onFormChange({
            ...formData,
            healthLifestyle: value as HealthStatus
        });
    };

    const formatCurrency = (value: string): string => {
        if (!value) return '';
        const num = parseInt(value);
        return num.toLocaleString('en-IN');
    };

    return (
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
                            {HEALTH_LIFESTYLE_OPTIONS.map((option) => (
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
                    disabled={!isFormValid}
                    onClick={onSubmit}
                    className={`mt-8 w-full py-4 rounded-2xl text-lg font-bold shadow-lg transition-all duration-300 transform hover:-translate-y-1 ${isFormValid
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-blue-500/25 dark:hover:shadow-blue-900/40'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                        }`}
                >
                    Plan For Me
                </button>
            </div>
        </div>
    );
};
