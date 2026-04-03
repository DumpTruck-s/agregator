'use client';
import { useEffect } from 'react';
import { useAuthStore } from '@/lib/store/auth';
import { useThemeStore } from '@/lib/store/theme';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const hydrateAuth  = useAuthStore(s => s.hydrate);
  const hydrateTheme = useThemeStore(s => s.hydrate);

  useEffect(() => {
    hydrateAuth();
    hydrateTheme();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <>{children}</>;
}
