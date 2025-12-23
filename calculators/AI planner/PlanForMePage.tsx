import React, { useState } from 'react';
import { numberToIndianWords } from '../../utils/formatters';
import { useFinancialIndependencePlanner } from './useFinancialIndependencePlanner';
import { FinancialIndependenceInputs } from './types';

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

    const [fiInputs, setFiInputs] = useState<FinancialIndependenceInputs | null>(null);
    const fiResult = useFinancialIndependencePlanner(fiInputs);

    const handlePlanForMe = () => {
        if (!isFormValid()) return;

        setFiInputs({
            currentAge: parseInt(formData.age),
            monthlyExpense: parseInt(formData.monthlyExpenditure),
            monthlyInvestment: parseInt(formData.monthlyInvestment),
            healthStatus: formData.healthLifestyle,
        });
    };

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
                            Financial Independence Plan Form
                        </h1>

                        {/* Form Fields */}
                        <div className="space-y-3 sm:space-y-3.5">
                            {/* Age Input */}
                            <div className="bg-slate-50/50 dark:bg-slate-900/30 rounded-xl p-3 sm:p-3.5 border border-slate-200/40 dark:border-slate-700/40">
                                <div className="flex items-center gap-2 sm:gap-3">
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
                                <div className="flex items-center gap-2 sm:gap-3">
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
                                {formData.monthlyExpenditure && parseInt(formData.monthlyExpenditure) > 0 && (
                                    <div className="mt-2 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 italic">
                                        {numberToIndianWords(parseInt(formData.monthlyExpenditure))} Rupees
                                    </div>
                                )}
                            </div>

                            {/* Monthly Investment Input */}
                            <div className="bg-slate-50/50 dark:bg-slate-900/30 rounded-xl p-3 sm:p-3.5 border border-slate-200/40 dark:border-slate-700/40">
                                <div className="flex items-center gap-2 sm:gap-3">
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
                                {formData.monthlyInvestment && parseInt(formData.monthlyInvestment) > 0 && (
                                    <div className="mt-2 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 italic">
                                        {numberToIndianWords(parseInt(formData.monthlyInvestment))} Rupees per month
                                    </div>
                                )}
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
                                        { value: 'very_healthy', label: 'Very healthy' }
                                    ].map((option) => (
                                        <label
                                            key={option.value}
                                            className={`flex items-center justify-center gap-2 p-2.5 sm:p-3 rounded-lg cursor-pointer transition-all duration-200 border-2 ${formData.healthLifestyle === option.value
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
                                            <span className={`text-[11px] sm:text-sm font-medium text-center ${formData.healthLifestyle === option.value
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
                            onClick={handlePlanForMe}
                            className={`mt-4 sm:mt-5 w-full py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-semibold shadow-md transition-all duration-300 ${isFormValid()
                                ? 'bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 text-white hover:from-blue-600 hover:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800 hover:shadow-lg hover:scale-[1.01] active:scale-[0.99]'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                                }`}
                        >
                            Plan For Me
                        </button>
                    </div>

                    {/* Results Section */}
                    {fiResult && (
                        <div className="mt-6 space-y-4">
                            {/* Summary Card */}
                            <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-200/60 dark:border-slate-700/60 p-4 sm:p-6">
                                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-3">
                                    📊 Financial Independence Analysis Summary
                                </h2>
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3">
                                        <div className="text-xs text-slate-500 dark:text-slate-400">Current Age</div>
                                        <div className="text-lg font-bold text-slate-800 dark:text-slate-100">{fiResult.currentAge}</div>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3">
                                        <div className="text-xs text-slate-500 dark:text-slate-400">Max Age (Based on Health)</div>
                                        <div className="text-lg font-bold text-slate-800 dark:text-slate-100">{fiResult.maxAge}</div>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3">
                                        <div className="text-xs text-slate-500 dark:text-slate-400">Can be Financially Free?</div>
                                        <div className={`text-lg font-bold ${fiResult.canBeFinanciallyIndependent ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                                            {fiResult.canBeFinanciallyIndependent ? 'Yes ✅' : 'No ❌'}
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3">
                                        <div className="text-xs text-slate-500 dark:text-slate-400">Earliest FI Age</div>
                                        <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                                            {fiResult.earliestFinancialIndependenceAge ?? 'N/A'}
                                        </div>
                                    </div>
                                </div>
                                <div className={`p-3 rounded-lg ${fiResult.canBeFinanciallyIndependent ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800' : 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'}`}>
                                    <p className={`text-sm ${fiResult.canBeFinanciallyIndependent ? 'text-emerald-800 dark:text-emerald-200' : 'text-amber-800 dark:text-amber-200'}`}>
                                        {fiResult.message}
                                    </p>
                                </div>
                            </div>

                            {/* Year-by-Year Breakdown Table */}
                            <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-200/60 dark:border-slate-700/60 p-4 sm:p-6">
                                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-3">
                                    📈 Year-by-Year Breakdown
                                </h2>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs sm:text-sm">
                                        <thead>
                                            <tr className="bg-slate-100 dark:bg-slate-900/50">
                                                <th className="px-2 py-2 text-left font-semibold text-slate-700 dark:text-slate-300">Age</th>
                                                <th className="px-2 py-2 text-left font-semibold text-slate-700 dark:text-slate-300">Years</th>
                                                <th className="px-2 py-2 text-right font-semibold text-slate-700 dark:text-slate-300">SIP Corpus</th>
                                                <th className="px-2 py-2 text-center font-semibold text-slate-700 dark:text-slate-300">Rate</th>
                                                <th className="px-2 py-2 text-right font-semibold text-slate-700 dark:text-slate-300">Inflated Expense</th>
                                                <th className="px-2 py-2 text-right font-semibold text-slate-700 dark:text-slate-300">Target W/D</th>
                                                <th className="px-2 py-2 text-center font-semibold text-slate-700 dark:text-slate-300">FI Years</th>
                                                <th className="px-2 py-2 text-right font-semibold text-slate-700 dark:text-slate-300">Final Corpus</th>
                                                <th className="px-2 py-2 text-center font-semibold text-slate-700 dark:text-slate-300">Final %</th>
                                                <th className="px-2 py-2 text-center font-semibold text-slate-700 dark:text-slate-300">Sustainable?</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {fiResult.yearlyBreakdown.map((row, index) => (
                                                <tr
                                                    key={row.year}
                                                    className={`border-b border-slate-200 dark:border-slate-700 ${row.year === fiResult.earliestFinancialIndependenceAge
                                                        ? 'bg-emerald-50 dark:bg-emerald-900/30'
                                                        : index % 2 === 0
                                                            ? 'bg-white dark:bg-slate-800'
                                                            : 'bg-slate-50 dark:bg-slate-850'
                                                        }`}
                                                >
                                                    <td className="px-2 py-2 font-medium text-slate-800 dark:text-slate-200">
                                                        {row.year}
                                                        {row.year === fiResult.earliestFinancialIndependenceAge && ' 🎯'}
                                                    </td>
                                                    <td className="px-2 py-2 text-slate-600 dark:text-slate-400">{row.yearsFromNow}</td>
                                                    <td className="px-2 py-2 text-right text-slate-800 dark:text-slate-200">₹{row.sipCorpus.toLocaleString('en-IN')}</td>
                                                    <td className="px-2 py-2 text-center text-slate-600 dark:text-slate-400">{row.sipReturnRate}%</td>
                                                    <td className="px-2 py-2 text-right text-slate-800 dark:text-slate-200">₹{row.inflationAdjustedExpense.toLocaleString('en-IN')}</td>
                                                    <td className="px-2 py-2 text-right text-slate-800 dark:text-slate-200">₹{row.targetWithdrawal.toLocaleString('en-IN')}</td>
                                                    <td className="px-2 py-2 text-center text-slate-600 dark:text-slate-400">{row.yearsInFinancialIndependence}</td>
                                                    <td className="px-2 py-2 text-right text-slate-800 dark:text-slate-200">₹{row.swpFinalCorpus.toLocaleString('en-IN')}</td>
                                                    <td className={`px-2 py-2 text-center font-medium ${row.swpFinalCorpusPercentage >= 10 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                                                        {row.swpFinalCorpusPercentage.toFixed(1)}%
                                                    </td>
                                                    <td className="px-2 py-2 text-center">
                                                        {row.swpSustainable
                                                            ? <span className="text-emerald-600 dark:text-emerald-400 font-bold">✅</span>
                                                            : <span className="text-red-500 dark:text-red-400">❌</span>
                                                        }
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                                    <p><strong>Note:</strong> Sustainability requires final corpus to be ≥10% of initial corpus at the start of financial independence.</p>
                                    <p><strong>Target W/D:</strong> Monthly withdrawal = Inflation-adjusted expense + 25% lifestyle buffer</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
};

export default PlanForMePage;