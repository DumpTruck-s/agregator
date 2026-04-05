import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg:           'var(--bg)',
        card:         'var(--card)',
        muted:        'var(--muted)',
        border:       'var(--border)',
        text:         'var(--text)',
        subtle:       'var(--subtle)',
        accent:       'var(--accent)',
        'accent-fg':  'var(--accent-fg)',
      },
      fontFamily: {
        sans:    ['var(--font-sans)', 'Segoe UI', 'system-ui', 'sans-serif'],
        display: ['var(--font-sans)', 'Segoe UI', 'system-ui', 'sans-serif'],
        mono:    ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'neon-sm': '0 0 10px var(--neon-glow), 0 0 20px rgba(0,0,0,.1)',
        'neon-md': '0 0 16px var(--neon-glow), 0 0 40px var(--neon-glow)',
        'neon-lg': '0 0 30px var(--neon-glow-lg), 0 0 80px var(--neon-glow)',
      },
      animation: {
        'fade-in':    'fadeIn 0.3s ease-out both',
        'slide-up':   'slideUp 0.35s ease-out both',
        'slide-down': 'slideDown 0.3s ease-out both',
        'scale-in':   'scaleIn 0.2s ease-out both',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:    { from: { opacity: '0' },                                to: { opacity: '1' } },
        slideUp:   { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideDown: { from: { opacity: '0', transform: 'translateY(-12px)' },to: { opacity: '1', transform: 'translateY(0)' } },
        scaleIn:   { from: { opacity: '0', transform: 'scale(0.94)' },      to: { opacity: '1', transform: 'scale(1)' } },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 8px var(--neon-glow)' },
          '50%':      { boxShadow: '0 0 24px var(--neon-glow-lg), 0 0 48px var(--neon-glow)' },
        },
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
};

export default config;
