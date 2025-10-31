import React, { useState, useEffect } from 'react';
import SliderInput from '../../components/SliderInput';
import { useSwpCalculator } from './useSwpCalculator';
import SwpResultsCard from '../../components/SwpResultsCard';
import SwpGrowthChart from '../../components/SwpGrowthChart';

interface SwpCalculatorProps {
    sipProjectedValue?: number;
    isActive: boolean;
}

const SwpCalculator: React.FC<SwpCalculatorProps> = ({ sipProjectedValue, isActive }) => {
    const [totalInvestment, setTotalInvestment] = useState<number>(1000000);
    const [withdrawalPerMonth, setWithdrawalPerMonth] = useState<number>(8000);
    const [withdrawalStepUpPercentage, setWithdrawalStepUpPercentage] = useState<number>(7);
    const [isStepUpEnabled, setIsStepUpEnabled] = useState<boolean>(false);
    const [expectedReturnRate, setExpectedReturnRate] = useState<number>(8);
    const [timePeriod, setTimePeriod] = useState<number>(20);
    const [syncWithSip, setSyncWithSip] = useState(false);

    useEffect(() => {
        if (syncWithSip && sipProjectedValue && sipProjectedValue > 0) {
            setTotalInvestment(sipProjectedValue);
        }
    }, [sipProjectedValue, syncWithSip]);

    const { results, growthData } = useSwpCalculator({
        totalInvestment,
        withdrawalPerMonth,
        withdrawalStepUpPercentage: isStepUpEnabled ? withdrawalStepUpPercentage : 0,
        expectedReturnRate,
        timePeriod,
    });
    
    const handleTotalInvestmentChange = (value: number) => {
        setSyncWithSip(false);
        setTotalInvestment(value);
    };

    const handleSyncToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
        const isChecked = e.target.checked;
        setSyncWithSip(isChecked);
        if (isChecked && sipProjectedValue && sipProjectedValue > 0) {
            setTotalInvestment(sipProjectedValue);
        }
    };

    return (
        <div className="px-2 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
              <div className="lg:col-span-2 bg-white/60 backdrop-blur-xl p-4 sm:p-6 rounded-2xl shadow-md border border-slate-200/60">
                 <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-slate-800 -mb-1">
                      SWP Configuration
                    </h3>
                    <div>
                        <SliderInput
                            label="Total Investment"
                            value={totalInvestment}
                            onChange={handleTotalInvestmentChange}
                            min={100000}
                            max={50000000}
                            step={100000}
                            unit="₹"
                        />
                        <div className="flex items-center justify-end pt-4">
                            <label htmlFor="syncSwpInvestment" className="mr-2 text-xs font-medium text-slate-600 cursor-pointer">
                                Use SIP Projected Value
                            </label>
                            <input
                                type="checkbox"
                                id="syncSwpInvestment"
                                checked={syncWithSip}
                                onChange={handleSyncToggle}
                                disabled={!sipProjectedValue || sipProjectedValue <= 0}
                                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                        </div>
                    </div>
                     <div>
                        <SliderInput
                            label="Withdrawal per Month"
                            value={withdrawalPerMonth}
                            onChange={setWithdrawalPerMonth}
                            min={1000}
                            max={1000000}
                            step={1000}
                            unit="₹"
                        />
                         <div className="flex items-center justify-end pt-4">
                            <label htmlFor="enableSwpStepUp" className="mr-2 text-xs font-medium text-slate-600 cursor-pointer">
                                Annual Step-up
                            </label>
                            <input
                                type="checkbox"
                                id="enableSwpStepUp"
                                checked={isStepUpEnabled}
                                onChange={(e) => setIsStepUpEnabled(e.target.checked)}
                                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                            />
                        </div>
                    </div>
                    {isStepUpEnabled && (
                        <div className="pl-4 border-l-2 border-slate-200/75">
                             <SliderInput
                                label="Withdrawal Step-up (p.a.)"
                                value={withdrawalStepUpPercentage}
                                onChange={setWithdrawalStepUpPercentage}
                                min={1}
                                max={20}
                                step={1}
                                unit="%"
                            />
                        </div>
                    )}
                    <SliderInput
                        label="Expected Return Rate (p.a.)"
                        value={expectedReturnRate}
                        onChange={setExpectedReturnRate}
                        min={1}
                        max={30}
                        step={0.1}
                        unit="%"
                    />
                    <SliderInput
                        label="Time Period"
                        value={timePeriod}
                        onChange={setTimePeriod}
                        min={1}
                        max={40}
                        step={1}
                        unit="Yr"
                    />
                 </div>
              </div>
              <div className="lg:col-span-3 flex flex-col gap-6 lg:gap-8">
                <SwpResultsCard
                  totalInvestment={results.totalInvestment}
                  totalWithdrawal={results.totalWithdrawal}
                  finalValue={results.finalValue}
                  numberOfWithdrawals={results.numberOfWithdrawals}
                  isActive={isActive}
                />
                <div className="bg-white/60 backdrop-blur-xl p-4 sm:p-6 rounded-2xl shadow-md border border-slate-200/60">
                  <h2 className="text-xl font-bold text-slate-800 mb-4 px-4 sm:px-0 text-center">Withdrawal & Balance Over Time</h2>
                   <SwpGrowthChart data={growthData} isActive={isActive} />
                </div>
              </div>
            </div>
        </div>
    );
};

export default SwpCalculator;