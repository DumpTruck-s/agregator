'use client';
import { useEffect, useState } from 'react';
import { ClipboardList, MapPin } from 'lucide-react';
import { api } from '@/lib/api';
import { useLocaleStore } from '@/lib/store/locale';
import { StatusBadge } from '@/components/orders/status-badge';
import type { OrderStatus } from '@delivery/shared';

interface HistoryOrder {
  id: string; status: OrderStatus; totalPrice: number; deliveryAddress: string; updatedAt: string;
  org: { name: string };
}

export default function CourierHistoryPage() {
  const [orders, setOrders]   = useState<HistoryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const t = useLocaleStore(s => s.t);
  const ch = t.courier.history;

  useEffect(() => {
    api.get<HistoryOrder[]>('/api/courier/orders/history').then(setOrders).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const delivered = orders.filter(o => o.status === 'DELIVERED');

  return (
    <div className="max-w-lg mx-auto p-6 animate-fade-in">
      <h1 className="font-display text-2xl font-semibold text-text mb-6">{ch.title}</h1>

      {delivered.length > 0 && (
        <div className="grid grid-cols-2 gap-3 mb-6">
          {[
            { label: ch.completed,   value: delivered.length },
            { label: ch.totalAmount, value: `${delivered.reduce((s, o) => s + o.totalPrice, 0)} ₽` },
          ].map((s, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-4 shadow-theme-sm animate-slide-up" style={{ animationDelay: `${i * 0.08}s` }}>
              <p className="text-sm text-subtle">{s.label}</p>
              <p className="font-display text-2xl font-semibold text-text mt-1">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {loading && <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-20 bg-muted rounded-2xl animate-pulse" />)}</div>}

      {!loading && orders.length === 0 && (
        <div className="text-center py-16 text-subtle">
          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3">
            <ClipboardList className="w-5 h-5 text-subtle" strokeWidth={1.5} />
          </div>
          <p>{ch.empty}</p>
        </div>
      )}

      <div className="space-y-3">
        {orders.map((order, i) => (
          <div key={order.id} className="bg-card border border-border rounded-2xl px-4 py-3 flex items-center justify-between shadow-theme-sm hover:shadow-theme-md transition-all animate-slide-up" style={{ animationDelay: `${i * 0.05}s` }}>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-text">{order.org.name}</p>
              <div className="flex items-center gap-1 text-subtle mt-0.5">
                <MapPin className="w-3 h-3 shrink-0" strokeWidth={2} />
                <p className="text-xs truncate">{order.deliveryAddress}</p>
              </div>
              <p className="text-xs text-subtle/60 mt-0.5">
                {new Date(order.updatedAt).toLocaleString(t.dateLocale, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
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
