/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Definidas como variáveis CSS (ver index.css :root e [data-accent])
        // pra dar pra trocar o tom de roxo do app inteiro em tempo real,
        // sem precisar de outro build do Tailwind.
        nexa: {
          50: 'rgb(var(--nexa-50) / <alpha-value>)',
          100: 'rgb(var(--nexa-100) / <alpha-value>)',
          200: 'rgb(var(--nexa-200) / <alpha-value>)',
          300: 'rgb(var(--nexa-300) / <alpha-value>)',
          400: 'rgb(var(--nexa-400) / <alpha-value>)',
          500: 'rgb(var(--nexa-500) / <alpha-value>)',
          600: 'rgb(var(--nexa-600) / <alpha-value>)',
          700: 'rgb(var(--nexa-700) / <alpha-value>)',
          800: 'rgb(var(--nexa-800) / <alpha-value>)',
          900: 'rgb(var(--nexa-900) / <alpha-value>)',
          950: 'rgb(var(--nexa-950) / <alpha-value>)',
        },
        violet: {
          400: 'rgb(var(--violet-400) / <alpha-value>)',
          500: 'rgb(var(--violet-500) / <alpha-value>)',
          600: 'rgb(var(--violet-600) / <alpha-value>)',
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
        glow: '0 0 20px rgb(var(--nexa-500) / 0.35)',
        'glow-lg': '0 0 40px rgb(var(--nexa-500) / 0.45)',
        'glow-sm': '0 0 12px rgb(var(--nexa-500) / 0.25)',
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
        glow: { '0%, 100%': { boxShadow: '0 0 12px rgb(var(--nexa-500) / 0.3)' }, '50%': { boxShadow: '0 0 24px rgb(var(--nexa-500) / 0.6)' } },
        shimmer: { '0%': { backgroundPosition: '-1000px 0' }, '100%': { backgroundPosition: '1000px 0' } },
      },
    },
  },
  plugins: [],
};
