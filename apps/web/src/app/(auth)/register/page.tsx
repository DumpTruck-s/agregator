'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store/auth';

const ROLES = [
  { value: 'CUSTOMER', label: 'Покупатель' },
  { value: 'OWNER',    label: 'Владелец заведения' },
  { value: 'COURIER',  label: 'Курьер' },
];

export default function RegisterPage() {
  const [form, setForm]     = useState({ name: '', email: '', password: '', role: 'CUSTOMER' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const register = useAuthStore(s => s.register);

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
      setError(err instanceof Error ? err.message : 'Ошибка регистрации');
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-4 py-10">
      <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-bg to-blue-50 dark:from-green-950/20 dark:via-bg dark:to-blue-950/20 pointer-events-none" />

      <div className="relative w-full max-w-sm animate-scale-in">
        <div className="bg-card border border-border rounded-2xl shadow-theme-lg p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-text">Создать аккаунт</h1>
            <p className="text-subtle text-sm mt-1">Это займёт меньше минуты</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-3 py-2 animate-slide-down">
                {error}
              </div>
            )}

            {[
              { field: 'name',     label: 'Имя',    placeholder: 'Иван Иванов',   type: 'text' },
              { field: 'email',    label: 'Email',  placeholder: 'you@email.com', type: 'email' },
              { field: 'password', label: 'Пароль', placeholder: 'мин. 6 символов', type: 'password' },
            ].map(({ field, label, placeholder, type }) => (
              <div key={field} className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-text">{label}</label>
                <input
                  className="border border-border bg-muted rounded-xl px-3 py-2.5 text-sm text-text placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
                  type={type} placeholder={placeholder}
                  value={form[field as keyof typeof form]}
                  onChange={e => set(field, e.target.value)}
                  required minLength={field === 'password' ? 6 : undefined}
                />
              </div>
            ))}

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text">Роль</label>
              <select
                className="border border-border bg-muted rounded-xl px-3 py-2.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
                value={form.role} onChange={e => set('role', e.target.value)}
              >
                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>

            <button
              className="bg-accent text-accent-fg rounded-xl py-2.5 text-sm font-semibold mt-1 hover:opacity-90 active:scale-95 transition-all duration-200 disabled:opacity-50"
              type="submit" disabled={loading}
            >
              {loading ? 'Создаём...' : 'Зарегистрироваться'}
            </button>
          </form>

          <p className="text-sm text-center text-subtle mt-5">
            Уже есть аккаунт?{' '}
            <Link href="/login" className="text-text font-medium hover:underline">
              Войти
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
