'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store/auth';

export default function RegisterPage() {
  const [form, setForm] = useState({ email: '', password: '', name: '', role: 'CUSTOMER' });
  const [error, setError] = useState('');
  const { login } = useAuthStore();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await api.post('/api/auth/register', form);
      await login(form.email, form.password);
      router.replace('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-80">
        <h1 className="text-2xl font-bold">Register</h1>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <input className="border rounded p-2" placeholder="Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
        <input className="border rounded p-2" type="email" placeholder="Email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
        <input className="border rounded p-2" type="password" placeholder="Password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
        <select className="border rounded p-2" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
          <option value="CUSTOMER">Customer</option>
          <option value="OWNER">Restaurant Owner</option>
          <option value="COURIER">Courier</option>
        </select>
        <button className="bg-black text-white rounded p-2" type="submit">Register</button>
      </form>
    </main>
  );
}
