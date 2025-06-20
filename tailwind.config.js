const { createGlobPatternsForDependencies } = require('@nx/react/tailwind');
const { join } = require('path');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    join(
      __dirname,
      '{src,pages,components,app}/**/*!(*.stories|*.spec).{ts,tsx,html}'
    ),
    ...createGlobPatternsForDependencies(__dirname),
  ],
  theme: {
    extend: {
      colors: {
        background: 'rgba(var(--color-background))',
        surface: 'rgba(var(--color-surface))',
        text: 'rgba(var(--color-text))',
        'text-secondary': 'rgba(var(--color-text-secondary))',
        primary: {
          DEFAULT: 'rgba(var(--color-primary))',
          hover: 'rgba(var(--color-primary-hover))',
          active: 'rgba(var(--color-primary-active))',
        },
        secondary: {
          DEFAULT: 'rgba(var(--color-secondary))',
          hover: 'rgba(var(--color-secondary-hover))',
          active: 'rgba(var(--color-secondary-active))',
        },
        border: 'rgba(var(--color-border))',
        'btn-primary-text': 'rgba(var(--color-btn-primary-text))',
        error: 'rgba(var(--color-error))',
        success: 'rgba(var(--color-success))',
        warning: 'rgba(var(--color-warning))',
        info: 'rgba(var(--color-info))',
        'focus-ring': 'rgba(var(--color-focus-ring))',
      },
      fontFamily: {
        sans: ['"FKGroteskNeue"', '"Geist"', '"Inter"', 'sans-serif'],
        mono: ['"Berkeley Mono"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        xs: '11px',
        sm: '12px',
        base: '14px',
        md: '14px',
        lg: '16px',
        xl: '18px',
        '2xl': '20px',
        '3xl': '24px',
        '4xl': '30px',
      },
      borderRadius: {
        sm: '6px',
        DEFAULT: '8px',
        md: '10px',
        lg: '12px',
        full: '9999px',
      },
      boxShadow: {
        xs: '0 1px 2px rgba(0, 0, 0, 0.02)',
        sm: '0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.04), 0 2px 4px -1px rgba(0, 0, 0, 0.02)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.04), 0 4px 6px -2px rgba(0, 0, 0, 0.02)',
      },
      keyframes: {
        loading: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.5 },
        },
      },
      animation: {
        loading: 'loading 1.5s infinite',
      },
    },
  },
  plugins: [],
}; 