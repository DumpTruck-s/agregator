'use client';
import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useAuthStore } from '@/lib/store/auth';
import { useThemeStore } from '@/lib/store/theme';
import { useLocaleStore } from '@/lib/store/locale';

const SupportChatWidget = dynamic(
  () => import('./support/SupportChatWidget').then(m => m.SupportChatWidget),
  { ssr: false }
);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const hydrateAuth   = useAuthStore(s => s.hydrate);
  const hydrateTheme  = useThemeStore(s => s.hydrate);
  const hydrateLocale = useLocaleStore(s => s.hydrate);
  const user          = useAuthStore(s => s.user);

  useEffect(() => {
    hydrateAuth();
    hydrateTheme();
    hydrateLocale();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {children}
      {user && user.role !== 'ADMIN' && <SupportChatWidget userId={user.sub} />}
    </>
  );
}
