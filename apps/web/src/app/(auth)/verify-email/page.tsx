'use client';
import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { MailCheck, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store/auth';
import { setTokenCookie, ROLE_HOME } from '@/lib/token';
import type { JwtPayload } from '@/lib/token';

const CODE_LEN = 6;

function VerifyForm() {
  const params   = useSearchParams();
  const email    = params.get('email') ?? '';

  const [digits, setDigits]     = useState<string[]>(Array(CODE_LEN).fill(''));
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [sent, setSent]         = useState(false);
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const hydrateAuth = useAuthStore(s => s.hydrate);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  function handleDigit(i: number, value: string) {
    const v = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[i] = v;
    setDigits(next);
    setError('');
    if (v && i < CODE_LEN - 1) refs.current[i + 1]?.focus();
    if (v && next.every(Boolean)) submitCode(next.join(''));
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !digits[i] && i > 0) refs.current[i - 1]?.focus();
    if (e.key === 'ArrowLeft'  && i > 0)           refs.current[i - 1]?.focus();
    if (e.key === 'ArrowRight' && i < CODE_LEN - 1) refs.current[i + 1]?.focus();
  }

  function handlePaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, CODE_LEN);
    if (!pasted) return;
    e.preventDefault();
    const next = Array(CODE_LEN).fill('');
    for (let j = 0; j < pasted.length; j++) next[j] = pasted[j];
    setDigits(next);
    refs.current[Math.min(pasted.length, CODE_LEN - 1)]?.focus();
    if (pasted.length === CODE_LEN) submitCode(pasted);
  }

  async function submitCode(code: string) {
    setLoading(true);
    setError('');
    try {
      const { user, token } = await api.post<{ user: JwtPayload; token: string }>(
        '/api/auth/verify-email',
        { email, code },
      );
      localStorage.setItem('token', token);
      setTokenCookie(token);
      hydrateAuth();
      window.location.href = ROLE_HOME[user.role as keyof typeof ROLE_HOME] ?? '/';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка подтверждения');
      setDigits(Array(CODE_LEN).fill(''));
      setTimeout(() => refs.current[0]?.focus(), 50);
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    if (cooldown > 0) return;
    setSent(false);
    try {
      await api.post('/api/auth/resend-code', { email });
      setCooldown(60);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    }
  }

  const code = digits.join('');

  return (
    <div className="bg-card border border-border dark:border-accent/20 rounded-2xl shadow-theme-lg dark:shadow-neon-sm overflow-hidden">
      <div className="px-8 pt-8 pb-6 border-b border-border text-center">
        <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
          <MailCheck className="w-7 h-7 text-accent" strokeWidth={1.5} />
        </div>
        <h1 className="font-display text-2xl font-semibold text-text">Подтвердите email</h1>
        <p className="text-subtle text-sm mt-1.5">
          Мы отправили 6-значный код на{' '}
          <span className="font-medium text-text break-all">{email}</span>
        </p>
      </div>

      <div className="px-8 py-6 space-y-5">
        {/* OTP inputs */}
        <div className="flex gap-2 justify-center" onPaste={handlePaste}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={el => { refs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={d}
              autoFocus={i === 0}
              onChange={e => handleDigit(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              className={`w-11 h-14 text-center text-2xl font-bold rounded-xl border transition-all outline-none
                ${d ? 'border-accent bg-accent/5 text-text' : 'border-border bg-muted text-text'}
                focus:border-accent focus:ring-2 focus:ring-accent/25
                ${error ? 'border-red-400 dark:border-red-600' : ''}
              `}
            />
          ))}
        </div>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl px-3 py-2.5 text-center">
            {error}
          </p>
        )}

        {sent && !error && (
          <p className="text-xs text-emerald-600 dark:text-emerald-400 text-center">
            Новый код отправлен
          </p>
        )}

        <button
          onClick={() => code.length === CODE_LEN && submitCode(code)}
          disabled={code.length < CODE_LEN || loading}
          className="w-full bg-accent text-accent-fg rounded-xl py-2.5 text-sm font-semibold neon-btn active:scale-95 disabled:opacity-50 transition-all"
        >
          {loading ? 'Проверяем…' : 'Подтвердить'}
        </button>

        <div className="text-center space-y-2">
          <button
            onClick={resend}
            disabled={cooldown > 0}
            className="inline-flex items-center gap-1.5 text-sm text-subtle hover:text-text transition-colors disabled:opacity-50"
          >
            <RefreshCw className="w-3.5 h-3.5" strokeWidth={2} />
            {cooldown > 0 ? `Повторить через ${cooldown} с` : 'Отправить код снова'}
          </button>
          <p className="text-xs text-subtle/50">Не пришло? Проверьте папку «Спам»</p>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-accent/5 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] rounded-full bg-accent/5 blur-3xl" />
      </div>
      <div className="relative w-full max-w-sm animate-scale-in">
        <Suspense fallback={<div className="h-96 bg-card rounded-2xl animate-pulse" />}>
          <VerifyForm />
        </Suspense>
      </div>
    </main>
  );
}
