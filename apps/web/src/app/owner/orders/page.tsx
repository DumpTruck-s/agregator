'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { StatusBadge } from '@/components/orders/status-badge';
import { getSocket, connectSocket, joinOrderRoom } from '@/lib/socket';
import type { OrderStatus } from '@delivery/shared';

interface Order {
  id: string; status: OrderStatus; totalPrice: number; createdAt: string; deliveryAddress: string;
  customer: { name: string; phone?: string };
  items: { quantity: number; price: number; menuItem: { name: string } }[];
}

const OWNER_ACTION: Partial<Record<OrderStatus, { label: string; next: OrderStatus }>> = {
  ACCEPTED: { label: 'Начать готовить',  next: 'COOKING' },
  COOKING:  { label: 'Готово к выдаче', next: 'READY'   },
};

const ACTIVE: OrderStatus[] = ['CREATED','ACCEPTED','COOKING','READY'];

export default function OwnerOrdersPage() {
  const [orders, setOrders]   = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState<'active'|'done'>('active');
  const [updating, setUpdating] = useState<string | null>(null);

  async function load() {
    try { setOrders(await api.get<Order[]>('/api/orders/org')); }
    catch {}
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    connectSocket();
    const s = getSocket();
    s.on('order:new',     (o: Order)                     => setOrders(p => [o, ...p]));
    s.on('order:updated', (u: { id: string; status: OrderStatus }) =>
      setOrders(p => p.map(o => o.id === u.id ? { ...o, status: u.status } : o)));
    return () => { s.off('order:new'); s.off('order:updated'); };
  }, []);

  useEffect(() => { orders.forEach(o => joinOrderRoom(o.id)); }, [orders.length]);

  async function updateStatus(orderId: string, status: OrderStatus) {
    setUpdating(orderId);
    try {
      await api.patch(`/api/orders/${orderId}/status`, { status });
      setOrders(p => p.map(o => o.id === orderId ? { ...o, status } : o));
    } catch (e) { alert(e instanceof Error ? e.message : 'Ошибка'); }
    finally { setUpdating(null); }
  }

  const active = orders.filter(o => ACTIVE.includes(o.status));
  const done   = orders.filter(o => !ACTIVE.includes(o.status));
  const shown  = tab === 'active' ? active : done;

  return (
    <div className="max-w-2xl mx-auto p-6 animate-fade-in">
      <div className="flex gap-1 mb-6 bg-muted rounded-xl p-1 w-fit">
        {(['active','done'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${tab === t ? 'bg-card shadow text-text' : 'text-subtle hover:text-text'}`}>
            {t === 'active' ? `Активные${active.length ? ` (${active.length})` : ''}` : 'Завершённые'}
          </button>
        ))}
      </div>

      {loading && <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-28 bg-muted rounded-2xl animate-pulse" />)}</div>}

      {!loading && shown.length === 0 && (
        <div className="text-center py-16 text-subtle">
          <p className="text-4xl mb-3">{tab === 'active' ? '🟢' : '📋'}</p>
          <p>{tab === 'active' ? 'Нет активных заказов' : 'Нет завершённых'}</p>
        </div>
      )}

      <div className="space-y-4">
        {shown.map((order, i) => {
          const action = OWNER_ACTION[order.status];
          return (
            <div key={order.id} className="bg-card border border-border rounded-2xl overflow-hidden shadow-theme-sm hover:shadow-theme-md transition-all animate-slide-up" style={{ animationDelay: `${i * 0.06}s` }}>
              <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/50">
                <div>
                  <p className="font-semibold text-text">{order.customer.name}</p>
                  {order.customer.phone && <p className="text-xs text-subtle">{order.customer.phone}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-text">{order.totalPrice} ₽</span>
                  <StatusBadge status={order.status} />
                </div>
              </div>
              <div className="px-4 py-3 space-y-1">
                {order.items.map((item, j) => (
                  <p key={j} className="text-sm text-subtle">{item.menuItem.name} <span className="text-subtle/60">× {item.quantity}</span></p>
                ))}
              </div>
              <div className="px-4 py-3 border-t border-border flex items-center justify-between">
                <p className="text-xs text-subtle">
                  {new Date(order.createdAt).toLocaleString('ru-RU', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                </p>
                {action && (
                  <button onClick={() => updateStatus(order.id, action.next)} disabled={updating === order.id}
                    className="bg-accent text-accent-fg text-xs rounded-xl px-4 py-2 hover:opacity-90 active:scale-95 transition-all disabled:opacity-50">
                    {updating === order.id ? '...' : action.label}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
