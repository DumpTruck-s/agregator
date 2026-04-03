import { create } from 'zustand';

type Theme = 'light' | 'dark';

interface ThemeStore {
  theme: Theme;
  toggle: () => void;
  setTheme: (t: Theme) => void;
  hydrate: () => void;
}

function applyTheme(t: Theme) {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', t === 'dark');
}

export const useThemeStore = create<ThemeStore>((set) => ({
  theme: 'light',

  hydrate() {
    const saved = localStorage.getItem('theme') as Theme | null;
    const preferred = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const t = saved ?? preferred;
    applyTheme(t);
    set({ theme: t });
  },

  toggle() {
    set(s => {
      const next: Theme = s.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', next);
      applyTheme(next);
      return { theme: next };
    });
  },

  setTheme(t) {
    localStorage.setItem('theme', t);
    applyTheme(t);
    set({ theme: t });
  },
}));
