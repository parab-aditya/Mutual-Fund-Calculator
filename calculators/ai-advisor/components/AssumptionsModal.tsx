import React, { memo, useCallback, useEffect } from 'react';
import {
    MAX_AGE_MAPPING,
    INFLATION_RATE,
    SIP_RETURN_RATE_SHORT_TERM,
    SIP_RETURN_RATE_LONG_TERM,
    SIP_SHORT_TERM_THRESHOLD,
    SWP_RETURN_RATE,
    LTCG_TAX_RATE,
    SWP_STEP_UP_PERCENTAGE,
    LIFESTYLE_BUFFER,
    SWP_SUSTAINABILITY_BUFFER,
} from '../constants';
import { HealthStatus } from '../types';

interface AssumptionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    userAge: number;
    monthlyExpense: number;
    monthlyInvestment: number;
    healthStatus: HealthStatus;
}

const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

const healthLabels: Record<HealthStatus, string> = {
    'needs_improvement': 'Needs Improvement',
    'generally_healthy': 'Generally Healthy',
    'very_healthy': 'Very Healthy',
};

export const AssumptionsModal = memo<AssumptionsModalProps>(function AssumptionsModal({
    isOpen,
    onClose,
    userAge,
    monthlyExpense,
    monthlyInvestment,
    healthStatus,
}) {
    // Handle escape key
    const handleEscape = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
    }, [onClose]);

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = '';
        };
    }, [isOpen, handleEscape]);

    if (!isOpen) return null;

    const maxAge = MAX_AGE_MAPPING[healthStatus];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/20 border border-white/20 dark:border-slate-700/50 animate-scale-in overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200/60 dark:border-slate-700/60">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white tracking-tight">
                        Assumptions & Calculations
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 -mr-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200"
                        aria-label="Close"
                    >
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="px-5 py-5 max-h-[70vh] overflow-y-auto">
                    {/* Your Inputs Section */}
                    <div className="mb-6">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3">
                            Your Inputs
                        </h3>
                        <div className="space-y-2.5">
                            <div className="flex items-center justify-between py-2.5 px-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                <span className="text-sm text-slate-600 dark:text-slate-300">Current Age</span>
                                <span className="text-sm font-semibold text-slate-900 dark:text-white">{userAge} years</span>
                            </div>
                            <div className="flex items-center justify-between py-2.5 px-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                <span className="text-sm text-slate-600 dark:text-slate-300">Monthly Expense</span>
                                <span className="text-sm font-semibold text-slate-900 dark:text-white">₹{monthlyExpense.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex items-center justify-between py-2.5 px-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                <span className="text-sm text-slate-600 dark:text-slate-300">Monthly Investment (SIP)</span>
                                <span className="text-sm font-semibold text-slate-900 dark:text-white">₹{monthlyInvestment.toLocaleString('en-IN')}</span>
                            </div>
                        </div>
                    </div>

                    {/* Calculation Parameters Section */}
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3">
                            Calculation Parameters
                        </h3>
                        <div className="space-y-2.5">
                            <div className="flex items-center justify-between py-2.5 px-3.5 bg-gradient-to-r from-blue-50 to-slate-50 dark:from-blue-900/20 dark:to-slate-800/50 rounded-xl border border-blue-100/50 dark:border-blue-800/30">
                                <span className="text-sm text-slate-600 dark:text-slate-300">Max Age ({healthLabels[healthStatus]})</span>
                                <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">{maxAge} years</span>
                            </div>
                            <div className="flex items-center justify-between py-2.5 px-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                <span className="text-sm text-slate-600 dark:text-slate-300">Inflation Rate</span>
                                <span className="text-sm font-semibold text-slate-900 dark:text-white">{INFLATION_RATE}%</span>
                            </div>
                            <div className="flex items-center justify-between py-2.5 px-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                <span className="text-sm text-slate-600 dark:text-slate-300">SIP Return (&lt;{SIP_SHORT_TERM_THRESHOLD} years)</span>
                                <span className="text-sm font-semibold text-slate-900 dark:text-white">{SIP_RETURN_RATE_SHORT_TERM}%</span>
                            </div>
                            <div className="flex items-center justify-between py-2.5 px-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                <span className="text-sm text-slate-600 dark:text-slate-300">SIP Return (≥{SIP_SHORT_TERM_THRESHOLD} years)</span>
                                <span className="text-sm font-semibold text-slate-900 dark:text-white">{SIP_RETURN_RATE_LONG_TERM}%</span>
                            </div>
                            <div className="flex items-center justify-between py-2.5 px-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                <span className="text-sm text-slate-600 dark:text-slate-300">SWP Return Rate</span>
                                <span className="text-sm font-semibold text-slate-900 dark:text-white">{SWP_RETURN_RATE}%</span>
                            </div>
                            <div className="flex items-center justify-between py-2.5 px-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                <span className="text-sm text-slate-600 dark:text-slate-300">LTCG Tax Rate</span>
                                <span className="text-sm font-semibold text-slate-900 dark:text-white">{LTCG_TAX_RATE}%</span>
                            </div>
                            <div className="flex items-center justify-between py-2.5 px-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                <span className="text-sm text-slate-600 dark:text-slate-300">SWP Step-up</span>
                                <span className="text-sm font-semibold text-slate-900 dark:text-white">{SWP_STEP_UP_PERCENTAGE}% / year</span>
                            </div>
                            <div className="flex items-center justify-between py-2.5 px-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                <span className="text-sm text-slate-600 dark:text-slate-300">Lifestyle Buffer</span>
                                <span className="text-sm font-semibold text-slate-900 dark:text-white">{LIFESTYLE_BUFFER * 100}%</span>
                            </div>
                            <div className="flex items-center justify-between py-2.5 px-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                <span className="text-sm text-slate-600 dark:text-slate-300">SWP Sustainability Buffer</span>
                                <span className="text-sm font-semibold text-slate-900 dark:text-white">{SWP_SUSTAINABILITY_BUFFER * 100}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tailwind animation keyframes (inline styles for animation) */}
            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes scale-in {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-fade-in {
                    animation: fade-in 0.2s ease-out forwards;
                }
                .animate-scale-in {
                    animation: scale-in 0.25s ease-out forwards;
                }
            `}</style>
        </div>
    );
});
