'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const login = useAuthStore(s => s.login);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      // middleware redirects based on role cookie — reload to trigger it
      router.replace('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-80">
        <h1 className="text-2xl font-bold">Sign In</h1>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <input className="border rounded p-2" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
        <input className="border rounded p-2" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
        <button className="bg-black text-white rounded p-2" type="submit">Login</button>
        <a href="/register" className="text-sm text-center text-blue-600">No account? Register</a>
      </form>
    </main>
  );
}
