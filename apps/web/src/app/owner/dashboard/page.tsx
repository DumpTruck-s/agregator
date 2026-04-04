'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useOrgStore } from '@/lib/store/org';
import { api } from '@/lib/api';
import { ImageUpload } from '@/components/ui/image-upload';
import { StatusBadge } from '@/components/orders/status-badge';
import type { OrderStatus } from '@delivery/shared';

interface Order {
  id: string; status: OrderStatus; totalPrice: number; createdAt: string;
  customer: { name: string };
  items: { quantity: number; menuItem: { name: string } }[];
}

function CreateOrgForm({ onCreated }: { onCreated: () => void }) {
  const [name, setName]       = useState('');
  const [desc, setDesc]       = useState('');
  const [logo, setLogo]       = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true);
    try { await api.post('/api/orgs', { name, description: desc || undefined, logo: logo || undefined }); onCreated(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Ошибка'); setLoading(false); }
  }

  return (
    <div className="max-w-md mx-auto mt-16 bg-card border border-border rounded-2xl p-8 shadow-theme-md animate-scale-in">
      <h2 className="text-xl font-bold text-text mb-1">Создайте ресторан</h2>
      <p className="text-sm text-subtle mb-6">После создания добавьте торговую точку и меню</p>
      {error && <p className="text-sm text-red-500 dark:text-red-400 mb-4">{error}</p>}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <ImageUpload value={logo} onChange={setLogo} placeholder="Логотип (необязательно)" />
        <input
          className="border border-border bg-muted rounded-xl px-3 py-2.5 text-sm text-text placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all"
          placeholder="Название ресторана" value={name} onChange={e => setName(e.target.value)} required
        />
        <textarea
          className="border border-border bg-muted rounded-xl px-3 py-2.5 text-sm text-text placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all resize-none"
          placeholder="Описание (необязательно)" rows={3} value={desc} onChange={e => setDesc(e.target.value)}
        />
        <button className="bg-accent text-accent-fg rounded-xl py-2.5 text-sm font-semibold hover:opacity-90 active:scale-95 transition-all disabled:opacity-50" disabled={loading}>
          {loading ? 'Создаём...' : 'Создать'}
        </button>
      </form>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-theme-sm hover:shadow-theme-md transition-all duration-300">
      <p className="text-sm text-subtle">{label}</p>
      <p className="text-2xl font-bold text-text mt-1">{value}</p>
    </div>
  );
}

export default function OwnerDashboard() {
  const { org, loading, fetch } = useOrgStore();
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => { fetch(); }, []);
  useEffect(() => {
    if (!org) return;
    api.get<Order[]>('/api/orders/org').then(setOrders).catch(() => {});
  }, [org?.id]);

  if (loading) return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      {[1,2,3].map(i => <div key={i} className="h-20 bg-muted rounded-2xl animate-pulse" />)}
    </div>
  );

  if (!org) return <CreateOrgForm onCreated={fetch} />;

  const today        = new Date().toDateString();
  const todayOrders  = orders.filter(o => new Date(o.createdAt).toDateString() === today);
  const activeOrders = orders.filter(o => !['DELIVERED','CANCELLED'].includes(o.status));
  const revenue      = todayOrders.reduce((s, o) => s + o.totalPrice, 0);

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">{org.name}</h1>
          <p className="text-sm text-subtle mt-0.5">
            {org.isVerified ? '✓ Верифицирован' : '⏳ Ожидает верификации'}
          </p>
        </div>
        <Link href="/owner/menu" className="text-sm border border-border bg-card rounded-xl px-4 py-2 text-subtle hover:text-text hover:shadow-theme-sm transition-all">
          Меню →
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Заказов сегодня', value: todayOrders.length },
          { label: 'Выручка сегодня', value: `${revenue} ₽` },
          { label: 'Активных',        value: activeOrders.length },
        ].map((s, i) => (
          <div key={i} className="animate-slide-up" style={{ animationDelay: `${i * 0.08}s` }}>
            <StatCard {...s} />
          </div>
        ))}
      </div>

      {activeOrders.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-text">Активные заказы</h2>
            <Link href="/owner/orders" className="text-sm text-subtle hover:text-text transition-colors">Все →</Link>
          </div>
          <div className="space-y-3">
            {activeOrders.slice(0, 3).map((order, i) => (
              <div key={order.id} className="bg-card border border-border rounded-2xl px-4 py-3 flex items-center justify-between animate-slide-up shadow-theme-sm" style={{ animationDelay: `${i * 0.07}s` }}>
                <div>
                  <p className="font-medium text-text">{order.customer.name}</p>
                  <p className="text-sm text-subtle">{order.items.map(i => `${i.menuItem.name} ×${i.quantity}`).join(', ')}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-text">{order.totalPrice} ₽</span>
                  <StatusBadge status={order.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {org.tradePoints.length === 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl px-4 py-3 text-sm text-yellow-800 dark:text-yellow-300 animate-slide-up">
          ⚠️ Добавьте торговую точку в разделе <Link href="/owner/menu" className="underline font-medium">Меню</Link>
        </div>
      )}
    </div>
  );
}
