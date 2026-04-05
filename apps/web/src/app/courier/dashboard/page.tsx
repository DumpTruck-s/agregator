'use client';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Bike, MapPin, Navigation, Store, Package, Trophy, TrendingUp } from 'lucide-react';
import { useShiftStore } from '@/lib/store/shift';
import { useLocaleStore } from '@/lib/store/locale';
import { api } from '@/lib/api';
import { StatusBadge } from '@/components/orders/status-badge';
import { RatingStars } from '@/components/ui/rating-stars';
import type { OrderStatus } from '@delivery/shared';
import type { MapPoint } from '@/components/maps/MapPicker';

interface CourierStats {
  delivered: number;
  cancelled: number;
  earnings: number;
  rating: number | null;
  ratingCount: number;
  rank: number;
  totalCouriers: number;
}

const MapPicker    = dynamic(() => import('@/components/maps/MapPicker').then(m => m.MapPicker),          { ssr: false, loading: () => <div className="h-[280px] bg-muted rounded-xl animate-pulse" /> });
const MapZoneView  = dynamic(() => import('@/components/maps/MapZoneView').then(m => m.MapZoneView),      { ssr: false, loading: () => <div className="h-[200px] bg-muted rounded-xl animate-pulse" /> });
const OrderTracking= dynamic(() => import('@/components/maps/OrderTrackingMap').then(m => m.OrderTrackingMap), { ssr: false, loading: () => <div className="h-[200px] bg-muted rounded-xl animate-pulse" /> });

interface ActiveOrder {
  id: string; status: OrderStatus; totalPrice: number; deliveryAddress: string;
  deliveryLat: number; deliveryLng: number;
  org: { name: string }; tradePoint: { address: string; lat: number; lng: number };
  items: { quantity: number; menuItem: { name: string } }[];
}

function StartShiftForm({ onStarted }: { onStarted: () => void }) {
  const { start } = useShiftStore();
  const t = useLocaleStore(s => s.t);
  const ss = t.courier.startShift;
  const [radius, setRadius]   = useState('5');
  const [point, setPoint]     = useState<MapPoint | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  function getGeo() {
    if (!navigator.geolocation) return;
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      pos => { setPoint({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setGeoLoading(false); },
      () => setGeoLoading(false),
    );
  }

  async function handleStart() {
    if (!point) { setError(ss.selectZone); return; }
    setError(''); setLoading(true);
    try { await start(point.lat, point.lng, parseFloat(radius)); onStarted(); }
    catch (e) { setError(e instanceof Error ? e.message : t.common.error); }
    finally { setLoading(false); }
  }

  return (
    <div className="max-w-lg mx-auto mt-8 bg-card border border-border rounded-2xl p-6 shadow-theme-md animate-scale-in">
      <div className="text-center mb-5">
        <div className="w-14 h-14 rounded-2xl bg-accent-muted flex items-center justify-center mx-auto mb-3">
          <Bike className="w-7 h-7 text-accent" strokeWidth={1.5} />
        </div>
        <h2 className="font-display text-2xl font-semibold text-text">{ss.title}</h2>
        <p className="text-sm text-subtle mt-1">{ss.subtitle}</p>
      </div>
      {error && <p className="text-sm text-red-500 dark:text-red-400 mb-4">{error}</p>}
      <div className="space-y-4">
        <MapPicker value={point} onChange={setPoint} height="280px" />
        <button onClick={getGeo} disabled={geoLoading}
          className="w-full flex items-center justify-center gap-2 border border-border bg-muted rounded-xl px-4 py-2.5 text-sm text-subtle hover:text-text transition-all disabled:opacity-50 active:scale-95">
          <Navigation className="w-4 h-4" strokeWidth={2} />
          {geoLoading ? ss.locating : ss.useLocation}
        </button>
        {point && (
          <div className="flex items-center gap-2 text-xs text-subtle bg-muted rounded-lg px-3 py-2">
            <MapPin className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
            <span className="truncate">{point.address ?? `${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`}</span>
          </div>
        )}
        <div className="flex items-center gap-3">
          <label className="text-sm text-subtle shrink-0">{ss.radiusLabel}</label>
          <input type="range" min="1" max="20" step="1" value={radius} onChange={e => setRadius(e.target.value)} className="flex-1 accent-current" />
          <span className="text-sm font-bold text-text w-8 text-right">{radius}</span>
        </div>
        <button onClick={handleStart} disabled={loading || !point}
          className="w-full bg-accent text-accent-fg rounded-2xl py-3 font-semibold neon-btn active:scale-95 disabled:opacity-50">
          {loading ? ss.starting : ss.start}
        </button>
      </div>
    </div>
  );
}

export default function CourierDashboard() {
  const { shift, loading, fetch, end } = useShiftStore();
  const t = useLocaleStore(s => s.t);
  const d = t.courier.dashboard;
  const actions = t.courier.actions;
  const [orders, setOrders]   = useState<ActiveOrder[]>([]);
  const [stats, setStats]     = useState<CourierStats | null>(null);
  const [ending, setEnding]   = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);

  const COURIER_ACTIONS: Partial<Record<OrderStatus, { label: string; next: OrderStatus }>> = {
    READY:      { label: actions.READY,      next: 'PICKED_UP'  },
    PICKED_UP:  { label: actions.PICKED_UP,  next: 'DELIVERING' },
    DELIVERING: { label: actions.DELIVERING, next: 'DELIVERED'  },
  };

  useEffect(() => { fetch(); }, []);
  useEffect(() => {
    api.get<CourierStats>('/api/courier/stats').then(setStats).catch(() => {});
  }, []);
  useEffect(() => {
    if (!shift) return;
    api.get<ActiveOrder[]>('/api/courier/orders/active').then(setOrders).catch(() => {});
  }, [shift?.id]);

  async function handleEnd() {
    if (!confirm(d.confirmEnd)) return;
    setEnding(true);
    try { await end(); } finally { setEnding(false); }
  }

  async function updateStatus(orderId: string, status: OrderStatus) {
    setUpdating(orderId);
    try {
      await api.patch(`/api/orders/${orderId}/status`, { status });
      setOrders(p => p.map(o => o.id === orderId ? { ...o, status } : o));
    } catch (e) { alert(e instanceof Error ? e.message : t.common.error); }
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
            <p className="text-sm opacity-70">{d.shiftActive}</p>
            <p className="font-semibold mt-0.5">
              {d.zone} {shift.deliveryRadiusKm} {t.common.km} · {new Date(shift.startedAt).toLocaleTimeString(t.dateLocale, { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <button onClick={handleEnd} disabled={ending}
            className="bg-accent-fg text-accent text-sm font-medium rounded-xl px-4 py-2 hover:opacity-80 active:scale-95 transition-all disabled:opacity-50">
            {ending ? t.common.unknown : d.end}
          </button>
        </div>
        <MapZoneView
          zones={[{ lat: shift.deliveryZoneLat, lng: shift.deliveryZoneLng, radiusKm: shift.deliveryRadiusKm }]}
          height="200px"
        />
      </div>

      {/* Personal rating card */}
      {stats && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-theme-sm neon-card animate-slide-up">
          <div className="px-4 py-3 border-b border-border bg-muted/50 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-accent" strokeWidth={2} />
            <span className="font-semibold text-sm text-text">Мой рейтинг</span>
            {stats.totalCouriers > 0 && (
              <span className="ml-auto text-xs text-subtle">#{stats.rank} из {stats.totalCouriers} курьеров</span>
            )}
          </div>
          <div className="px-4 py-3 flex items-center gap-6 flex-wrap">
            {/* Stars */}
            <div className="flex flex-col gap-1">
              <RatingStars rating={stats.rating} size="md" ratingCount={stats.ratingCount} />
              {stats.rating === null && (
                <p className="text-xs text-subtle">
                  {stats.ratingCount < 3
                    ? `Нужно ещё ${3 - stats.ratingCount} оценки от клиентов`
                    : 'Нет оценок'}
                </p>
              )}
            </div>
            {/* Stats */}
            <div className="flex items-center gap-1.5">
              <Package className="w-4 h-4 text-accent shrink-0" strokeWidth={2} />
              <div>
                <p className="text-sm font-bold text-text">{stats.delivered}</p>
                <p className="text-xs text-subtle leading-none">доставок</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-500 shrink-0" strokeWidth={2} />
              <div>
                <p className="text-sm font-bold text-text">{stats.earnings.toLocaleString('ru-RU')} ₽</p>
                <p className="text-xs text-subtle leading-none">заработано</p>
              </div>
            </div>
            {stats.cancelled > 0 && (
              <div className="ml-auto">
                <p className="text-xs text-subtle/60">{stats.cancelled} отмен</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div>
        <h2 className="font-semibold text-text mb-3">{d.myOrders}</h2>
        {orders.length === 0 ? (
          <div className="text-center py-10 text-subtle">
            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3">
              <Package className="w-5 h-5 text-subtle" strokeWidth={1.5} />
            </div>
            <p className="text-sm">{d.noOrders}</p>
            <a href="/courier/orders" className="text-sm text-accent font-medium mt-2 inline-block hover:opacity-80 transition-opacity">
              {d.findOrders}
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order, i) => {
              const action = COURIER_ACTIONS[order.status];
              const hasCoords = order.deliveryLat && order.deliveryLng && order.tradePoint.lat && order.tradePoint.lng;
              return (
                <div key={order.id} className="bg-card border border-border rounded-2xl overflow-hidden shadow-theme-sm neon-card animate-slide-up" style={{ animationDelay: `${i * 0.07}s` }}>
                  <div className="px-4 py-3 border-b border-border bg-muted/50 flex items-center justify-between">
                    <p className="font-semibold text-sm text-text">{order.org.name}</p>
                    <StatusBadge status={order.status} />
                  </div>
                  <div className="px-4 py-3 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-subtle">
                      <Store className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
                      <p className="text-sm">{order.tradePoint.address}</p>
                    </div>
                    <div className="flex items-center gap-1.5 text-subtle">
                      <MapPin className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
                      <p className="text-sm">{order.deliveryAddress}</p>
                    </div>
                    <p className="text-xs text-subtle/70">{order.items.map(i => `${i.menuItem.name} ×${i.quantity}`).join(', ')}</p>
                  </div>
                  {hasCoords && (
                    <div className="px-4 pb-3">
                      <OrderTracking
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
                        {updating === order.id ? t.common.unknown : action.label}
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
