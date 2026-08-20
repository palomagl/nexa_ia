/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        nexa: {
          50: '#f5f0ff',
          100: '#ede4ff',
          200: '#dcc8ff',
          300: '#c4a3ff',
          400: '#a875ff',
          500: '#9333ea',
          600: '#7e22ce',
          700: '#671fb0',
          800: '#551d8f',
          900: '#3b1666',
          950: '#250e45',
        },
        violet: {
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
        },
        bg: {
          900: '#0a0a0f',
          850: '#0f0e17',
          800: '#131221',
          750: '#181730',
          700: '#1d1c33',
          600: '#272545',
          500: '#38356b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 20px rgba(147, 51, 234, 0.35)',
        'glow-lg': '0 0 40px rgba(147, 51, 234, 0.45)',
        'glow-sm': '0 0 12px rgba(147, 51, 234, 0.25)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-right': 'slideRight 0.3s ease-out',
        glow: 'glow 2s ease-in-out infinite',
        shimmer: 'shimmer 2s linear infinite',
        'spin-slow': 'spin 3s linear infinite',
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(10px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideRight: { from: { opacity: '0', transform: 'translateX(-10px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        glow: { '0%, 100%': { boxShadow: '0 0 12px rgba(147,51,234,0.3)' }, '50%': { boxShadow: '0 0 24px rgba(147,51,234,0.6)' } },
        shimmer: { '0%': { backgroundPosition: '-1000px 0' }, '100%': { backgroundPosition: '1000px 0' } },
      },
    },
  },
  plugins: [],
};
