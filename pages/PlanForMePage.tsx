import React, { useState } from 'react';
import { numberToIndianWords } from '../utils/formatters';

interface FormData {
    age: string;
    monthlyExpenditure: string;
    monthlyInvestment: string;
    healthLifestyle: string;
}

const PlanForMePage: React.FC = () => {
    const [formData, setFormData] = useState<FormData>({
        age: '',
        monthlyExpenditure: '',
        monthlyInvestment: '',
        healthLifestyle: 'generally_healthy', // Pre-select middle option
    });

    const handleInputChange = (field: keyof FormData, value: string) => {
        // Allow only numbers
        const numericValue = value.replace(/[^0-9]/g, '');

        // Validate age (max 99)
        if (field === 'age' && numericValue !== '') {
            const ageNum = parseInt(numericValue);
            if (ageNum > 99) {
                return; // Don't update if age exceeds 99
            }
        }

        // Validate monthly expenditure (max 10 lakhs)
        if (field === 'monthlyExpenditure' && numericValue !== '') {
            const expenditureNum = parseInt(numericValue);
            if (expenditureNum > 1000000) {
                return; // Don't update if expenditure exceeds 10 lakhs
            }
        }

        // Validate monthly investment (max 5 lakhs)
        if (field === 'monthlyInvestment' && numericValue !== '') {
            const investmentNum = parseInt(numericValue);
            if (investmentNum > 500000) {
                return; // Don't update if investment exceeds 5 lakhs
            }
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

    return (
        <main className="container mx-auto px-3 sm:px-6 lg:px-8 pb-4 sm:pb-6">
            <div className="flex items-center justify-center py-2 sm:py-3">
                <div className="w-full max-w-2xl">
                    {/* Main Card */}
                    <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200/60 dark:border-slate-700/60 p-4 sm:p-6">
                        {/* Heading */}
                        <h1 className="text-base sm:text-lg font-bold text-center text-slate-800 dark:text-slate-100 mb-4 sm:mb-5 leading-tight">
                            Investment Plan Form
                        </h1>

                        {/* Form Fields */}
                        <div className="space-y-3 sm:space-y-3.5">
                            {/* Age Input */}
                            <div className="bg-slate-50/50 dark:bg-slate-900/30 rounded-xl p-3 sm:p-3.5 border border-slate-200/40 dark:border-slate-700/40">
                                <div className="flex items-center justify-between gap-3">
                                    <label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                                        My age is
                                    </label>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        value={formData.age}
                                        onChange={(e) => handleInputChange('age', e.target.value)}
                                        placeholder="30"
                                        maxLength={2}
                                        className="w-24 sm:w-32 text-base sm:text-lg font-semibold bg-white/80 dark:bg-slate-800/80 rounded-lg px-3 py-1.5 sm:py-2 border border-slate-200 dark:border-slate-700 focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 dark:focus:ring-emerald-400/20 transition-all duration-200 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 outline-none text-center"
                                    />
                                </div>
                            </div>

                            {/* Monthly Expenditure Input */}
                            <div className="bg-slate-50/50 dark:bg-slate-900/30 rounded-xl p-3 sm:p-3.5 border border-slate-200/40 dark:border-slate-700/40">
                                <div className="flex items-center justify-between gap-3">
                                    <label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                                        My monthly expenditure is
                                    </label>
                                    <div className="flex items-center bg-white/80 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700 focus-within:border-emerald-500 dark:focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-500/20 dark:focus-within:ring-emerald-400/20 transition-all duration-200">
                                        <span className="pl-2 sm:pl-3 text-sm sm:text-base font-semibold text-slate-600 dark:text-slate-400">₹</span>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            value={formatCurrency(formData.monthlyExpenditure)}
                                            onChange={(e) => handleInputChange('monthlyExpenditure', e.target.value)}
                                            placeholder="1,00,000"
                                            className="w-28 sm:w-36 text-base sm:text-lg font-semibold bg-transparent px-2 py-1.5 sm:py-2 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 outline-none text-right"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Monthly Investment Input */}
                            <div className="bg-slate-50/50 dark:bg-slate-900/30 rounded-xl p-3 sm:p-3.5 border border-slate-200/40 dark:border-slate-700/40">
                                <div className="flex items-center justify-between gap-3">
                                    <label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                                        I can invest
                                    </label>
                                    <div className="flex items-center gap-1.5 sm:gap-2">
                                        <div className="flex items-center bg-white/80 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700 focus-within:border-emerald-500 dark:focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-500/20 dark:focus-within:ring-emerald-400/20 transition-all duration-200">
                                            <span className="pl-2 sm:pl-3 text-sm sm:text-base font-semibold text-slate-600 dark:text-slate-400">₹</span>
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                value={formatCurrency(formData.monthlyInvestment)}
                                                onChange={(e) => handleInputChange('monthlyInvestment', e.target.value)}
                                                placeholder="50,000"
                                                className="w-24 sm:w-32 text-base sm:text-lg font-semibold bg-transparent px-2 py-1.5 sm:py-2 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 outline-none text-right"
                                            />
                                        </div>
                                        <span className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                            /month
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Health & Lifestyle Question */}
                            <div className="pt-1 sm:pt-2">
                                <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-2.5 sm:mb-3">
                                    How would you describe your overall health & lifestyle today?
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                                    {[
                                        { value: 'needs_improvement', label: 'Needs improvement' },
                                        { value: 'generally_healthy', label: 'Generally healthy' },
                                        { value: 'very_healthy', label: 'Very healthy & disciplined' }
                                    ].map((option) => (
                                        <label
                                            key={option.value}
                                            className={`flex items-center justify-center gap-2 p-2.5 sm:p-3 rounded-lg cursor-pointer transition-all duration-200 border-2 ${
                                                formData.healthLifestyle === option.value
                                                    ? 'bg-white dark:bg-slate-800 border-emerald-500 dark:border-emerald-400 shadow-sm'
                                                    : 'bg-slate-50/50 dark:bg-slate-900/30 border-slate-200/60 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600'
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name="healthLifestyle"
                                                value={option.value}
                                                checked={formData.healthLifestyle === option.value}
                                                onChange={(e) => handleHealthLifestyleChange(e.target.value)}
                                                className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 dark:text-emerald-500 border-slate-300 dark:border-slate-600 focus:ring-emerald-500 focus:ring-2 cursor-pointer"
                                            />
                                            <span className={`text-[11px] sm:text-sm font-medium text-center ${
                                                formData.healthLifestyle === option.value
                                                    ? 'text-slate-800 dark:text-slate-100'
                                                    : 'text-slate-600 dark:text-slate-400'
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
                            className={`mt-4 sm:mt-5 w-full py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-semibold shadow-md transition-all duration-300 ${
                                isFormValid()
                                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 text-white hover:from-blue-600 hover:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800 hover:shadow-lg hover:scale-[1.01] active:scale-[0.99]'
                                    : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                            }`}
                        >
                            Plan For Me
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default PlanForMePage;