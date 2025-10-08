import React, { useState, useEffect } from 'react';
import SipCalculator from './calculators/sip/SipCalculator';
import SwpCalculator from './calculators/swp/SwpCalculator';
import StpCalculator from './calculators/stp/StpCalculator';


const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'sip' | 'swp' | 'stp'>('sip');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen text-slate-800 antialiased">
       <header>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-700">
            Mutual Fund Calculator
          </h1>
          <p className="text-slate-500 mt-3 text-lg max-w-2xl mx-auto">
            Plan your investments with precision and visualize your wealth creation journey.
          </p>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex justify-center mb-8">
        <div className="bg-slate-200/60 p-1 rounded-xl flex items-center space-x-1">
          <button
            onClick={() => setActiveTab('sip')}
            className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
              activeTab === 'sip'
                ? 'bg-white shadow-md text-slate-800'
                : 'text-slate-500 hover:bg-slate-300/50'
            }`}
          >
            {isMobile ? 'SIP' : 'SIP Calculator'}
          </button>
          <button
            onClick={() => setActiveTab('swp')}
            className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
              activeTab === 'swp'
                ? 'bg-white shadow-md text-slate-800'
                : 'text-slate-500 hover:bg-slate-300/50'
            }`}
          >
            {isMobile ? 'SWP' : 'SWP Calculator'}
          </button>
           <button
            onClick={() => setActiveTab('stp')}
            className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
              activeTab === 'stp'
                ? 'bg-white shadow-md text-slate-800'
                : 'text-slate-500 hover:bg-slate-300/50'
            }`}
          >
            {isMobile ? 'STP' : 'STP Calculator'}
          </button>
        </div>
      </div>

      <main className="container mx-auto pb-8 sm:pb-12">
        {activeTab === 'sip' && <SipCalculator />}
        {activeTab === 'swp' && <SwpCalculator />}
        {activeTab === 'stp' && <StpCalculator />}
      </main>
      <footer className="text-center py-6 text-sm text-slate-500 space-y-2">
        <p>
          Made by{' '}
          <a
            href="https://www.linkedin.com/in/its-aditya-parab/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-indigo-600 hover:underline"
          >
            Aditya Parab
          </a>
        </p>
        <p>Disclaimer: The calculations are for illustrative purposes only.</p>
      </footer>
    </div>
  );
};

export default App;
