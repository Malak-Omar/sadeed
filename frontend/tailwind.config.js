/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#060d18',
          900: '#0A1628',
          800: '#0f1f38',
          700: '#162848',
          600: '#1B2E47',
          500: '#1e3a5f',
          400: '#2D4A6E',
          300: '#3a5f87',
        },
        accent: {
          500: '#3B82F6',
          400: '#60A5FA',
          600: '#2563EB',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        arabic: ['Cairo', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'score-fill': 'scoreFill 1s ease-out forwards',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(12px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        scoreFill: { from: { width: '0%' }, to: { width: 'var(--score-width)' } },
      },
    },
  },
  plugins: [],
}
