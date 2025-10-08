import React, { useState } from 'react';
import SliderInput from '../../components/SliderInput';
import { useStpCalculator } from './useStpCalculator';
import { TransferFrequency } from './types';
import StpResultsCard from '../../components/StpResultsCard';
import StpGrowthChart from '../../components/StpGrowthChart';

const StpCalculator: React.FC = () => {
    const [investmentAmount, setInvestmentAmount] = useState<number>(1000000);
    const [sourceReturnRate, setSourceReturnRate] = useState<number>(8);
    const [transferAmount, setTransferAmount] = useState<number>(10000);
    const [transferFrequency, setTransferFrequency] = useState<TransferFrequency>('Monthly');
    const [timePeriod, setTimePeriod] = useState<number>(10);
    const [destinationReturnRate, setDestinationReturnRate] = useState<number>(12);

    const { results, growthData } = useStpCalculator({
        investmentAmount,
        sourceReturnRate,
        transferAmount,
        transferFrequency,
        timePeriod,
        destinationReturnRate,
    });

    return (
        <div className="px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
              <div className="lg:col-span-2 bg-white/60 backdrop-blur-xl p-6 sm:p-8 rounded-2xl shadow-md border border-slate-200/60">
                <div className="space-y-4">
                    {/* Source Fund Card */}
                    <div className="bg-slate-100/50 border border-slate-200/60 rounded-2xl p-6 space-y-6">
                        <div className="space-y-1">
                            <h3 className="text-lg font-semibold text-slate-800">Source Fund</h3>
                            <p className="text-sm text-slate-500">Where the money comes from.</p>
                        </div>
                        <SliderInput
                            label="Initial Investment Amount"
                            value={investmentAmount}
                            onChange={setInvestmentAmount}
                            min={1000}
                            max={50000000}
                            step={1000}
                            unit="₹"
                        />
                        <SliderInput
                            label="Expected Return Rate (p.a.)"
                            value={sourceReturnRate}
                            onChange={setSourceReturnRate}
                            min={1}
                            max={30}
                            step={0.1}
                            unit="%"
                        />
                    </div>

                    {/* Arrow Divider */}
                    <div className="flex justify-center py-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                    </div>

                    {/* Destination Fund & Transfer Plan Card */}
                    <div className="bg-slate-100/50 border border-slate-200/60 rounded-2xl p-6 space-y-6">
                        <div className="space-y-1">
                             <h3 className="text-lg font-semibold text-slate-800">Destination & Transfer Plan</h3>
                            <p className="text-sm text-slate-500">Where the money is moved to.</p>
                        </div>
                        <SliderInput
                            label="Amount per Transfer"
                            value={transferAmount}
                            onChange={setTransferAmount}
                            min={1000}
                            max={50000000}
                            step={1000}
                            unit="₹"
                        />
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-medium text-slate-600">Transfer Frequency</label>
                            <select
                                value={transferFrequency}
                                onChange={(e) => setTransferFrequency(e.target.value as TransferFrequency)}
                                className="w-36 p-2 rounded-md border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 bg-white/50"
                            >
                                <option>Monthly</option>
                                <option>Weekly</option>
                                <option>15-days</option>
                                <option>Quarterly</option>
                                <option>Yearly</option>
                            </select>
                        </div>
                        <SliderInput
                            label="Transfer Duration"
                            value={timePeriod}
                            onChange={setTimePeriod}
                            min={1}
                            max={40}
                            step={1}
                            unit="Yr"
                        />
                        <SliderInput
                            label="Expected Return Rate (p.a.)"
                            value={destinationReturnRate}
                            onChange={setDestinationReturnRate}
                            min={1}
                            max={30}
                            step={0.1}
                            unit="%"
                        />
                    </div>
                </div>
              </div>
              
              <div className="lg:col-span-3 flex flex-col gap-8 lg:gap-12">
                <StpResultsCard
                  investedAmount={results.investedAmount}
                  sourceFundValue={results.sourceFundValue}
                  destinationFundValue={results.destinationFundValue}
                  totalValue={results.totalValue}
                />
                <StpGrowthChart data={growthData} />
              </div>
            </div>
        </div>
    );
};

export default StpCalculator;