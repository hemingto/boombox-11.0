import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        inter: ['var(--font-inter)'],
        poppins: ['var(--font-poppins)'],
      },
      colors: {
        // Payment provider colors (existing)
        amex: '#2E77BC',
        discover: '#4B2C69',
        jcb: '#0E4C92',
        visa: '#1A1F71',
        applepay: '#000000',
        amazonpay: '#FF9900',

        // Boombox brand colors (semantic aliases)
        primary: {
          DEFAULT: 'rgb(24 24 27)', // zinc-950 - main brand color
          hover: 'rgb(39 39 42)', // zinc-800 - hover state
          active: 'rgb(63 63 70)', // zinc-700 - active state
        },

        // Status colors (semantic system)
        status: {
          success: 'rgb(34 197 94)', // green-500
          warning: 'rgb(245 158 11)', // amber-500
          error: 'rgb(239 68 68)', // red-500
          info: 'rgb(59 130 246)', // blue-500
          pending: 'rgb(245 158 11)', // amber-500
          processing: 'rgb(59 130 246)', // blue-500
        },

        // Status background colors (light variants for badges)
        'status-bg': {
          success: 'rgb(220 252 231)', // emerald-100
          warning: 'rgb(254 243 199)', // amber-100
          error: 'rgb(254 226 226)', // red-100
          info: 'rgb(219 234 254)', // blue-100
          pending: 'rgb(254 243 199)', // amber-100
          processing: 'rgb(219 234 254)', // blue-100
        },

        // Status text colors (dark variants for badges)
        'status-text': {
          success: 'rgb(6 95 70)', // emerald-800
          warning: 'rgb(146 64 14)', // amber-800
          error: 'rgb(153 27 27)', // red-800
          info: 'rgb(30 64 175)', // blue-800
          pending: 'rgb(146 64 14)', // amber-800
          processing: 'rgb(30 64 175)', // blue-800
        },

        // Surface colors
        surface: {
          primary: 'rgb(255 255 255)', // white
          secondary: 'rgb(248 250 252)', // slate-50
          tertiary: 'rgb(241 245 249)', // slate-100
          disabled: 'rgb(226 232 240)', // slate-200
        },

        // Text colors (semantic)
        text: {
          primary: 'rgb(24 24 27)', // zinc-950
          secondary: 'rgb(161 161 170)', // zinc-400
          tertiary: 'rgb(113 113 122)', // zinc-500
          inverse: 'rgb(255 255 255)', // white
        },

        // Border colors
        border: {
          DEFAULT: 'rgb(228 228 231)', // zinc-200
          focus: 'rgb(24 24 27)', // zinc-950
          error: 'rgb(239 68 68)', // red-500
        },
      },

      boxShadow: {
        'custom-shadow': '0px 6px 20px 0px rgba(0,0,0,0.2)',
        card: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)', // shadow-md
        elevated:
          '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', // shadow-lg
      },

      // Animation system for loading states
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
      animation: {
        shimmer: 'shimmer 3s infinite',
        fadeIn: 'fadeIn 0.3s ease-out',
        slideIn: 'slideIn 0.3s ease-out',
      },

      backgroundImage: {
        shimmer:
          'linear-gradient(90deg, #f8fafc 25%, #e2e8f0 50%, #f8fafc 75%)', // Tailwind slate-100, slate-200, slate-100
      },
      backgroundSize: {
        shimmer: '200% 100%',
      },

      // Spacing scale extensions (if needed for specific Boombox patterns)
      spacing: {
        '18': '4.5rem', // 72px - commonly used in boombox-10.0
      },

      // Typography scale extensions
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.75rem' }], // 10px
      },
    },
  },
  plugins: [],
};

export default config;
