'use client';
import { useEffect } from 'react';
import { useAuthStore } from '@/lib/store/auth';
import { useThemeStore } from '@/lib/store/theme';
import { useLocaleStore } from '@/lib/store/locale';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const hydrateAuth   = useAuthStore(s => s.hydrate);
  const hydrateTheme  = useThemeStore(s => s.hydrate);
  const hydrateLocale = useLocaleStore(s => s.hydrate);

  useEffect(() => {
    hydrateAuth();
    hydrateTheme();
    hydrateLocale();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <>{children}</>;
}
