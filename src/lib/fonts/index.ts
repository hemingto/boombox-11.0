/**
 * @fileoverview Font optimization with next/font
 * Optimized font loading for better Core Web Vitals (CLS) scores
 */

import { Inter, Poppins } from 'next/font/google';
import localFont from 'next/font/local';

/**
 * Primary font: Inter
 * Used for body text, forms, and general UI
 */
export const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  preload: true,
  weight: ['400', '500', '600', '700'],
  fallback: [
    'ui-sans-serif',
    'system-ui',
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'Roboto',
    'Helvetica Neue',
    'Arial',
    'sans-serif',
  ],
});

/**
 * Secondary font: Poppins  
 * Used for headings and marketing content
 */
export const poppins = Poppins({
  subsets: ['latin'],
  variable: '--font-poppins',
  display: 'swap',
  preload: true,
  weight: ['400', '500', '600', '700', '800'],
  fallback: [
    'ui-sans-serif',
    'system-ui',
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'Roboto',
    'Helvetica Neue',
    'Arial',
    'sans-serif',
  ],
});

/**
 * Monospace font for code blocks (if needed)
 */
export const mono = localFont({
  src: [
    {
      path: '../../../public/fonts/mono-regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../../public/fonts/mono-medium.woff2', 
      weight: '500',
      style: 'normal',
    },
  ],
  variable: '--font-mono',
  display: 'swap',
  fallback: [
    'ui-monospace',
    'SFMono-Regular',
    'Monaco',
    'Consolas',
    'Liberation Mono',
    'Courier New',
    'monospace',
  ],
});

/**
 * Font class names for use in components
 */
export const fontClasses = {
  inter: inter.className,
  poppins: poppins.className,
  mono: mono.className,
} as const;

/**
 * Font variables for use in CSS
 */
export const fontVariables = [
  inter.variable,
  poppins.variable,
  mono.variable,
].join(' ');

/**
 * Font optimization configuration
 */
export const fontConfig = {
  // Preload critical fonts
  preloadFonts: [
    {
      href: '/_next/static/media/inter.woff2',
      as: 'font',
      type: 'font/woff2',
      crossOrigin: 'anonymous',
    },
    {
      href: '/_next/static/media/poppins.woff2', 
      as: 'font',
      type: 'font/woff2',
      crossOrigin: 'anonymous',
    },
  ],
  
  // Font display strategy
  displayStrategy: 'swap' as const,
  
  // Font loading optimization
  optimization: {
    // Use font-display: swap for better CLS
    swap: true,
    // Preload critical fonts
    preload: true,
    // Use variable fonts when available
    variable: true,
  },
} as const;

/**
 * Generate font preload links for head
 */
export function generateFontPreloads() {
  return fontConfig.preloadFonts.map(font => ({
    rel: 'preload',
    href: font.href,
    as: font.as,
    type: font.type,
    crossOrigin: font.crossOrigin,
  }));
}

/**
 * Font utility classes for Tailwind
 */
export const fontUtilities = {
  // Font families
  'font-inter': 'font-family: var(--font-inter), ui-sans-serif, system-ui, sans-serif',
  'font-poppins': 'font-family: var(--font-poppins), ui-sans-serif, system-ui, sans-serif',
  'font-mono': 'font-family: var(--font-mono), ui-monospace, monospace',
  
  // Font optimization
  'font-display-swap': 'font-display: swap',
  'font-smooth': '-webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale',
} as const; 