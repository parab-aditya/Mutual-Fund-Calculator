import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Routes, Route, Link, useLocation, Navigate, useSearchParams } from 'react-router-dom';
import SipCalculator from './calculators/sip/SipCalculator';
import SwpCalculator from './calculators/swp/SwpCalculator';
import StpCalculator from './calculators/stp/StpCalculator';
import CoastFireCalculator from './calculators/coast-fire/CoastFireCalculator';
import Navigation from './components/Navigation';

// Home page with separate calculators based on URL param
const HomePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  // Default to 'sip' if no param is present
  const activeTab = searchParams.get('tab') || 'sip';

  const [sipProjectedValue, setSipProjectedValue] = useState(0);

  return (
    <main className="container mx-auto pb-6 sm:pb-8">
      <div className={activeTab === 'sip' ? '' : 'hidden'}>
        <SipCalculator onResultsChange={setSipProjectedValue} isActive={activeTab === 'sip'} />
      </div>
      <div className={activeTab === 'swp' ? '' : 'hidden'}>
        <SwpCalculator sipProjectedValue={sipProjectedValue} isActive={activeTab === 'swp'} />
      </div>
      <div className={activeTab === 'stp' ? '' : 'hidden'}>
        <StpCalculator isActive={activeTab === 'stp'} />
      </div>
    </main>
  );
};

// Coast FIRE page
const CoastFirePage: React.FC = () => {
  return (
    <main className="container mx-auto pb-6 sm:pb-8">
      <CoastFireCalculator isActive={true} />
    </main>
  );
};

const App: React.FC = () => {
  // We don't need detailed resize logic here anymore for the old glider

  return (
    <div className="min-h-screen text-slate-800 antialiased">
      <header>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4 text-center">
          <Link to="/sip-calculator">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-700 hover:from-slate-700 hover:to-slate-500 transition-all duration-300">
              Mutual Fund Calculator
            </h1>
          </Link>
        </div>
      </header>

      {/* Unified Navigation */}
      <Navigation />

      <Routes>
        <Route path="/" element={<Navigate to="/sip-calculator" replace />} />
        <Route path="/sip-calculator" element={<HomePage />} />
        <Route path="/sip-calculator/coast-fire" element={<CoastFirePage />} />
        <Route path="*" element={<Navigate to="/sip-calculator" replace />} />
      </Routes>

      <footer className="text-center py-4 text-sm text-slate-500 space-y-2 mt-auto">
        <p>
          Made by{' '}
          <a
            href="https://www.linkedin.com/in/its-aditya-parab/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-emerald-600 hover:underline"
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