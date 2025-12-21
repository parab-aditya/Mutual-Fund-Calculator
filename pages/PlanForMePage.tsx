import React, { useState } from 'react';
import { numberToIndianWords } from '../utils/formatters';

interface FormData {
    age: string;
    monthlyExpenditure: string;
    monthlyInvestment: string;
}

const PlanForMePage: React.FC = () => {
    const [formData, setFormData] = useState<FormData>({
        age: '',
        monthlyExpenditure: '',
        monthlyInvestment: '',
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
        return isFieldValid('age') && isFieldValid('monthlyExpenditure') && isFieldValid('monthlyInvestment');
    };

    return (
        <main className="container mx-auto px-3 sm:px-6 lg:px-8 pb-6 sm:pb-8">
            <div className="flex items-center justify-center py-3 sm:py-4">
                <div className="w-full max-w-xl">
                    {/* Main Card */}
                    <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200/60 dark:border-slate-700/60 p-5 sm:p-6">
                        {/* Heading */}
                        <h1 className="text-lg sm:text-xl font-bold text-center text-slate-800 dark:text-slate-100 mb-5 sm:mb-5 leading-tight px-2">
                            Let us create the ideal investment plan for you.
                        </h1>

                        {/* Form Fields */}
                        <div className="space-y-4 sm:space-y-3.5">
                            {/* Age Input */}
                            <div className="bg-slate-50/80 dark:bg-slate-900/50 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 border border-slate-200/50 dark:border-slate-700/50 transition-all duration-300 hover:border-slate-300/70 dark:hover:border-slate-600/70">
                                <div className="flex items-center justify-between mb-2 sm:mb-2">
                                    <label className="text-xs sm:text-base font-medium text-slate-700 dark:text-slate-300">
                                        My age is
                                    </label>
                                    {isFieldValid('age') && (
                                        <div className="flex-shrink-0 w-4 sm:w-5 h-4 sm:h-5 rounded-full bg-emerald-500 dark:bg-emerald-600 flex items-center justify-center animate-in fade-in zoom-in duration-300">
                                            <svg className="w-2.5 sm:w-3.5 h-2.5 sm:h-3.5 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24" stroke="currentColor">
                                                <path d="M5 13l4 4L19 7"></path>
                                            </svg>
                                        </div>
                                    )}
                                </div>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    value={formData.age}
                                    onChange={(e) => handleInputChange('age', e.target.value)}
                                    placeholder="30"
                                    maxLength={2}
                                    className="w-full text-lg sm:text-xl font-semibold bg-white/80 dark:bg-slate-800/80 rounded-lg sm:rounded-xl px-3 py-2 border-2 border-transparent focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/20 dark:focus:ring-emerald-400/20 transition-all duration-200 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 outline-none"
                                />
                            </div>

                            {/* Monthly Expenditure Input */}
                            <div className="bg-slate-50/80 dark:bg-slate-900/50 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 border border-slate-200/50 dark:border-slate-700/50 transition-all duration-300 hover:border-slate-300/70 dark:hover:border-slate-600/70">
                                <div className="flex items-center justify-between mb-2 sm:mb-2">
                                    <label className="text-xs sm:text-base font-medium text-slate-700 dark:text-slate-300">
                                        My monthly expenditure is
                                    </label>
                                    {isFieldValid('monthlyExpenditure') && (
                                        <div className="flex-shrink-0 w-4 sm:w-5 h-4 sm:h-5 rounded-full bg-emerald-500 dark:bg-emerald-600 flex items-center justify-center animate-in fade-in zoom-in duration-300">
                                            <svg className="w-2.5 sm:w-3.5 h-2.5 sm:h-3.5 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24" stroke="currentColor">
                                                <path d="M5 13l4 4L19 7"></path>
                                            </svg>
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-0.5">
                                    <div className="flex items-center bg-white/80 dark:bg-slate-800/80 rounded-lg sm:rounded-xl border-2 border-transparent focus-within:border-emerald-500 dark:focus-within:border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-500/20 dark:focus-within:ring-emerald-400/20 transition-all duration-200">
                                        <span className="pl-2.5 sm:pl-3 text-base sm:text-xl font-semibold text-slate-600 dark:text-slate-400">₹</span>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            value={formatCurrency(formData.monthlyExpenditure)}
                                            onChange={(e) => handleInputChange('monthlyExpenditure', e.target.value)}
                                            placeholder="1,00,000"
                                            className="flex-1 text-base sm:text-xl font-semibold bg-transparent px-1.5 sm:px-2 py-2 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 outline-none"
                                        />
                                    </div>
                                    {formData.monthlyExpenditure && parseInt(formData.monthlyExpenditure) > 0 && (
                                        <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 px-1">
                                            {numberToIndianWords(parseInt(formData.monthlyExpenditure))}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Monthly Investment Input */}
                            <div className="bg-slate-50/80 dark:bg-slate-900/50 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 border border-slate-200/50 dark:border-slate-700/50 transition-all duration-300 hover:border-slate-300/70 dark:hover:border-slate-600/70">
                                <div className="flex items-center justify-between mb-2 sm:mb-2">
                                    <label className="text-xs sm:text-base font-medium text-slate-700 dark:text-slate-300">
                                        I can invest
                                    </label>
                                    {isFieldValid('monthlyInvestment') && (
                                        <div className="flex-shrink-0 w-4 sm:w-5 h-4 sm:h-5 rounded-full bg-emerald-500 dark:bg-emerald-600 flex items-center justify-center animate-in fade-in zoom-in duration-300">
                                            <svg className="w-2.5 sm:w-3.5 h-2.5 sm:h-3.5 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24" stroke="currentColor">
                                                <path d="M5 13l4 4L19 7"></path>
                                            </svg>
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-0.5">
                                    <div className="flex items-center gap-1.5 sm:gap-2">
                                        <div className="flex-1 min-w-0 flex items-center bg-white/80 dark:bg-slate-800/80 rounded-lg sm:rounded-xl border-2 border-transparent focus-within:border-emerald-500 dark:focus-within:border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-500/20 dark:focus-within:ring-emerald-400/20 transition-all duration-200">
                                            <span className="pl-2.5 sm:pl-3 text-base sm:text-xl font-semibold text-slate-600 dark:text-slate-400">₹</span>
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                value={formatCurrency(formData.monthlyInvestment)}
                                                onChange={(e) => handleInputChange('monthlyInvestment', e.target.value)}
                                                placeholder="50,000"
                                                className="flex-1 min-w-0 text-base sm:text-xl font-semibold bg-transparent px-1.5 sm:px-2 py-2 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 outline-none"
                                            />
                                        </div>
                                        <span className="text-[10px] sm:text-sm font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap flex-shrink-0">
                                            /month
                                        </span>
                                    </div>
                                    {formData.monthlyInvestment && parseInt(formData.monthlyInvestment) > 0 && (
                                        <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 px-1">
                                            {numberToIndianWords(parseInt(formData.monthlyInvestment))}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="button"
                            disabled={!isFormValid()}
                            className={`mt-5 sm:mt-6 w-full py-3 sm:py-3 rounded-xl sm:rounded-2xl text-sm sm:text-base font-semibold shadow-lg transition-all duration-300 ${isFormValid()
                                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 text-white hover:from-blue-600 hover:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]'
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