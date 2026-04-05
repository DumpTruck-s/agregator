'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store/auth';
import { useLocaleStore } from '@/lib/store/locale';
import { setTokenCookie, ROLE_HOME } from '@/lib/token';
import type { Role } from '@delivery/shared';

const DEV_ROLES: { role: Role; label: string }[] = [
  { role: 'CUSTOMER', label: 'Customer' },
  { role: 'OWNER',    label: 'Owner' },
  { role: 'COURIER',  label: 'Courier' },
  { role: 'ADMIN',    label: 'Admin' },
];

function devLogin(role: Role) {
  const payload = { sub: 'dev-id', email: `dev@${role.toLowerCase()}.test`, name: `Dev ${role}`, role };
  const token = `eyJhbGciOiJub25lIn0.${btoa(JSON.stringify(payload))}.dev`;
  localStorage.setItem('token', token);
  setTokenCookie(token);
  window.location.href = ROLE_HOME[role];
}

export default function LoginPage() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const login = useAuthStore(s => s.login);
  const t = useLocaleStore(s => s.t);
  const la = t.auth.login;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const href = await login(email, password);
      window.location.href = href;
    } catch (err) {
      const msg = err instanceof Error ? err.message : la.errorFallback;
      if (msg.startsWith('EMAIL_NOT_VERIFIED')) {
        const params = new URLSearchParams({ email });
        const code = msg.split(':')[1];
        if (code) params.set('code', code);
        window.location.href = `/verify-email?${params}`;
        return;
      }
      setError(msg);
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-4">
      {/* Декоративный фон */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-accent/5 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] rounded-full bg-accent/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm animate-scale-in">
        <div className="bg-card border border-border dark:border-accent/20 rounded-2xl shadow-theme-lg dark:shadow-neon-sm overflow-hidden">
          {/* Шапка */}
          <div className="px-8 pt-8 pb-6 border-b border-border">
            <h1 className="font-display text-3xl font-semibold text-text">{la.title}</h1>
            <p className="text-subtle text-sm mt-1.5">{la.subtitle}</p>
          </div>

          <div className="px-8 py-6">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {error && (
                <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl px-3 py-2.5 animate-slide-down">
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-subtle uppercase tracking-wider">{la.emailLabel}</label>
                <input
                  className="border border-border bg-muted rounded-xl px-3.5 py-2.5 text-sm text-text placeholder:text-subtle/60 focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent transition-all"
                  type="email" autoComplete="email" placeholder="you@example.com"
                  value={email} onChange={e => setEmail(e.target.value)} required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-subtle uppercase tracking-wider">{la.passwordLabel}</label>
                <input
                  className="border border-border bg-muted rounded-xl px-3.5 py-2.5 text-sm text-text placeholder:text-subtle/60 focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent transition-all"
                  type="password" autoComplete="current-password" placeholder={la.passwordPlaceholder}
                  value={password} onChange={e => setPassword(e.target.value)} required
                />
              </div>

              <button
                className="bg-accent text-accent-fg rounded-xl py-2.5 text-sm font-semibold mt-1 neon-btn active:scale-95 disabled:opacity-50"
                type="submit" disabled={loading}
              >
                {loading ? la.loading : la.submit}
              </button>
            </form>

            <p className="text-sm text-center text-subtle mt-5">
              {la.noAccount}{' '}
              <Link href="/register" className="text-accent font-semibold hover:opacity-80 transition-opacity">
                {la.toRegister}
              </Link>
            </p>

            {process.env.NODE_ENV === 'development' && (
              <div className="mt-5 pt-5 border-t border-border">
                <p className="text-xs text-subtle/70 text-center mb-3">{la.devTitle}</p>
                <div className="grid grid-cols-2 gap-2">
                  {DEV_ROLES.map(({ role, label }) => (
                    <button
                      key={role}
                      onClick={() => devLogin(role)}
                      className="text-xs border border-border bg-muted rounded-lg py-2 hover:bg-border text-subtle hover:text-text transition-all font-medium"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
