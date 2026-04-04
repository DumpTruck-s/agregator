'use client';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useShiftStore } from '@/lib/store/shift';
import { api } from '@/lib/api';
import { StatusBadge } from '@/components/orders/status-badge';
import type { OrderStatus } from '@delivery/shared';
import type { MapPoint } from '@/components/maps/MapPicker';

const MapPicker = dynamic(() => import('@/components/maps/MapPicker').then(m => m.MapPicker), { ssr: false, loading: () => <div className="h-[280px] bg-muted rounded-xl animate-pulse" /> });
const MapZoneView = dynamic(() => import('@/components/maps/MapZoneView').then(m => m.MapZoneView), { ssr: false, loading: () => <div className="h-[200px] bg-muted rounded-xl animate-pulse" /> });
const OrderTrackingMap = dynamic(() => import('@/components/maps/OrderTrackingMap').then(m => m.OrderTrackingMap), { ssr: false, loading: () => <div className="h-[200px] bg-muted rounded-xl animate-pulse" /> });

interface ActiveOrder {
  id: string; status: OrderStatus; totalPrice: number; deliveryAddress: string;
  deliveryLat: number; deliveryLng: number;
  org: { name: string }; tradePoint: { address: string; lat: number; lng: number };
  items: { quantity: number; menuItem: { name: string } }[];
}

const COURIER_ACTIONS: Partial<Record<OrderStatus, { label: string; next: OrderStatus }>> = {
  READY:      { label: 'Забрал у ресторана', next: 'PICKED_UP'  },
  PICKED_UP:  { label: 'В пути',             next: 'DELIVERING' },
  DELIVERING: { label: 'Доставил',           next: 'DELIVERED'  },
};

function StartShiftForm({ onStarted }: { onStarted: () => void }) {
  const { start } = useShiftStore();
  const [radius, setRadius]   = useState('5');
  const [point, setPoint]     = useState<MapPoint | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  function getGeo() {
    if (!navigator.geolocation) return;
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setPoint({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoLoading(false);
      },
      () => setGeoLoading(false),
    );
  }

  async function handleStart() {
    if (!point) { setError('Выберите зону на карте'); return; }
    setError(''); setLoading(true);
    try { await start(point.lat, point.lng, parseFloat(radius)); onStarted(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Ошибка'); }
    finally { setLoading(false); }
  }

  return (
    <div className="max-w-lg mx-auto mt-8 bg-card border border-border rounded-2xl p-6 shadow-theme-md animate-scale-in">
      <div className="text-center mb-5">
        <div className="text-4xl mb-2">🛵</div>
        <h2 className="text-xl font-bold text-text">Начать смену</h2>
        <p className="text-sm text-subtle mt-1">Выберите центр зоны доставки на карте</p>
      </div>
      {error && <p className="text-sm text-red-500 dark:text-red-400 mb-4">{error}</p>}
      <div className="space-y-4">
        <MapPicker value={point} onChange={setPoint} height="280px" />
        <button onClick={getGeo} disabled={geoLoading}
          className="w-full flex items-center justify-center gap-2 border border-border bg-muted rounded-xl px-4 py-2.5 text-sm text-subtle hover:text-text transition-all disabled:opacity-50 active:scale-95">
          📍 {geoLoading ? 'Определяем...' : 'Использовать моё местоположение'}
        </button>
        {point && (
          <p className="text-xs text-subtle truncate">Зона: {point.address ?? `${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`}</p>
        )}
        <div className="flex items-center gap-3">
          <label className="text-sm text-subtle shrink-0">Радиус (км)</label>
          <input type="range" min="1" max="20" step="1" value={radius} onChange={e => setRadius(e.target.value)} className="flex-1 accent-current" />
          <span className="text-sm font-bold text-text w-8 text-right">{radius}</span>
        </div>
        <button onClick={handleStart} disabled={loading || !point}
          className="w-full bg-accent text-accent-fg rounded-2xl py-3 font-semibold hover:opacity-90 active:scale-95 transition-all disabled:opacity-50">
          {loading ? 'Начинаем...' : 'Начать смену'}
        </button>
      </div>
    </div>
  );
}

export default function CourierDashboard() {
  const { shift, loading, fetch, end } = useShiftStore();
  const [orders, setOrders]   = useState<ActiveOrder[]>([]);
  const [ending, setEnding]   = useState(false);
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
      setOrders(p => p.map(o => o.id === orderId ? { ...o, status } : o));
    } catch (e) { alert(e instanceof Error ? e.message : 'Ошибка'); }
    finally { setUpdating(null); }
  }

  if (loading) return (
    <div className="max-w-lg mx-auto p-6 space-y-4">
      {[1,2].map(i => <div key={i} className="h-24 bg-muted rounded-2xl animate-pulse" />)}
    </div>
  );

  if (!shift) return <StartShiftForm onStarted={fetch} />;

  return (
    <div className="max-w-lg mx-auto p-6 space-y-6 animate-fade-in">
      <div className="bg-accent text-accent-fg rounded-2xl p-5 shadow-theme-md">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm opacity-70">Смена активна</p>
            <p className="font-semibold mt-0.5">
              Зона {shift.deliveryRadiusKm} км · с {new Date(shift.startedAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <button onClick={handleEnd} disabled={ending}
            className="bg-accent-fg text-accent text-sm font-medium rounded-xl px-4 py-2 hover:opacity-80 active:scale-95 transition-all disabled:opacity-50">
            {ending ? '...' : 'Завершить'}
          </button>
        </div>
        <MapZoneView
          zones={[{ lat: shift.deliveryZoneLat, lng: shift.deliveryZoneLng, radiusKm: shift.deliveryRadiusKm }]}
          height="200px"
        />
      </div>

      <div>
        <h2 className="font-semibold text-text mb-3">Мои заказы</h2>
        {orders.length === 0 ? (
          <div className="text-center py-10 text-subtle">
            <p className="text-3xl mb-2">📭</p>
            <p className="text-sm">Нет активных заказов</p>
            <a href="/courier/orders" className="text-sm text-text underline mt-2 inline-block">Найти заказы →</a>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order, i) => {
              const action = COURIER_ACTIONS[order.status];
              const hasCoords = order.deliveryLat && order.deliveryLng && order.tradePoint.lat && order.tradePoint.lng;
              return (
                <div key={order.id} className="bg-card border border-border rounded-2xl overflow-hidden shadow-theme-sm animate-slide-up" style={{ animationDelay: `${i * 0.07}s` }}>
                  <div className="px-4 py-3 border-b border-border bg-muted/50 flex items-center justify-between">
                    <p className="font-semibold text-sm text-text">{order.org.name}</p>
                    <StatusBadge status={order.status} />
                  </div>
                  <div className="px-4 py-3 space-y-1">
                    <p className="text-sm text-subtle">🏪 {order.tradePoint.address}</p>
                    <p className="text-sm text-subtle">📍 {order.deliveryAddress}</p>
                    <p className="text-xs text-subtle/70">{order.items.map(i => `${i.menuItem.name} ×${i.quantity}`).join(', ')}</p>
                  </div>
                  {hasCoords && (
                    <div className="px-4 pb-3">
                      <OrderTrackingMap
                        pickup={{ lat: order.tradePoint.lat, lng: order.tradePoint.lng, label: order.tradePoint.address }}
                        delivery={{ lat: order.deliveryLat, lng: order.deliveryLng, label: order.deliveryAddress }}
                        height="200px"
                      />
                    </div>
                  )}
                  <div className="px-4 py-3 border-t border-border flex items-center justify-between">
                    <span className="font-bold text-text">{order.totalPrice} ₽</span>
                    {action && (
                      <button onClick={() => updateStatus(order.id, action.next)} disabled={updating === order.id}
                        className="bg-accent text-accent-fg text-sm rounded-xl px-4 py-2 hover:opacity-90 active:scale-95 transition-all disabled:opacity-50">
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
