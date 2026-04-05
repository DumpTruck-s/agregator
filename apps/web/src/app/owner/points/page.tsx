'use client';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { MapPin, X } from 'lucide-react';
import { useOrgStore } from '@/lib/store/org';
import { useLocaleStore } from '@/lib/store/locale';
import { api } from '@/lib/api';
import type { MapPoint } from '@/components/maps/MapPicker';

const MapPicker  = dynamic(() => import('@/components/maps/MapPicker').then(m => m.MapPicker),    { ssr: false, loading: () => <div className="h-[300px] bg-muted rounded-xl animate-pulse" /> });
const MapZoneView = dynamic(() => import('@/components/maps/MapZoneView').then(m => m.MapZoneView), { ssr: false, loading: () => <div className="h-[220px] bg-muted rounded-xl animate-pulse" /> });

const INPUT = 'border border-border bg-muted rounded-xl px-3.5 py-2.5 text-sm text-text placeholder:text-subtle/60 focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent transition-all w-full';

function AddTradePointForm({ orgId, onAdded }: { orgId: string; onAdded: () => void }) {
  const [point, setPoint]   = useState<MapPoint | null>(null);
  const [radius, setRadius] = useState('5');
  const [loading, setLoading] = useState(false);
  const [open, setOpen]     = useState(false);
  const t = useLocaleStore(s => s.t);
  const om = t.owner.menu;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!point) { alert(om.selectMapPoint); return; }
    setLoading(true);
    try {
      await api.post(`/api/orgs/${orgId}/trade-points`, {
        address: point.address ?? `${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`,
        lat: point.lat, lng: point.lng,
        deliveryRadiusKm: parseFloat(radius),
      });
      setOpen(false); setPoint(null); setRadius('5'); onAdded();
    } catch (e) { alert(e instanceof Error ? e.message : t.common.error); }
    finally { setLoading(false); }
  }

  if (!open) return (
    <button onClick={() => setOpen(true)} className="w-full text-sm border border-dashed border-border rounded-2xl px-4 py-3 text-subtle hover:border-accent/40 hover:text-text transition-all">
      + Добавить торговую точку
    </button>
  );

  return (
    <form onSubmit={handleSubmit} className="border border-border bg-card rounded-2xl p-4 space-y-3 animate-scale-in shadow-theme-sm">
      <div className="flex items-center justify-between">
        <p className="font-medium text-sm text-text">{om.newPoint}</p>
        <button type="button" onClick={() => setOpen(false)} className="text-subtle hover:text-text transition-colors">
          <X className="w-4 h-4" strokeWidth={2} />
        </button>
      </div>
      <p className="text-xs text-subtle">{om.mapHint}</p>
      <MapPicker value={point} onChange={setPoint} height="300px" />
      {point && (
        <div className="flex items-center gap-2 text-xs text-subtle bg-muted rounded-lg px-3 py-2">
          <MapPin className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
          <span className="truncate">{point.address}</span>
        </div>
      )}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-subtle uppercase tracking-wider">{om.radiusLabel} (км)</label>
        <input className={INPUT} type="number" min="0.5" step="0.5" value={radius} onChange={e => setRadius(e.target.value)} required />
      </div>
      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={loading || !point} className="bg-accent text-accent-fg rounded-xl px-4 py-2 text-sm neon-btn active:scale-95 disabled:opacity-50">
          {loading ? t.common.unknown : om.save}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-sm text-subtle hover:text-text transition-colors">{om.cancel}</button>
      </div>
    </form>
  );
}

export default function OwnerPointsPage() {
  const { org, loading, fetch } = useOrgStore();
  const t = useLocaleStore(s => s.t);

  useEffect(() => { fetch(); }, []);

  if (loading) return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      {[1, 2].map(i => <div key={i} className="h-64 bg-muted rounded-2xl animate-pulse" />)}
    </div>
  );

  if (!org) return <div className="p-6 text-subtle text-center">Ресторан не найден</div>;

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4 animate-fade-in">
      <h1 className="font-display text-2xl font-semibold text-text">Торговые точки</h1>
      <p className="text-sm text-subtle -mt-2">Адреса откуда курьеры забирают заказы и зоны доставки</p>

      {org.tradePoints.length === 0 && (
        <p className="text-sm text-subtle py-4">Нет торговых точек — добавьте первую</p>
      )}

      {org.tradePoints.map((tp, i) => (
        <div key={tp.id} className="bg-card border border-border rounded-2xl overflow-hidden shadow-theme-sm neon-card animate-slide-up" style={{ animationDelay: `${i * 0.07}s` }}>
          <div className="px-4 py-3 flex items-center justify-between border-b border-border">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                <MapPin className="w-3.5 h-3.5 text-accent" strokeWidth={2} />
              </div>
              <span className="text-sm font-medium text-text truncate">{tp.address}</span>
            </div>
            <span className="text-xs text-subtle shrink-0 ml-3 bg-muted rounded-lg px-2 py-1">
              {tp.deliveryRadiusKm} км
            </span>
          </div>
          <MapZoneView
            zones={[{ lat: tp.lat, lng: tp.lng, radiusKm: tp.deliveryRadiusKm, label: tp.address }]}
            height="220px"
          />
        </div>
      ))}

      <AddTradePointForm orgId={org.id} onAdded={fetch} />
    </div>
  );
}
