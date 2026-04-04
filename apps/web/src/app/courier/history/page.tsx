'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { StatusBadge } from '@/components/orders/status-badge';
import type { OrderStatus } from '@delivery/shared';

interface HistoryOrder {
  id: string; status: OrderStatus; totalPrice: number; deliveryAddress: string; updatedAt: string;
  org: { name: string };
}

export default function CourierHistoryPage() {
  const [orders, setOrders]   = useState<HistoryOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<HistoryOrder[]>('/api/courier/orders/history').then(setOrders).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const delivered = orders.filter(o => o.status === 'DELIVERED');

  return (
    <div className="max-w-lg mx-auto p-6 animate-fade-in">
      <h1 className="text-xl font-bold text-text mb-6">История доставок</h1>

      {delivered.length > 0 && (
        <div className="grid grid-cols-2 gap-3 mb-6">
          {[
            { label: 'Выполнено',      value: delivered.length },
            { label: 'Сумма заказов',  value: `${delivered.reduce((s, o) => s + o.totalPrice, 0)} ₽` },
          ].map((s, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-4 shadow-theme-sm animate-slide-up" style={{ animationDelay: `${i * 0.08}s` }}>
              <p className="text-sm text-subtle">{s.label}</p>
              <p className="text-2xl font-bold text-text mt-1">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {loading && <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-20 bg-muted rounded-2xl animate-pulse" />)}</div>}

      {!loading && orders.length === 0 && (
        <div className="text-center py-16 text-subtle">
          <p className="text-4xl mb-3">📋</p>
          <p>История пуста</p>
        </div>
      )}

      <div className="space-y-3">
        {orders.map((order, i) => (
          <div key={order.id} className="bg-card border border-border rounded-2xl px-4 py-3 flex items-center justify-between shadow-theme-sm hover:shadow-theme-md transition-all animate-slide-up" style={{ animationDelay: `${i * 0.05}s` }}>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-text">{order.org.name}</p>
              <p className="text-xs text-subtle truncate mt-0.5">📍 {order.deliveryAddress}</p>
              <p className="text-xs text-subtle/60 mt-0.5">
                {new Date(order.updatedAt).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2 ml-4 shrink-0">
              <span className="font-semibold text-text">{order.totalPrice} ₽</span>
              <StatusBadge status={order.status} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
