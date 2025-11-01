
import React, { useState, useEffect, useRef, useCallback } from 'react';
import SipCalculator from './calculators/sip/SipCalculator';
import SwpCalculator from './calculators/swp/SwpCalculator';
import StpCalculator from './calculators/stp/StpCalculator';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'sip' | 'swp' | 'stp'>('sip');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [sipProjectedValue, setSipProjectedValue] = useState(0);

  const sipTabRef = useRef<HTMLButtonElement>(null);
  const swpTabRef = useRef<HTMLButtonElement>(null);
  const stpTabRef = useRef<HTMLButtonElement>(null);

  const [gliderStyle, setGliderStyle] = useState({ left: 0, width: 0 });

  const tabRefs = {
    sip: sipTabRef,
    swp: swpTabRef,
    stp: stpTabRef,
  };

  const updateGlider = useCallback(() => {
    const activeTabRef = tabRefs[activeTab];
    if (activeTabRef.current) {
      setGliderStyle({
        left: activeTabRef.current.offsetLeft,
        width: activeTabRef.current.offsetWidth,
      });
    }
  }, [activeTab]);

  useEffect(() => {
    // FIX: Replaced NodeJS.Timeout with ReturnType<typeof setTimeout> for browser compatibility.
    let resizeTimeout: ReturnType<typeof setTimeout>;
    
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        setIsMobile(window.innerWidth < 768);
      }, 150);
    };
    
    window.addEventListener('resize', handleResize, { passive: true });
    handleResize();
    return () => {
      clearTimeout(resizeTimeout);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    // Use requestAnimationFrame for smooth glider updates
    const rafId = requestAnimationFrame(() => {
      updateGlider();
    });

    // FIX: Replaced NodeJS.Timeout with ReturnType<typeof setTimeout> for browser compatibility.
    let resizeTimeout: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(updateGlider, 150);
    };

    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(resizeTimeout);
      window.removeEventListener('resize', handleResize);
    };
  }, [activeTab, isMobile, updateGlider]);

  return (
    <div className="min-h-screen text-slate-800 antialiased">
      <header>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-700">
            Mutual Fund Calculator
          </h1>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex justify-center mb-8">
        <div className="relative bg-slate-200/60 p-1 rounded-xl flex items-center space-x-1">
          <div
            className="absolute h-[calc(100%-8px)] top-1 bg-white rounded-lg shadow-md transition-all duration-300 ease-in-out"
            style={gliderStyle}
          />
          <button
            ref={sipTabRef}
            onClick={() => setActiveTab('sip')}
            className={`relative z-10 px-6 py-2 rounded-lg text-sm font-semibold transition-colors duration-300 ${
              activeTab === 'sip' ? 'text-slate-800' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {isMobile ? 'SIP' : 'SIP Calculator'}
          </button>
          <button
            ref={swpTabRef}
            onClick={() => setActiveTab('swp')}
            className={`relative z-10 px-6 py-2 rounded-lg text-sm font-semibold transition-colors duration-300 ${
              activeTab === 'swp' ? 'text-slate-800' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {isMobile ? 'SWP' : 'SWP Calculator'}
          </button>
          <button
            ref={stpTabRef}
            onClick={() => setActiveTab('stp')}
            className={`relative z-10 px-6 py-2 rounded-lg text-sm font-semibold transition-colors duration-300 ${
              activeTab === 'stp' ? 'text-slate-800' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {isMobile ? 'STP' : 'STP Calculator'}
          </button>
        </div>
      </div>

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
      <footer className="text-center py-4 text-sm text-slate-500 space-y-2">
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