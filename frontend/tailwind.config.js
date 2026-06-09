/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Instrument Serif"', 'ui-serif', 'Georgia', 'serif'],
        sans: ['Geist', 'ui-sans-serif', '-apple-system', 'system-ui', 'sans-serif'],
        mono: ['"Geist Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace']
      },
      colors: {
        risk: {
          critical: '#FF453A',
          high: '#FF9F0A',
          medium: '#FFD60A',
          low: '#30D158'
        }
      },
      animation: {
        'fade-up': 'fadeUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) both',
        'drift-1': 'drift1 28s ease-in-out infinite',
        'drift-2': 'drift2 34s ease-in-out infinite',
        'drift-3': 'drift3 40s ease-in-out infinite',
        'shimmer': 'shimmer 2.5s linear infinite',
        'arc-draw': 'arcDraw 1.2s cubic-bezier(0.16, 1, 0.3, 1) both'
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' }
        },
        drift1: {
          '0%, 100%': { transform: 'translate3d(0, 0, 0) scale(1)' },
          '50%': { transform: 'translate3d(8vw, 4vh, 0) scale(1.08)' }
        },
        drift2: {
          '0%, 100%': { transform: 'translate3d(0, 0, 0) scale(1)' },
          '50%': { transform: 'translate3d(-7vw, -6vh, 0) scale(0.94)' }
        },
        drift3: {
          '0%, 100%': { transform: 'translate3d(0, 0, 0) scale(1)' },
          '50%': { transform: 'translate3d(-4vw, 8vh, 0) scale(1.12)' }
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        },
        arcDraw: {
          from: { strokeDasharray: '0 1000' }
        }
      },
      backdropBlur: {
        xs: '2px',
        '4xl': '72px'
      }
    }
  },
  plugins: []
};
