/**
 * ============================================================================
 * Design System for Mutual Fund Calculator & Related Apps
 * ============================================================================
 * This file serves as a single source of truth for the visual design language.
 * Use these constants to ensure consistency when building new components or apps.
 * The design is based on Tailwind CSS classes for direct application in JSX.
 */

// --------------------------
// I. Colors
// --------------------------
export const Palette = {
  // Primary & Neutrals
  background: 'bg-slate-50 dark:bg-slate-950', // Main page background
  text: {
    primary: 'text-slate-800 dark:text-slate-100',
    secondary: 'text-slate-600 dark:text-slate-400',
    muted: 'text-slate-500 dark:text-slate-500',
  },
  border: {
    default: 'border-slate-300 dark:border-slate-700',
    subtle: 'border-slate-200/60 dark:border-slate-800/60',
    interactive: 'border-slate-200/75 dark:border-slate-700/75', // e.g., nested cards
  },

  // Accent Colors
  accent: {
    primary: 'emerald-600 dark:emerald-500', // For interactive elements, links
    primaryStrong: 'emerald-700 dark:emerald-400', // For stronger text highlights
    interactive: 'emerald-500 dark:emerald-500', // For focus borders/rings
    focusRing: 'ring-emerald-500/30',
  },

  // Semantic Colors
  success: {
    text: 'text-emerald-600 dark:text-emerald-400', // For returns, positive values
    textStrong: 'text-emerald-700 dark:text-emerald-300',
  },
  danger: {
    text: 'text-red-600 dark:text-red-400', // For negative values, warnings
  },

  // Gradients
  gradient: {
    heading: 'bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300',
  },

  // Chart Colors
  chart: {
    invested: '#3b82f6', // Blue (for Pie charts, areas)
    returns: '#10b981',  // Emerald
    totalValueArea: '#334155', // Slate
    totalValueLine: '#1e293b', // Dark Slate
    lumpsum: '#8b5cf6', // Violet
    inflation: '#475569', // Slate Gray
    sourceFund: '#4338ca', // Indigo
  }
};

// --------------------------
// II. Typography
// --------------------------
export const Typography = {
  fontFamily: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"`,

  headings: {
    h1: `text-4xl sm:text-5xl font-bold tracking-tight ${Palette.gradient.heading} bg-clip-text text-transparent`,
    h2: 'text-xl font-bold text-slate-800 dark:text-slate-100',
    h3: 'text-lg font-semibold text-slate-700 dark:text-slate-200',
  },

  text: {
    body: 'text-sm text-slate-600 dark:text-slate-400',
    label: 'text-sm font-medium text-slate-600 dark:text-slate-400',
    caption: 'text-xs text-slate-500 dark:text-slate-500',
  },

  values: {
    large: `text-4xl font-extrabold ${Palette.gradient.heading} bg-clip-text text-transparent`,
    medium: 'text-2xl font-bold text-slate-800 dark:text-slate-100',
  }
};

// --------------------------
// III. Layout & Spacing
// --------------------------
export const Layout = {
  container: 'container mx-auto px-4 sm:px-6 lg:px-8',
  mainGrid: 'grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12',
};

// --------------------------
// IV. Components
// --------------------------
export const Components = {
  card: {
    base: 'bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl p-6 sm:p-8 rounded-2xl shadow-md border border-slate-200/60 dark:border-slate-700/60',
    nested: `bg-slate-100/50 dark:bg-slate-900/50 p-4 sm:p-6 rounded-xl border ${Palette.border.subtle}`,
    placeholder: 'flex items-center justify-center h-full w-full bg-slate-100/50 dark:bg-slate-900/50 rounded-lg',
  },

  tabs: {
    container: 'relative bg-slate-200/60 dark:bg-slate-800/60 p-1 rounded-xl flex items-center space-x-1',
    button: 'relative z-10 px-6 py-2 rounded-lg text-sm font-semibold transition-colors duration-300',
    buttonActive: 'text-slate-800 dark:text-slate-100',
    buttonInactive: 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200',
    glider: 'absolute h-[calc(100%-8px)] top-1 bg-white dark:bg-slate-700 rounded-lg shadow-md transition-all duration-300 ease-in-out',
  },

  sliderInput: {
    numericInputWrapper: `flex items-center rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border ${Palette.border.interactive} focus-within:border-${Palette.accent.interactive} focus-within:ring-2 focus-within:${Palette.accent.focusRing}`,
    numericInput: 'w-28 sm:w-32 p-2 text-right font-semibold bg-transparent focus:outline-none text-slate-800 dark:text-slate-100',
    range: `w-full h-2 bg-slate-200/80 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-${Palette.accent.primary}`,
  },

  select: {
    base: `p-2 rounded-md border ${Palette.border.default} focus:border-${Palette.accent.interactive} focus:ring-2 focus:${Palette.accent.focusRing} transition-all duration-200 bg-white/50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100`,
  },

  tooltip: {
    base: 'bg-white/70 dark:bg-slate-800/90 backdrop-blur-lg p-3 border border-slate-200/60 dark:border-slate-700/60 rounded-lg shadow-lg',
  },

  checkbox: {
    base: `h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-${Palette.accent.primary} focus:ring-${Palette.accent.interactive} cursor-pointer bg-white dark:bg-slate-800`,
  },

  footer: {
    text: 'text-center py-6 text-sm text-slate-500 dark:text-slate-500 space-y-2',
    link: `font-semibold text-${Palette.accent.primary} hover:underline`,
  }
};

/**
 * --- How to use this file ---
 * 
 * 1. Import the necessary constants:
 *    import { Palette, Typography, Components } from './design-system';
 * 
 * 2. Apply them in your components:
 *    <div className={Components.card.base}>
 *      <h2 className={Typography.headings.h2}>Card Title</h2>
 *      <p className={Typography.text.body}>
 *        This is some body text with a <a href="#" className={Components.footer.link}>link</a>.
 *      </p>
 *    </div>
 * 
 * 3. For colors in JS (e.g., chart configuration):
 *    const chartOptions = {
 *      colors: [Palette.chart.invested, Palette.chart.returns]
 *    };
 */