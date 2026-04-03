import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Семантические токены через CSS-переменные
        bg:      'var(--bg)',
        card:    'var(--card)',
        muted:   'var(--muted)',
        border:  'var(--border)',
        text:    'var(--text)',
        subtle:  'var(--subtle)',
        accent:  'var(--accent)',
        'accent-fg': 'var(--accent-fg)',
      },
      animation: {
        'fade-in':   'fadeIn 0.35s ease-out both',
        'slide-up':  'slideUp 0.4s ease-out both',
        'slide-down':'slideDown 0.3s ease-out both',
        'scale-in':  'scaleIn 0.25s ease-out both',
        'pulse-slow':'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
      },
      keyframes: {
        fadeIn:    { from: { opacity: '0' },                         to: { opacity: '1' } },
        slideUp:   { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideDown: { from: { opacity: '0', transform: 'translateY(-12px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        scaleIn:   { from: { opacity: '0', transform: 'scale(0.96)' }, to: { opacity: '1', transform: 'scale(1)' } },
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
};

export default config;
