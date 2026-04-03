'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store/auth';
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
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore(s => s.login);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const href = await login(email, password);
      window.location.href = href;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка входа');
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-4">
      {/* Фоновый градиент */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-bg to-purple-50 dark:from-blue-950/20 dark:via-bg dark:to-purple-950/20 pointer-events-none" />

      <div className="relative w-full max-w-sm animate-scale-in">
        <div className="bg-card border border-border rounded-2xl shadow-theme-lg p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-text">Добро пожаловать</h1>
            <p className="text-subtle text-sm mt-1">Войдите в свой аккаунт</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-3 py-2 animate-slide-down">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text">Email</label>
              <input
                className="border border-border bg-muted rounded-xl px-3 py-2.5 text-sm text-text placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
                type="email" autoComplete="email" placeholder="you@example.com"
                value={email} onChange={e => setEmail(e.target.value)} required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text">Пароль</label>
              <input
                className="border border-border bg-muted rounded-xl px-3 py-2.5 text-sm text-text placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
                type="password" autoComplete="current-password" placeholder="••••••"
                value={password} onChange={e => setPassword(e.target.value)} required
              />
            </div>

            <button
              className="bg-accent text-accent-fg rounded-xl py-2.5 text-sm font-semibold mt-1 hover:opacity-90 active:scale-95 transition-all duration-200 disabled:opacity-50"
              type="submit" disabled={loading}
            >
              {loading ? 'Входим...' : 'Войти'}
            </button>
          </form>

          <p className="text-sm text-center text-subtle mt-5">
            Нет аккаунта?{' '}
            <Link href="/register" className="text-text font-medium hover:underline transition-all">
              Зарегистрироваться
            </Link>
          </p>

          {process.env.NODE_ENV === 'development' && (
            <div className="mt-6 pt-5 border-t border-border">
              <p className="text-xs text-subtle text-center mb-3">DEV — войти без бэка</p>
              <div className="grid grid-cols-2 gap-2">
                {DEV_ROLES.map(({ role, label }) => (
                  <button
                    key={role}
                    onClick={() => devLogin(role)}
                    className="text-xs border border-border bg-muted rounded-xl py-2 hover:bg-border text-subtle hover:text-text transition-all font-medium"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
