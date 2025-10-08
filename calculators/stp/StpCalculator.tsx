import React from 'react';

interface StpCalculatorProps {
  sipProjectedValue?: number;
}

const StpCalculator: React.FC<StpCalculatorProps> = ({ sipProjectedValue }) => {
    return (
        <div className="px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
              <div className="lg:col-span-2 bg-white/60 backdrop-blur-xl p-6 sm:p-8 rounded-2xl shadow-md border border-slate-200/60 flex items-center justify-center min-h-[500px]">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-slate-700">STP Inputs</h3>
                  <p className="text-slate-500 mt-2">Configuration for STP will be available here soon.</p>
                </div>
              </div>
              <div className="lg:col-span-3 flex flex-col gap-8 lg:gap-12">
                <div className="bg-white/60 backdrop-blur-xl p-6 sm:p-8 rounded-2xl shadow-md h-full border border-slate-200/60 flex flex-col justify-center items-center text-center">
                  <h3 className="text-lg font-semibold text-slate-700">STP Results</h3>
                  <p className="text-slate-500 mt-2">Projected STP metrics will appear here.</p>
                </div>
                <div className="bg-white/60 backdrop-blur-xl py-6 sm:p-8 rounded-2xl shadow-md border border-slate-200/60 text-center">
                  <h2 className="text-xl font-bold text-slate-800 mb-6 px-4 sm:px-0 text-center">Transfer Growth Over Time</h2>
                   <div style={{ width: '100%', height: 400 }} className="flex justify-center items-center">
                    <p className="text-slate-600">The STP chart will be displayed here.</p>
                  </div>
                </div>
              </div>
            </div>
        </div>
    );
};

export default StpCalculator;