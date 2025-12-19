import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface ThemeContextType {
    isDark: boolean;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'theme-preference';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isDark, setIsDark] = useState<boolean>(() => {
        // Check localStorage first
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored !== null) {
                return stored === 'dark';
            }
            // Fall back to system preference
            return window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
        return false;
    });

    // Apply theme to document
    useEffect(() => {
        const root = document.documentElement;
        if (isDark) {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }

        // Update theme-color meta tag for mobile browsers and PWA
        // Using Slate 950 (#020617) for dark mode and Slate 50 (#f8fafc) for light mode
        let themeMeta = document.querySelector('meta[name="theme-color"]');
        if (!themeMeta) {
            themeMeta = document.createElement('meta');
            themeMeta.setAttribute('name', 'theme-color');
            document.head.appendChild(themeMeta);
        }
        themeMeta.setAttribute('content', isDark ? '#020617' : '#f8fafc');
    }, [isDark]);

    // Listen for system theme changes (only if no stored preference)
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const handleChange = (e: MediaQueryListEvent) => {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored === null) {
                setIsDark(e.matches);
            }
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    const toggleTheme = useCallback(() => {
        setIsDark(prev => {
            const newValue = !prev;
            localStorage.setItem(STORAGE_KEY, newValue ? 'dark' : 'light');
            return newValue;
        });
    }, []);

    return (
        <ThemeContext.Provider value={{ isDark, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = (): ThemeContextType => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

export default ThemeContext;
