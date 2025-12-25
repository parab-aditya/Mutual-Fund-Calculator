import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';

const Navigation: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    // Determine active tab based on URL or defaults
    // If on home page, check param. If param missing, default to 'sip'.
    // If not on home page, no tab is "active" in the calculator sense, unless we want to remember last state.
    // For simplicity, visual active state depends on being on home page + specific tab param.
    const isHomePage = location.pathname === '/' || location.pathname === '/sip-calculator';
    const currentTabParam = searchParams.get('tab');
    const activeTab = isHomePage ? (currentTabParam || 'sip') : null;

    const sipTabRef = useRef<HTMLButtonElement>(null);
    const swpTabRef = useRef<HTMLButtonElement>(null);
    const stpTabRef = useRef<HTMLButtonElement>(null);
    const planForMeRef = useRef<HTMLButtonElement>(null);

    const [gliderStyle, setGliderStyle] = useState({ left: 0, width: 0, opacity: 0 });

    const tabRefs: { [key: string]: React.RefObject<HTMLButtonElement> } = {
        sip: sipTabRef,
        swp: swpTabRef,
        stp: stpTabRef,
    };

    const updateGlider = useCallback(() => {
        if (activeTab && tabRefs[activeTab] && tabRefs[activeTab].current) {
            const currentRef = tabRefs[activeTab].current;
            setGliderStyle({
                left: currentRef?.offsetLeft || 0,
                width: currentRef?.offsetWidth || 0,
                opacity: 1,
            });
        } else {
            setGliderStyle(prev => ({ ...prev, opacity: 0 }));
        }
    }, [activeTab]);

    useEffect(() => {
        let resizeTimeout: ReturnType<typeof setTimeout>;

        const handleResize = () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                setIsMobile(window.innerWidth < 768);
                updateGlider();
            }, 150);
        };

        window.addEventListener('resize', handleResize, { passive: true });
        // Initial update
        updateGlider();
        // Safety check for layout shift
        setTimeout(updateGlider, 100);

        return () => {
            clearTimeout(resizeTimeout);
            window.removeEventListener('resize', handleResize);
        };
    }, [updateGlider]);

    // Re-run glider update when active tab changes
    useEffect(() => {
        updateGlider();
    }, [activeTab, updateGlider]);


    const handleTabClick = (tab: string) => {
        if (isHomePage) {
            navigate(`/sip-calculator?tab=${tab}`);
        } else {
            // If navigating from another page, go to home with that tab selected
            navigate(`/sip-calculator?tab=${tab}`);
        }
    };

    const handlePlanForMeClick = () => {
        navigate('/sip-calculator/plan-for-me');
    };

    return (
        <div className="container mx-auto px-2 sm:px-6 lg:px-8 mb-8">
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/60 dark:border-slate-700/60 shadow-xl shadow-slate-200/40 dark:shadow-slate-900/40 rounded-2xl p-2 flex items-center justify-between sm:grid sm:grid-cols-[1fr_auto_1fr] relative gap-2 sm:gap-4">
                {/* Desktop Left Spacer to balance the grid and center the tabs */}
                <div className="hidden sm:block" aria-hidden="true" />

                {/* Calculator Tabs - Left on mobile, Centered on Desktop */}
                <div className="relative bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-xl flex items-center space-x-1 shrink-0 overflow-x-auto no-scrollbar border border-slate-200/30 dark:border-slate-700/30">
                    <div
                        className="absolute h-[calc(100%-8px)] top-1 bg-white dark:bg-slate-700 rounded-lg shadow-sm border border-slate-100 dark:border-slate-600 transition-all duration-300 ease-in-out"
                        style={{
                            left: gliderStyle.left,
                            width: gliderStyle.width,
                            opacity: gliderStyle.opacity,
                        }}
                    />
                    <button
                        ref={sipTabRef}
                        onClick={() => handleTabClick('sip')}
                        className={`relative z-10 px-3 sm:px-6 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors duration-300 whitespace-nowrap ${activeTab === 'sip' ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                            }`}
                    >
                        {isMobile ? 'SIP' : 'SIP Calculator'}
                    </button>
                    <button
                        ref={swpTabRef}
                        onClick={() => handleTabClick('swp')}
                        className={`relative z-10 px-3 sm:px-6 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors duration-300 whitespace-nowrap ${activeTab === 'swp' ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                            }`}
                    >
                        {isMobile ? 'SWP' : 'SWP Calculator'}
                    </button>
                    <button
                        ref={stpTabRef}
                        onClick={() => handleTabClick('stp')}
                        className={`relative z-10 px-3 sm:px-6 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors duration-300 whitespace-nowrap ${activeTab === 'stp' ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                            }`}
                    >
                        {isMobile ? 'STP' : 'STP Calculator'}
                    </button>
                </div>

                {/* AI Planner Button - Siri-inspired design */}
                <button
                    onClick={handlePlanForMeClick}
                    className={`group shrink-0 px-3 sm:px-5 py-2 sm:py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all duration-300 flex items-center gap-2 sm:gap-3 sm:justify-self-end overflow-hidden
            ${location.pathname === '/sip-calculator/plan-for-me'
                            ? 'bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 text-white shadow-lg shadow-fuchsia-500/30 dark:shadow-fuchsia-500/20 scale-[1.02]'
                            : 'bg-gradient-to-r from-violet-500/10 via-fuchsia-500/10 to-pink-500/10 dark:from-violet-500/20 dark:via-fuchsia-500/20 dark:to-pink-500/20 text-violet-700 dark:text-violet-300 border border-violet-200/60 dark:border-violet-700/60 hover:from-violet-500 hover:via-fuchsia-500 hover:to-pink-500 hover:text-white hover:border-transparent hover:shadow-lg hover:shadow-fuchsia-500/25 hover:scale-[1.02]'
                        }`}
                >
                    {/* Siri-like AI orb icon */}
                    <div className={`relative w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center transition-all duration-300
                        ${location.pathname === '/sip-calculator/plan-for-me'
                            ? 'bg-white/25'
                            : 'bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 group-hover:bg-white/25'
                        }`}
                    >
                        {/* Animated pulse ring */}
                        <div className={`absolute inset-0 rounded-full animate-ping opacity-40
                            ${location.pathname === '/sip-calculator/plan-for-me'
                                ? 'bg-white/30'
                                : 'bg-gradient-to-br from-violet-400 via-fuchsia-400 to-pink-400 group-hover:bg-white/30'
                            }`}
                            style={{ animationDuration: '2s' }}
                        />
                        {/* AI sparkle icon */}
                        <svg
                            className={`w-3 h-3 sm:w-3.5 sm:h-3.5 relative z-10 transition-colors duration-300
                                ${location.pathname === '/sip-calculator/plan-for-me'
                                    ? 'text-white'
                                    : 'text-white group-hover:text-white'
                                }`}
                            fill="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path d="M12 2L13.09 8.26L19 7L14.74 11.09L21 14L14.74 12.91L13.09 19L12 12.74L5 14L10.26 11.09L4 8L10.26 9.09L12 2Z" />
                        </svg>
                    </div>
                    <span className="whitespace-nowrap font-bold tracking-tight">AI Planner</span>
                </button>
            </div>
        </div>
    );
};

export default Navigation;
