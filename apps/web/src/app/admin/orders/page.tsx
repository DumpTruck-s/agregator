'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { StatusBadge } from '@/components/orders/status-badge';
import type { OrderStatus } from '@delivery/shared';

interface AdminOrder {
  id: string;
  status: OrderStatus;
  totalPrice: number;
  deliveryAddress: string;
  createdAt: string;
  customer: { id: string; name: string; email: string };
  courier: { id: string; name: string } | null;
  org: { id: string; name: string };
  items: { quantity: number; menuItem: { name: string } }[];
}

const STATUS_FILTER = ['ALL', 'CREATED', 'ACCEPTED', 'COOKING', 'READY', 'PICKED_UP', 'DELIVERING', 'DELIVERED', 'CANCELLED'] as const;
type Filter = typeof STATUS_FILTER[number];

export default function AdminOrdersPage() {
  const [orders, setOrders]   = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState<Filter>('ALL');
  const [search, setSearch]   = useState('');

  useEffect(() => {
    api.get<AdminOrder[]>('/api/admin/orders')
      .then(setOrders).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const shown = orders.filter(o => {
    if (filter !== 'ALL' && o.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return o.customer.name.toLowerCase().includes(q)
        || o.org.name.toLowerCase().includes(q)
        || o.id.includes(q);
    }
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto p-6 animate-fade-in">
      <h1 className="font-display text-2xl font-semibold text-text mb-6">Все заказы</h1>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          className="border border-border bg-card rounded-xl px-3 py-2 text-sm text-text placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-accent/30 flex-1"
          placeholder="Поиск по клиенту, ресторану или ID..."
          value={search} onChange={e => setSearch(e.target.value)}
        />
        <select
          className="border border-border bg-card rounded-xl px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/30"
          value={filter} onChange={e => setFilter(e.target.value as Filter)}
        >
          {STATUS_FILTER.map(s => <option key={s} value={s}>{s === 'ALL' ? 'Все статусы' : s}</option>)}
        </select>
      </div>

      {loading && <div className="space-y-2">{[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}</div>}

      {!loading && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-theme-sm">
          {shown.length === 0 ? (
            <p className="text-center text-subtle py-12">Заказов не найдено</p>
          ) : (
            <div className="divide-y divide-border">
              {shown.map(order => (
                <div key={order.id} className="px-4 py-3 hover:bg-muted/40 transition-colors">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="font-semibold text-sm text-text">{order.org.name}</span>
                        <StatusBadge status={order.status} />
                        {order.courier && (
                          <span className="text-xs text-subtle bg-muted px-2 py-0.5 rounded-full">
                            🛵 {order.courier.name}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-subtle">
                        {order.customer.name} · {order.items.map(i => `${i.menuItem.name} ×${i.quantity}`).join(', ')}
                      </p>
                      <p className="text-xs text-subtle/60 truncate mt-0.5">📍 {order.deliveryAddress}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-text">{order.totalPrice} ₽</p>
                      <p className="text-xs text-subtle">{new Date(order.createdAt).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!loading && <p className="text-xs text-subtle mt-3 text-right">Показано {shown.length} из {orders.length}</p>}
    </div>
  );
}
