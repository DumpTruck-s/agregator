'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store/auth';
import { useLocaleStore } from '@/lib/store/locale';

export default function RegisterPage() {
  const [form, setForm]     = useState({ name: '', email: '', password: '', role: 'CUSTOMER' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const register = useAuthStore(s => s.register);
  const t = useLocaleStore(s => s.t);
  const ra = t.auth.register;

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const href = await register(form);
      window.location.href = href;
    } catch (err) {
      setError(err instanceof Error ? err.message : ra.errorFallback);
      setLoading(false);
    }
  }

  const ROLES = [
    { value: 'CUSTOMER', label: ra.roleCustomer },
    { value: 'OWNER',    label: ra.roleOwner },
    { value: 'COURIER',  label: ra.roleCourier },
  ];

  const fields = [
    { field: 'name',     label: ra.nameLabel,     placeholder: ra.namePlaceholder,     type: 'text' },
    { field: 'email',    label: ra.emailLabel,     placeholder: ra.emailPlaceholder,    type: 'email' },
    { field: 'password', label: ra.passwordLabel,  placeholder: ra.passwordPlaceholder, type: 'password' },
  ];

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-4 py-10">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-accent/5 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-[400px] h-[400px] rounded-full bg-accent/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm animate-scale-in">
        <div className="bg-card border border-border dark:border-accent/20 rounded-2xl shadow-theme-lg dark:shadow-neon-sm overflow-hidden">
          <div className="px-8 pt-8 pb-6 border-b border-border">
            <h1 className="font-display text-3xl font-semibold text-text">{ra.title}</h1>
            <p className="text-subtle text-sm mt-1.5">{ra.subtitle}</p>
          </div>

          <div className="px-8 py-6">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {error && (
                <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl px-3 py-2.5 animate-slide-down">
                  {error}
                </div>
              )}

              {fields.map(({ field, label, placeholder, type }) => (
                <div key={field} className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-subtle uppercase tracking-wider">{label}</label>
                  <input
                    className="border border-border bg-muted rounded-xl px-3.5 py-2.5 text-sm text-text placeholder:text-subtle/60 focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent transition-all"
                    type={type} placeholder={placeholder}
                    value={form[field as keyof typeof form]}
                    onChange={e => set(field, e.target.value)}
                    required minLength={field === 'password' ? 6 : undefined}
                  />
                </div>
              ))}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-subtle uppercase tracking-wider">{ra.roleLabel}</label>
                <select
                  className="border border-border bg-muted rounded-xl px-3.5 py-2.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent transition-all"
                  value={form.role} onChange={e => set('role', e.target.value)}
                >
                  {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>

              <button
                className="bg-accent text-accent-fg rounded-xl py-2.5 text-sm font-semibold mt-1 neon-btn active:scale-95 disabled:opacity-50"
                type="submit" disabled={loading}
              >
                {loading ? ra.loading : ra.submit}
              </button>
            </form>

            <p className="text-sm text-center text-subtle mt-5">
              {ra.hasAccount}{' '}
              <Link href="/login" className="text-accent font-semibold hover:opacity-80 transition-opacity">
                {ra.toLogin}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
