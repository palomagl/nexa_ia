/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Identidade "caderno/scrapbook" — valores fixos definidos pela
        // referência de design. Sem presets trocáveis.
        paper: {
          DEFAULT: '#F7F2E6', // fundo da página (Creme)
          card: '#FDFBF4',    // card/papel levantado
          sunken: '#EFE8D6',  // hover / superfície rebaixada
          line: '#E4DCC6',    // fio de borda suave
          line2: '#D6CCB2',   // borda mais marcada
        },
        ink: {
          DEFAULT: '#2B2B2B', // texto (Grafite)
          soft: '#5B564C',    // texto secundário
          faint: '#8A8272',   // legendas / terciário
        },
        lavender: { DEFAULT: '#C6B6E6', deep: '#A78FD6', soft: '#EAE3F6', ink: '#5A4A86' },
        sage:     { DEFAULT: '#BCCD9F', deep: '#9CB278', soft: '#E7ECD9', ink: '#586B3B' },
        rose:     { DEFAULT: '#E7B6B6', deep: '#D69595', soft: '#F7E7E7', ink: '#8C5151' },
        // Fita adesiva (kraft translúcida)
        tape: 'rgb(214 201 168 / 0.55)',
      },
      fontFamily: {
        display: ['Fredoka', 'ui-rounded', 'system-ui', 'sans-serif'],
        hand: ['Caveat', 'ui-rounded', 'cursive'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
      boxShadow: {
        paper: '0 1px 2px rgb(43 43 43 / 0.04), 0 14px 30px -20px rgb(43 43 43 / 0.22)',
        'paper-sm': '0 1px 2px rgb(43 43 43 / 0.05), 0 6px 14px -10px rgb(43 43 43 / 0.18)',
        'paper-lg': '0 2px 4px rgb(43 43 43 / 0.05), 0 26px 50px -24px rgb(43 43 43 / 0.28)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-right': 'slideRight 0.3s ease-out',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(10px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideRight: { from: { opacity: '0', transform: 'translateX(-10px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
      },
    },
  },
  plugins: [],
};
