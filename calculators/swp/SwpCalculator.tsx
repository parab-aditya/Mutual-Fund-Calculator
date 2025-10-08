import React, { useState, useEffect } from 'react';
import SliderInput from '../../components/SliderInput';
import { useSwpCalculator } from './useSwpCalculator';
import SwpResultsCard from '../../components/SwpResultsCard';

interface SwpCalculatorProps {
    sipProjectedValue?: number;
}

const SwpCalculator: React.FC<SwpCalculatorProps> = ({ sipProjectedValue }) => {
    const [totalInvestment, setTotalInvestment] = useState<number>(1000000);
    const [withdrawalPerMonth, setWithdrawalPerMonth] = useState<number>(8000);
    const [expectedReturnRate, setExpectedReturnRate] = useState<number>(8);
    const [timePeriod, setTimePeriod] = useState<number>(20);
    const [syncWithSip, setSyncWithSip] = useState(false);

    useEffect(() => {
        if (syncWithSip && sipProjectedValue && sipProjectedValue > 0) {
            setTotalInvestment(sipProjectedValue);
        }
    }, [sipProjectedValue, syncWithSip]);

    const { results } = useSwpCalculator({
        totalInvestment,
        withdrawalPerMonth,
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
        <div className="px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
              <div className="lg:col-span-2 bg-white/60 backdrop-blur-xl p-6 sm:p-8 rounded-2xl shadow-md border border-slate-200/60">
                 <div className="space-y-8">
                    <h3 className="text-lg font-semibold text-slate-800 -mb-2">
                      SWP Configuration
                    </h3>
                    <div>
                        <SliderInput
                            label="Total Investment"
                            value={totalInvestment}
                            onChange={handleTotalInvestmentChange}
                            min={100000}
                            max={100000000}
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
                                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                        </div>
                    </div>
                     <SliderInput
                        label="Withdrawal per Month"
                        value={withdrawalPerMonth}
                        onChange={setWithdrawalPerMonth}
                        min={1000}
                        max={1000000}
                        step={1000}
                        unit="₹"
                    />
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
              <div className="lg:col-span-3 flex flex-col gap-8 lg:gap-12">
                <SwpResultsCard
                  totalInvestment={results.totalInvestment}
                  totalWithdrawal={results.totalWithdrawal}
                  finalValue={results.finalValue}
                  numberOfWithdrawals={results.numberOfWithdrawals}
                />
                <div className="bg-white/60 backdrop-blur-xl py-6 sm:p-8 rounded-2xl shadow-md border border-slate-200/60 text-center">
                  <h2 className="text-xl font-bold text-slate-800 mb-6 px-4 sm:px-0 text-center">Withdrawal Growth Over Time</h2>
                   <div style={{ width: '100%', height: 400 }} className="flex justify-center items-center">
                    <p className="text-slate-600">The SWP chart will be displayed here.</p>
                  </div>
                </div>
              </div>
            </div>
        </div>
    );
};

export default SwpCalculator;
