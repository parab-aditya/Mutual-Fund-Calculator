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

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 mb-8">
            <div className="flex flex-col sm:flex-row items-center sm:justify-center relative relative-container gap-4">
                {/* Calculator Tabs */}
                <div className="relative bg-slate-200/60 p-1 rounded-xl flex items-center space-x-1 shrink-0">
                    <div
                        className="absolute h-[calc(100%-8px)] top-1 bg-white rounded-lg shadow-md transition-all duration-300 ease-in-out"
                        style={{
                            left: gliderStyle.left,
                            width: gliderStyle.width,
                            opacity: gliderStyle.opacity,
                        }}
                    />
                    <button
                        ref={sipTabRef}
                        onClick={() => handleTabClick('sip')}
                        className={`relative z-10 px-4 sm:px-6 py-2 rounded-lg text-sm font-semibold transition-colors duration-300 ${activeTab === 'sip' ? 'text-slate-800' : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        {isMobile ? 'SIP' : 'SIP Calculator'}
                    </button>
                    <button
                        ref={swpTabRef}
                        onClick={() => handleTabClick('swp')}
                        className={`relative z-10 px-4 sm:px-6 py-2 rounded-lg text-sm font-semibold transition-colors duration-300 ${activeTab === 'swp' ? 'text-slate-800' : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        {isMobile ? 'SWP' : 'SWP Calculator'}
                    </button>
                    <button
                        ref={stpTabRef}
                        onClick={() => handleTabClick('stp')}
                        className={`relative z-10 px-4 sm:px-6 py-2 rounded-lg text-sm font-semibold transition-colors duration-300 ${activeTab === 'stp' ? 'text-slate-800' : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        {isMobile ? 'STP' : 'STP Calculator'}
                    </button>
                </div>

                {/* Coast Fire Button - Right aligned on desktop, stacked on mobile but with gap */}
                <div className="flex-grow hidden sm:block"></div> {/* Spacer for desktop */}

                <button
                    onClick={() => navigate('/sip-calculator/coast-fire')}
                    className={`shrink-0 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center gap-2 shadow-sm self-end sm:self-auto
            ${location.pathname.includes('coast-fire')
                            ? 'bg-rose-100 text-rose-700 ring-2 ring-rose-200 shadow-inner'
                            : 'bg-white text-slate-600 hover:text-slate-900 hover:shadow-md border border-slate-200/60'
                        }`}
                >
                    <span>Coast Fire</span>
                    <span className="text-lg">🔥</span>
                </button>
            </div>
        </div>
    );
};

export default Navigation;
