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
  background: 'bg-slate-50', // Main page background
  text: {
    primary: 'text-slate-800',
    secondary: 'text-slate-600',
    muted: 'text-slate-500',
  },
  border: {
    default: 'border-slate-300',
    subtle: 'border-slate-200/60',
  },

  // Accent Colors
  accent: {
    primary: 'indigo-600', // For interactive elements, links
    focusRing: 'ring-indigo-500/20',
  },

  // Semantic Colors
  success: {
    text: 'text-emerald-600', // For returns, positive values
    textStrong: 'text-emerald-700',
  },
  danger: {
    text: 'text-red-600', // For negative values, warnings
  },

  // Gradients
  gradient: {
    heading: 'bg-gradient-to-r from-slate-900 to-slate-700',
  },

  // Chart Colors
  chart: {
    invested: '#4338ca', // Deep Indigo
    returns: '#10b981',  // Emerald
    totalValueArea: '#334155', // Slate
    totalValueLine: '#1e293b', // Dark Slate
    lumpsum: '#8b5cf6', // Violet
    inflation: '#475569', // Slate Gray
  }
};

// --------------------------
// II. Typography
// --------------------------
export const Typography = {
  fontFamily: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"`,
  
  headings: {
    h1: `text-4xl sm:text-5xl font-bold tracking-tight ${Palette.gradient.heading} bg-clip-text text-transparent`,
    h2: 'text-xl font-bold text-slate-800',
    h3: 'text-lg font-semibold text-slate-700',
  },

  text: {
    body: 'text-sm text-slate-600',
    label: 'text-sm font-medium text-slate-600',
    caption: 'text-xs text-slate-500',
  },

  values: {
    large: `text-4xl font-extrabold ${Palette.gradient.heading} bg-clip-text text-transparent`,
    medium: 'text-2xl font-bold text-slate-800',
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
    base: 'bg-white/60 backdrop-blur-xl p-6 sm:p-8 rounded-2xl shadow-md border border-slate-200/60',
  },

  tabs: {
    container: 'relative bg-slate-200/60 p-1 rounded-xl flex items-center space-x-1',
    button: 'relative z-10 px-6 py-2 rounded-lg text-sm font-semibold transition-colors duration-300',
    buttonActive: 'text-slate-800',
    buttonInactive: 'text-slate-500 hover:text-slate-700',
    glider: 'absolute h-[calc(100%-8px)] top-1 bg-white rounded-lg shadow-md transition-all duration-300 ease-in-out',
  },

  sliderInput: {
    numericInputWrapper: `flex items-center rounded-md border ${Palette.border.default} focus-within:border-${Palette.accent.primary} focus-within:ring-2 focus-within:${Palette.accent.focusRing}`,
    numericInput: 'w-28 sm:w-32 p-2 text-right font-semibold bg-transparent focus:outline-none',
    range: `w-full h-2 bg-slate-200/80 rounded-lg appearance-none cursor-pointer accent-${Palette.accent.primary}`,
  },
  
  tooltip: {
    base: 'bg-white/70 backdrop-blur-lg p-3 border border-slate-200/60 rounded-lg shadow-lg',
  },

  checkbox: {
    base: `h-4 w-4 rounded border-slate-300 text-${Palette.accent.primary} focus:ring-indigo-500 cursor-pointer`,
  },

  footer: {
    text: 'text-center py-6 text-sm text-slate-500 space-y-2',
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
