'use client';
import { useEffect, useState } from 'react';
import { useShiftStore } from '@/lib/store/shift';
import { api } from '@/lib/api';
import { StatusBadge } from '@/components/orders/status-badge';
import type { OrderStatus } from '@delivery/shared';

interface ActiveOrder {
  id: string;
  status: OrderStatus;
  totalPrice: number;
  deliveryAddress: string;
  org: { name: string };
  tradePoint: { address: string };
  items: { quantity: number; menuItem: { name: string } }[];
}

const COURIER_ACTIONS: Partial<Record<OrderStatus, { label: string; next: OrderStatus }>> = {
  READY:      { label: 'Забрал у ресторана', next: 'PICKED_UP'  },
  PICKED_UP:  { label: 'В пути',             next: 'DELIVERING' },
  DELIVERING: { label: 'Доставил',           next: 'DELIVERED'  },
};

// ─── Start shift form ─────────────────────────────────────────────────────────
function StartShiftForm({ onStarted }: { onStarted: () => void }) {
  const { start } = useShiftStore();
  const [radius, setRadius] = useState('5');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function getGeo() {
    if (!navigator.geolocation) return;
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      pos => { setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setGeoLoading(false); },
      () => setGeoLoading(false),
    );
  }

  async function handleStart() {
    if (!coords) { setError('Сначала определите местоположение'); return; }
    setError(''); setLoading(true);
    try {
      await start(coords.lat, coords.lng, parseFloat(radius));
      onStarted();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка');
    } finally { setLoading(false); }
  }

  return (
    <div className="max-w-sm mx-auto mt-16 bg-white border rounded-2xl p-8 text-center">
      <div className="text-5xl mb-4">🛵</div>
      <h2 className="text-xl font-bold mb-1">Начать смену</h2>
      <p className="text-sm text-gray-500 mb-6">Укажите зону доставки чтобы получать заказы</p>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      <div className="space-y-3 text-left mb-4">
        <button
          onClick={getGeo}
          disabled={geoLoading}
          className="w-full flex items-center justify-center gap-2 border rounded-lg px-4 py-3 text-sm hover:bg-gray-50 transition disabled:opacity-50"
        >
          📍 {geoLoading ? 'Определяем...' : coords ? `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : 'Определить местоположение'}
        </button>

        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-600 shrink-0">Радиус (км)</label>
          <input
            type="range" min="1" max="20" step="1"
            value={radius} onChange={e => setRadius(e.target.value)}
            className="flex-1"
          />
          <span className="text-sm font-semibold w-8 text-right">{radius}</span>
        </div>
      </div>

      <button
        onClick={handleStart}
        disabled={loading || !coords}
        className="w-full bg-black text-white rounded-xl py-3 font-medium disabled:opacity-50"
      >
        {loading ? 'Начинаем...' : 'Начать смену'}
      </button>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function CourierDashboard() {
  const { shift, loading, fetch, end } = useShiftStore();
  const [orders, setOrders] = useState<ActiveOrder[]>([]);
  const [ending, setEnding] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => { fetch(); }, []);

  useEffect(() => {
    if (!shift) return;
    api.get<ActiveOrder[]>('/api/courier/orders/active').then(setOrders).catch(() => {});
  }, [shift?.id]);

  async function handleEnd() {
    if (!confirm('Завершить смену?')) return;
    setEnding(true);
    try { await end(); } finally { setEnding(false); }
  }

  async function updateStatus(orderId: string, status: OrderStatus) {
    setUpdating(orderId);
    try {
      await api.patch(`/api/orders/${orderId}/status`, { status });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Ошибка');
    } finally { setUpdating(null); }
  }

  if (loading) return (
    <div className="max-w-lg mx-auto p-6 space-y-4">
      {[1,2].map(i => <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse" />)}
    </div>
  );

  if (!shift) return <StartShiftForm onStarted={fetch} />;

  return (
    <div className="max-w-lg mx-auto p-6 space-y-6">
      {/* Shift info */}
      <div className="bg-black text-white rounded-2xl p-5 flex items-center justify-between">
        <div>
          <p className="text-sm opacity-70">Смена активна</p>
          <p className="font-semibold mt-0.5">
            Зона {shift.deliveryRadiusKm} км · с {new Date(shift.startedAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <button
          onClick={handleEnd}
          disabled={ending}
          className="bg-white text-black text-sm font-medium rounded-xl px-4 py-2 hover:bg-gray-100 transition disabled:opacity-50"
        >
          {ending ? '...' : 'Завершить'}
        </button>
      </div>

      {/* Active orders */}
      <div>
        <h2 className="font-semibold mb-3">Мои заказы</h2>

        {orders.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <p className="text-3xl mb-2">📭</p>
            <p className="text-sm">Нет активных заказов</p>
            <a href="/courier/orders" className="text-sm text-black underline mt-2 inline-block">Найти заказы →</a>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => {
              const action = COURIER_ACTIONS[order.status];
              return (
                <div key={order.id} className="bg-white border rounded-xl overflow-hidden">
                  <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
                    <p className="font-semibold text-sm">{order.org.name}</p>
                    <StatusBadge status={order.status} />
                  </div>
                  <div className="px-4 py-3 space-y-2">
                    <div className="flex items-start gap-2 text-sm">
                      <span className="text-gray-400 shrink-0">🏪</span>
                      <span>{order.tradePoint.address}</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <span className="text-gray-400 shrink-0">📍</span>
                      <span>{order.deliveryAddress}</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {order.items.map(i => `${i.menuItem.name} ×${i.quantity}`).join(', ')}
                    </div>
                  </div>
                  <div className="px-4 py-3 border-t flex items-center justify-between">
                    <span className="font-bold">{order.totalPrice} ₽</span>
                    {action && (
                      <button
                        onClick={() => updateStatus(order.id, action.next)}
                        disabled={updating === order.id}
                        className="bg-black text-white text-sm rounded-xl px-4 py-2 hover:bg-gray-800 transition disabled:opacity-50"
                      >
                        {updating === order.id ? '...' : action.label}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
