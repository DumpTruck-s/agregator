'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useShiftStore } from '@/lib/store/shift';
import { getSocket, connectSocket, joinZone } from '@/lib/socket';
import type { OrderStatus } from '@delivery/shared';

interface AvailableOrder {
  id: string;
  totalPrice: number;
  deliveryAddress: string;
  deliveryLat: number;
  deliveryLng: number;
  org: { name: string };
  tradePoint: { address: string; lat: number; lng: number };
  items: { quantity: number; menuItem: { name: string } }[];
}

export default function CourierOrdersPage() {
  const { shift, fetch: fetchShift } = useShiftStore();
  const [orders, setOrders] = useState<AvailableOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);

  useEffect(() => { fetchShift(); }, []);

  useEffect(() => {
    if (!shift) { setLoading(false); return; }

    api.get<AvailableOrder[]>(
      `/api/courier/orders/available?lat=${shift.deliveryZoneLat}&lng=${shift.deliveryZoneLng}&radius=${shift.deliveryRadiusKm}`
    )
      .then(setOrders)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [shift?.id]);

  // WebSocket — новые заказы в зоне
  useEffect(() => {
    if (!shift) return;
    connectSocket();
    const socket = getSocket();

    // Подписываемся на зону — используем tradePointId как zone key (от сервера)
    joinZone(String(shift.id));

    socket.on('order:new', (order: AvailableOrder) => {
      setOrders(prev => [order, ...prev]);
    });

    return () => { socket.off('order:new'); };
  }, [shift?.id]);

  async function acceptOrder(orderId: string) {
    setAccepting(orderId);
    try {
      await api.patch<{ status: OrderStatus }>(`/api/orders/${orderId}/status`, { status: 'ACCEPTED' });
      setOrders(prev => prev.filter(o => o.id !== orderId));
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Ошибка');
    } finally { setAccepting(null); }
  }

  if (!shift) return (
    <div className="max-w-lg mx-auto p-6 text-center py-16 text-gray-400">
      <p className="text-4xl mb-3">🛵</p>
      <p className="font-medium mb-4">Начните смену чтобы видеть заказы</p>
      <a href="/courier/dashboard" className="bg-black text-white rounded-xl px-6 py-2.5 text-sm font-medium">
        Перейти в Смену
      </a>
    </div>
  );

  return (
    <div className="max-w-lg mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">Доступные заказы</h1>
        <button
          onClick={() => {
            setLoading(true);
            api.get<AvailableOrder[]>(
              `/api/courier/orders/available?lat=${shift.deliveryZoneLat}&lng=${shift.deliveryZoneLng}&radius=${shift.deliveryRadiusKm}`
            ).then(setOrders).catch(() => {}).finally(() => setLoading(false));
          }}
          className="text-sm text-gray-500 hover:text-black"
        >
          ↻ Обновить
        </button>
      </div>

      {loading && (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-32 bg-gray-200 rounded-xl animate-pulse" />)}
        </div>
      )}

      {!loading && orders.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📭</p>
          <p>Нет доступных заказов в вашей зоне</p>
          <p className="text-sm mt-1">Радиус {shift.deliveryRadiusKm} км</p>
        </div>
      )}

      <div className="space-y-4">
        {orders.map(order => (
          <div key={order.id} className="bg-white border rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b bg-gray-50">
              <p className="font-semibold">{order.org.name}</p>
            </div>
            <div className="px-4 py-3 space-y-2">
              <div className="flex items-start gap-2 text-sm">
                <span className="text-gray-400 shrink-0">🏪</span>
                <span className="text-gray-700">{order.tradePoint.address}</span>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <span className="text-gray-400 shrink-0">📍</span>
                <span className="text-gray-700">{order.deliveryAddress}</span>
              </div>
              <div className="text-sm text-gray-500 pt-1">
                {order.items.map(i => `${i.menuItem.name} ×${i.quantity}`).join(', ')}
              </div>
            </div>
            <div className="px-4 py-3 border-t flex items-center justify-between">
              <span className="font-bold text-lg">{order.totalPrice} ₽</span>
              <button
                onClick={() => acceptOrder(order.id)}
                disabled={accepting === order.id}
                className="bg-black text-white rounded-xl px-5 py-2 text-sm font-medium hover:bg-gray-800 transition disabled:opacity-50"
              >
                {accepting === order.id ? '...' : 'Принять'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
