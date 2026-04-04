import { create } from 'zustand';
import { translations, type Locale, type Translations } from '../i18n';

interface LocaleStore {
  locale: Locale;
  t: Translations;
  toggle: () => void;
  setLocale: (l: Locale) => void;
  hydrate: () => void;
}

export const useLocaleStore = create<LocaleStore>((set) => ({
  locale: 'ru',
  t: translations.ru,

  hydrate() {
    const saved = localStorage.getItem('locale') as Locale | null;
    const locale: Locale = (saved === 'ru' || saved === 'en') ? saved : 'ru';
    set({ locale, t: translations[locale] });
  },

  toggle() {
    set(s => {
      const next: Locale = s.locale === 'ru' ? 'en' : 'ru';
      localStorage.setItem('locale', next);
      return { locale: next, t: translations[next] };
    });
  },

  setLocale(locale) {
    localStorage.setItem('locale', locale);
    set({ locale, t: translations[locale] });
  },
}));
