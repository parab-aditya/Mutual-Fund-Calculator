import React from 'react';
import { useTheme } from '../utils/ThemeContext';

const DarkModeToggle: React.FC = () => {
    const { isDark, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="fixed top-4 right-4 z-50 group"
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
            <div className="relative w-14 h-7 sm:w-16 sm:h-8 rounded-full bg-slate-200/80 dark:bg-slate-700/80 backdrop-blur-md border border-slate-300/50 dark:border-slate-600/50 shadow-lg transition-colors duration-300 overflow-hidden">
                {/* Track background gradient */}
                <div className={`absolute inset-0 transition-opacity duration-500 ${isDark ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/30 via-purple-900/20 to-slate-800/30" />
                    {/* Stars for dark mode */}
                    <div className="absolute top-1.5 left-2 w-0.5 h-0.5 bg-white/60 rounded-full animate-pulse" />
                    <div className="absolute top-3 left-4 w-0.5 h-0.5 bg-white/40 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
                    <div className="absolute bottom-2 left-3 w-0.5 h-0.5 bg-white/50 rounded-full animate-pulse" style={{ animationDelay: '0.25s' }} />
                </div>

                <div className={`absolute inset-0 transition-opacity duration-500 ${isDark ? 'opacity-0' : 'opacity-100'}`}>
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-100/50 via-yellow-50/30 to-sky-100/50" />
                </div>

                {/* Toggle circle with icon */}
                <div
                    className={`absolute top-0.5 w-6 h-6 sm:w-7 sm:h-7 rounded-full shadow-md flex items-center justify-center transition-all duration-300 ease-out transform
            ${isDark
                            ? 'translate-x-7 sm:translate-x-8 bg-slate-800 shadow-indigo-500/20'
                            : 'translate-x-0.5 bg-white shadow-amber-500/20'
                        }
          `}
                >
                    {/* Sun icon */}
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-all duration-300 absolute
              ${isDark ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'}
              text-amber-500
            `}
                    >
                        <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
                    </svg>

                    {/* Moon icon */}
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-all duration-300 absolute
              ${isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'}
              text-indigo-300
            `}
                    >
                        <path fillRule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z" clipRule="evenodd" />
                    </svg>
                </div>
            </div>

            {/* Hover tooltip */}
            <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 text-xs font-medium bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none shadow-lg">
                {isDark ? 'Light mode' : 'Dark mode'}
            </span>
        </button>
    );
};

export default DarkModeToggle;
