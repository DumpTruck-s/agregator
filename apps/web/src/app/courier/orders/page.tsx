'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useShiftStore } from '@/lib/store/shift';
import { getSocket, connectSocket, joinZone } from '@/lib/socket';
import type { OrderStatus } from '@delivery/shared';

interface AvailableOrder {
  id: string; totalPrice: number; deliveryAddress: string; deliveryLat: number; deliveryLng: number;
  org: { name: string }; tradePoint: { address: string };
  items: { quantity: number; menuItem: { name: string } }[];
}

export default function CourierOrdersPage() {
  const { shift, fetch: fetchShift } = useShiftStore();
  const [orders, setOrders]     = useState<AvailableOrder[]>([]);
  const [loading, setLoading]   = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);

  useEffect(() => { fetchShift(); }, []);

  function loadOrders() {
    if (!shift) { setLoading(false); return; }
    setLoading(true);
    api.get<AvailableOrder[]>(`/api/courier/orders/available?lat=${shift.deliveryZoneLat}&lng=${shift.deliveryZoneLng}&radius=${shift.deliveryRadiusKm}`)
      .then(setOrders).catch(() => {}).finally(() => setLoading(false));
  }

  useEffect(() => { loadOrders(); }, [shift?.id]);

  useEffect(() => {
    if (!shift) return;
    connectSocket();
    const s = getSocket();
    joinZone(String(shift.id));
    s.on('order:new', (o: AvailableOrder) => setOrders(p => [o, ...p]));
    return () => { s.off('order:new'); };
  }, [shift?.id]);

  async function acceptOrder(orderId: string) {
    setAccepting(orderId);
    try {
      await api.patch<{ status: OrderStatus }>(`/api/orders/${orderId}/status`, { status: 'ACCEPTED' });
      setOrders(p => p.filter(o => o.id !== orderId));
    } catch (e) { alert(e instanceof Error ? e.message : 'Ошибка'); }
    finally { setAccepting(null); }
  }

  if (!shift) return (
    <div className="max-w-lg mx-auto p-6 text-center py-16 text-subtle animate-fade-in">
      <p className="text-4xl mb-3">🛵</p>
      <p className="font-medium text-text mb-4">Начните смену чтобы видеть заказы</p>
      <a href="/courier/dashboard" className="bg-accent text-accent-fg rounded-xl px-6 py-2.5 text-sm font-medium hover:opacity-90 transition-all active:scale-95">
        Перейти в Смену
      </a>
    </div>
  );

  return (
    <div className="max-w-lg mx-auto p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-text">Доступные заказы</h1>
        <button onClick={loadOrders} className="text-sm text-subtle hover:text-text transition-colors active:scale-95">↻ Обновить</button>
      </div>

      {loading && <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-32 bg-muted rounded-2xl animate-pulse" />)}</div>}

      {!loading && orders.length === 0 && (
        <div className="text-center py-16 text-subtle">
          <p className="text-4xl mb-3">📭</p>
          <p>Нет заказов в вашей зоне</p>
          <p className="text-sm mt-1">Радиус {shift.deliveryRadiusKm} км</p>
        </div>
      )}

      <div className="space-y-4">
        {orders.map((order, i) => (
          <div key={order.id} className="bg-card border border-border rounded-2xl overflow-hidden shadow-theme-sm hover:shadow-theme-md transition-all animate-slide-up" style={{ animationDelay: `${i * 0.06}s` }}>
            <div className="px-4 py-3 border-b border-border bg-muted/50">
              <p className="font-semibold text-text">{order.org.name}</p>
            </div>
            <div className="px-4 py-3 space-y-2">
              <p className="text-sm text-subtle">🏪 {order.tradePoint.address}</p>
              <p className="text-sm text-subtle">📍 {order.deliveryAddress}</p>
              <p className="text-sm text-subtle/70">{order.items.map(i => `${i.menuItem.name} ×${i.quantity}`).join(', ')}</p>
            </div>
            <div className="px-4 py-3 border-t border-border flex items-center justify-between">
              <span className="font-bold text-lg text-text">{order.totalPrice} ₽</span>
              <button onClick={() => acceptOrder(order.id)} disabled={accepting === order.id}
                className="bg-accent text-accent-fg rounded-xl px-5 py-2 text-sm font-medium hover:opacity-90 active:scale-95 transition-all disabled:opacity-50">
                {accepting === order.id ? '...' : 'Принять'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
