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

        // Status colors (main semantic colors for text, borders, rings)
        status: {
          success: 'rgb(16 185 129)', // emerald-500
          warning: 'rgb(245 158 11)', // amber-500
          error: 'rgb(239 68 68)', // red-500
          info: 'rgb(8 145 178)', // cyan-600
          pending: 'rgb(217 119 6)', // amber-600
          processing: 'rgb(8 145 178)', // cyan-600
        },

        // Status background colors (light variants for alerts/badges)
        'status-bg': {
          success: 'rgb(220 252 231)', // emerald-100
          warning: 'rgb(254 243 199)', // amber-100
          error: 'rgb(254 226 226)', // red-100
          info: 'rgb(207 250 254)', // cyan-100
          pending: 'rgb(254 243 199)', // amber-100
          processing: 'rgb(207 250 254)', // cyan-100
        },

        // Surface colors
        surface: {
          primary: 'rgb(255 255 255)', // white
          secondary: 'rgb(226 232 240)', // slate-200
          tertiary: 'rgb(248 250 252)', // slate-50
          disabled: 'rgb(248 250 252)', // slate-50
          pressed: 'rgb(203 213 225)', // slate-300
        },

        // Text colors (semantic)
        text: {
          primary: 'rgb(24 24 27)', // zinc-950
          secondary: 'rgb(161 161 170)', // zinc-400
          tertiary: 'rgb(82, 82, 91)', // zinc-600
          disabled: 'rgb(203 213 225)', // slate-300
          inverse: 'rgb(255 255 255)', // white
        },

        // Border colors
        border: {
          DEFAULT: 'rgb(244 244 245)', // zinc-100
          focus: 'rgb(24 24 27)', // zinc-950
          error: 'rgb(254 226 226)', // red-100
          warning: 'rgb(254 243 199)', // amber-100
          info: 'rgb(207 250 254)', // cyan-100
        },

        // Overlay colors
        overlay: {
          primary: 'rgba(24, 24, 27, 0.5)', // text-primary with 50% opacity
          secondary: 'rgba(24, 24, 27, 0.75)', // text-primary with 75% opacity for stronger overlays
        },

        // Explicit zinc color palette to ensure availability
        zinc: {
          50: '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          400: '#a1a1aa',
          500: '#71717a',
          600: '#52525b',
          700: '#3f3f46',
          800: '#27272a',
          900: '#18181b',
          950: '#09090b',
        },
      },

      boxShadow: {
        'custom-shadow': '0px 6px 20px 0px rgba(0,0,0,0.2)',
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
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '1', transform: 'translateY(0)' },
          '100%': { opacity: '0', transform: 'translateY(-10px)' },
        },
      },
      animation: {
        shimmer: 'shimmer 3s infinite',
        fadeIn: 'fadeIn 0.3s ease-out',
        slideIn: 'slideIn 0.3s ease-out',
        slideDown: 'slideDown 0.3s ease-out',
        slideUp: 'slideUp 0.3s ease-out forwards',
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
