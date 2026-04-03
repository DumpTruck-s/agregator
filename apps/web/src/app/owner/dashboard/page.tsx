'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useOrgStore } from '@/lib/store/org';
import { api } from '@/lib/api';
import { StatusBadge } from '@/components/orders/status-badge';
import type { OrderStatus } from '@delivery/shared';

interface Order {
  id: string; status: OrderStatus; totalPrice: number; createdAt: string;
  customer: { name: string };
  items: { quantity: number; menuItem: { name: string } }[];
}

// ─── Create org form ──────────────────────────────────────────────────────────
function CreateOrgForm({ onCreated }: { onCreated: () => void }) {
  const [name, setName]     = useState('');
  const [desc, setDesc]     = useState('');
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/api/orgs', { name, description: desc });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto mt-16 bg-white border rounded-2xl p-8">
      <h2 className="text-xl font-bold mb-1">Создайте ресторан</h2>
      <p className="text-sm text-gray-500 mb-6">После создания добавьте торговую точку и меню</p>
      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
          placeholder="Название ресторана"
          value={name} onChange={e => setName(e.target.value)} required
        />
        <textarea
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black resize-none"
          placeholder="Описание (необязательно)"
          rows={3}
          value={desc} onChange={e => setDesc(e.target.value)}
        />
        <button
          className="bg-black text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Создаём...' : 'Создать'}
        </button>
      </form>
    </div>
  );
}

// ─── Stats card ───────────────────────────────────────────────────────────────
function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white border rounded-xl p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function OwnerDashboard() {
  const { org, loading, fetch } = useOrgStore();
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => { fetch(); }, []);

  useEffect(() => {
    if (!org) return;
    api.get<Order[]>('/api/orders/org').then(setOrders).catch(() => {});
  }, [org?.id]);

  if (loading) {
    return <div className="max-w-3xl mx-auto p-6 space-y-4">
      {[1,2,3].map(i => <div key={i} className="h-20 bg-gray-200 rounded-xl animate-pulse" />)}
    </div>;
  }

  if (!org) return <CreateOrgForm onCreated={fetch} />;

  const today = new Date().toDateString();
  const todayOrders  = orders.filter(o => new Date(o.createdAt).toDateString() === today);
  const activeOrders = orders.filter(o => !['DELIVERED','CANCELLED'].includes(o.status));
  const revenue      = todayOrders.reduce((s, o) => s + o.totalPrice, 0);

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      {/* Org header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{org.name}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {org.isVerified
              ? '✓ Верифицирован'
              : '⏳ Ожидает верификации администратором'}
          </p>
        </div>
        <Link href="/owner/menu" className="text-sm border rounded-lg px-4 py-2 hover:bg-gray-50 transition">
          Управление меню →
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Заказов сегодня" value={todayOrders.length} />
        <StatCard label="Выручка сегодня" value={`${revenue} ₽`} />
        <StatCard label="Активных заказов" value={activeOrders.length} />
      </div>

      {/* Active orders */}
      {activeOrders.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Активные заказы</h2>
            <Link href="/owner/orders" className="text-sm text-gray-500 hover:text-black">Все →</Link>
          </div>
          <div className="space-y-3">
            {activeOrders.slice(0, 3).map(order => (
              <div key={order.id} className="bg-white border rounded-xl px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="font-medium">{order.customer.name}</p>
                  <p className="text-sm text-gray-500">
                    {order.items.map(i => `${i.menuItem.name} ×${i.quantity}`).join(', ')}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold">{order.totalPrice} ₽</span>
                  <StatusBadge status={order.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No trade points warning */}
      {org.tradePoints.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-sm text-yellow-800">
          ⚠️ Добавьте торговую точку в разделе <Link href="/owner/menu" className="underline font-medium">Меню</Link>, иначе покупатели не смогут сделать заказ
        </div>
      )}
    </div>
  );
}
