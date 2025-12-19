import React from 'react';

interface CollapsibleSectionProps {
    title: string;
    isOpen: boolean;
    toggle: () => void;
    isMobile: boolean;
    children: React.ReactNode;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ title, isOpen, toggle, isMobile, children }) => {
    return (
        <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl shadow-md border border-slate-200/60 dark:border-slate-700/60 transition-all duration-300">
            <button
                onClick={toggle}
                className={`w-full flex justify-between items-center px-4 pt-4 pb-1 sm:px-5 sm:pt-5 sm:pb-1 text-left ${!isMobile ? 'cursor-default pointer-events-none' : ''}`}
                aria-expanded={isOpen}
            >
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{title}</h2>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-6 w-6 text-slate-500 dark:text-slate-400 transition-transform duration-300 md:hidden ${isOpen ? 'rotate-180' : ''}`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                >
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
            </button>

            <div
                className={`grid transition-all duration-500 ease-in-out ${isMobile
                    ? (isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0')
                    : 'grid-rows-[1fr] opacity-100'
                    }`}
            >
                <div className="overflow-hidden">
                    <div className="p-4 sm:p-6 pt-0">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CollapsibleSection;