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
        amex: '#2E77BC',
        discover: '#4B2C69',
        jcb: '#0E4C92',
        visa: '#1A1F71',
        applepay: '#000000',
        amazonpay: '#FF9900',
      },
      boxShadow: {
        'custom-shadow': '0px 6px 20px 0px rgba(0,0,0,0.2)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
      },
      animation: {
        shimmer: 'shimmer 3s infinite',
      },
      backgroundImage: {
        shimmer:
          'linear-gradient(90deg, #f8fafc 25%, #e2e8f0 50%, #f8fafc 75%)', // Tailwind slate-100, slate-200, slate-100
      },
      backgroundSize: {
        shimmer: '200% 100%',
      },
    },
  },
  plugins: [],
};

export default config;
