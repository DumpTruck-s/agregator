'use client';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { MapPin, X, Plus } from 'lucide-react';
import { useOrgStore, type OrgCategory } from '@/lib/store/org';
import { useLocaleStore } from '@/lib/store/locale';
import { api } from '@/lib/api';
import { ImageUpload } from '@/components/ui/image-upload';
import type { MapPoint } from '@/components/maps/MapPicker';

const MapPicker  = dynamic(() => import('@/components/maps/MapPicker').then(m => m.MapPicker),    { ssr: false, loading: () => <div className="h-[300px] bg-muted rounded-xl animate-pulse" /> });
const MapZoneView = dynamic(() => import('@/components/maps/MapZoneView').then(m => m.MapZoneView), { ssr: false, loading: () => <div className="h-[250px] bg-muted rounded-xl animate-pulse" /> });

const INPUT = 'border border-border bg-muted rounded-xl px-3.5 py-2.5 text-sm text-text placeholder:text-subtle/60 focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent transition-all w-full';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-subtle uppercase tracking-wider">{label}</label>{children}</div>;
}

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
    <button onClick={() => setOpen(true)} className="text-sm border border-border bg-card rounded-xl px-4 py-2 text-subtle hover:text-text hover:shadow-theme-sm transition-all active:scale-95">
      {om.addPoint}
    </button>
  );

  return (
    <form onSubmit={handleSubmit} className="border border-border bg-card rounded-2xl p-4 space-y-3 animate-scale-in shadow-theme-sm">
      <p className="font-medium text-sm text-text">{om.newPoint}</p>
      <p className="text-xs text-subtle">{om.mapHint}</p>
      <MapPicker value={point} onChange={setPoint} height="300px" />
      {point && (
        <div className="flex items-center gap-2 text-xs text-subtle bg-muted rounded-lg px-3 py-2">
          <MapPin className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
          <span className="truncate">{point.address}</span>
        </div>
      )}
      <Field label={om.radiusLabel}>
        <input className={INPUT} type="number" min="0.5" step="0.5" value={radius} onChange={e => setRadius(e.target.value)} required />
      </Field>
      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={loading || !point} className="bg-accent text-accent-fg rounded-xl px-4 py-2 text-sm hover:opacity-90 active:scale-95 transition-all disabled:opacity-50">
          {loading ? t.common.unknown : om.save}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-sm text-subtle hover:text-text transition-colors">{om.cancel}</button>
      </div>
    </form>
  );
}

function AddCategoryForm({ orgId, onAdded }: { orgId: string; onAdded: () => void }) {
  const [name, setName]     = useState('');
  const [loading, setLoading] = useState(false);
  const [open, setOpen]     = useState(false);
  const t = useLocaleStore(s => s.t);
  const om = t.owner.menu;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true);
    try { await api.post(`/api/orgs/${orgId}/categories`, { name, sortOrder: 0 }); setName(''); setOpen(false); onAdded(); }
    catch (e) { alert(e instanceof Error ? e.message : t.common.error); }
    finally { setLoading(false); }
  }

  if (!open) return (
    <button onClick={() => setOpen(true)} className="text-sm border-2 border-dashed border-border rounded-2xl px-4 py-3 w-full text-subtle hover:border-accent/40 hover:text-text transition-all">
      {om.addCategory}
    </button>
  );

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 animate-scale-in">
      <input className={INPUT} placeholder={om.categoryPlaceholder} value={name} onChange={e => setName(e.target.value)} autoFocus required />
      <button type="submit" disabled={loading} className="bg-accent text-accent-fg rounded-xl px-4 text-sm shrink-0 hover:opacity-90 active:scale-95 transition-all disabled:opacity-50">{om.add}</button>
      <button type="button" onClick={() => setOpen(false)} className="text-subtle hover:text-text shrink-0 transition-colors p-2">
        <X className="w-4 h-4" strokeWidth={2} />
      </button>
    </form>
  );
}

function AddItemForm({ orgId, categoryId, onAdded }: { orgId: string; categoryId: string; onAdded: () => void }) {
  const [form, setForm]     = useState({ name: '', description: '', price: '', image: '' });
  const [loading, setLoading] = useState(false);
  const [open, setOpen]     = useState(false);
  const t = useLocaleStore(s => s.t);
  const om = t.owner.menu;

  const f = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(v => ({...v, [field]: e.target.value}));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true);
    try {
      await api.post(`/api/orgs/${orgId}/items`, { categoryId, name: form.name, description: form.description || undefined, price: parseFloat(form.price), image: form.image || undefined, isAvailable: true });
      setForm({ name: '', description: '', price: '', image: '' }); setOpen(false); onAdded();
    } catch (e) { alert(e instanceof Error ? e.message : t.common.error); }
    finally { setLoading(false); }
  }

  if (!open) return (
    <button onClick={() => setOpen(true)} className="text-xs text-subtle hover:text-text transition-colors flex items-center gap-1 py-1">
      <Plus className="w-3.5 h-3.5" strokeWidth={2} />
      {om.addItem.replace('+ ', '')}
    </button>
  );

  return (
    <form onSubmit={handleSubmit} className="bg-muted rounded-xl p-3 space-y-2 mt-2 animate-scale-in">
      <div className="grid grid-cols-2 gap-2">
        <input className={INPUT} placeholder={om.itemNamePlaceholder} value={form.name} onChange={f('name')} autoFocus required />
        <input className={INPUT} type="number" placeholder={om.itemPricePlaceholder} value={form.price} onChange={f('price')} min="1" step="0.01" required />
      </div>
      <input className={INPUT} placeholder={om.itemDescPlaceholder} value={form.description} onChange={f('description')} />
      <ImageUpload value={form.image} onChange={url => setForm(v => ({...v, image: url}))} placeholder={om.photoPlaceholder} />
      <div className="flex gap-2">
        <button type="submit" disabled={loading} className="bg-accent text-accent-fg rounded-lg px-3 py-1.5 text-xs hover:opacity-90 active:scale-95 transition-all disabled:opacity-50">
          {loading ? t.common.unknown : om.add}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-xs text-subtle hover:text-text transition-colors">{om.cancel}</button>
      </div>
    </form>
  );
}

function CategorySection({ cat, orgId, onRefresh }: { cat: OrgCategory; orgId: string; onRefresh: () => void }) {
  const t = useLocaleStore(s => s.t);
  const om = t.owner.menu;

  async function toggleItem(itemId: string) {
    try { await api.patch(`/api/orgs/items/${itemId}/toggle`, {}); onRefresh(); }
    catch (e) { alert(e instanceof Error ? e.message : t.common.error); }
  }

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-theme-sm">
      <div className="px-4 py-3 border-b border-border bg-muted/50 font-semibold text-sm text-text">{cat.name}</div>
      <div className="divide-y divide-border">
        {cat.items.length === 0 && <p className="px-4 py-3 text-sm text-subtle">{om.noItems}</p>}
        {cat.items.map(item => (
          <div key={item.id} className={`flex items-center justify-between px-4 py-3 transition-opacity ${!item.isAvailable ? 'opacity-40' : ''}`}>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-text">{item.name}</p>
              {item.description && <p className="text-xs text-subtle truncate">{item.description}</p>}
            </div>
            <div className="flex items-center gap-4 ml-4 shrink-0">
              <span className="font-semibold text-sm text-text">{item.price} ₽</span>
              <button onClick={() => toggleItem(item.id)}
                className={`relative w-10 h-6 rounded-full transition-colors duration-300 ${item.isAvailable ? 'bg-accent' : 'bg-border'}`}>
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-300 ${item.isAvailable ? 'translate-x-5' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
        ))}
        <div className="px-4 py-2">
          <AddItemForm orgId={orgId} categoryId={cat.id} onAdded={onRefresh} />
        </div>
      </div>
    </div>
  );
}

export default function OwnerMenuPage() {
  const { org, loading, fetch } = useOrgStore();
  const t = useLocaleStore(s => s.t);
  const om = t.owner.menu;

  useEffect(() => { fetch(); }, []);

  if (loading) return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      {[1,2,3].map(i => <div key={i} className="h-32 bg-muted rounded-2xl animate-pulse" />)}
    </div>
  );

  if (!org) return <div className="p-6 text-subtle text-center">{om.noOrg}</div>;

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6 animate-fade-in">
      <section>
        <h2 className="font-semibold text-text mb-3">{om.tradePoints}</h2>
        {org.tradePoints.length === 0
          ? <p className="text-sm text-subtle mb-3">{om.noTradePoints}</p>
          : (
            <div className="space-y-3 mb-3">
              {org.tradePoints.map(tp => (
                <div key={tp.id} className="bg-card border border-border rounded-xl overflow-hidden">
                  <div className="px-4 py-3 text-sm flex justify-between text-text">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-subtle shrink-0" strokeWidth={2} />
                      <span>{tp.address}</span>
                    </div>
                    <span className="text-subtle">{om.radius} {tp.deliveryRadiusKm} {t.common.km}</span>
                  </div>
                  <MapZoneView zones={[{ lat: tp.lat, lng: tp.lng, radiusKm: tp.deliveryRadiusKm }]} height="200px" />
                </div>
              ))}
            </div>
          )
        }
        <AddTradePointForm orgId={org.id} onAdded={fetch} />
      </section>

      <section>
        <h2 className="font-semibold text-text mb-3">{om.menuSection}</h2>
        <div className="space-y-4">
          {org.categories.map((cat, i) => (
            <div key={cat.id} className="animate-slide-up" style={{ animationDelay: `${i * 0.06}s` }}>
              <CategorySection cat={cat} orgId={org.id} onRefresh={fetch} />
            </div>
          ))}
          <AddCategoryForm orgId={org.id} onAdded={fetch} />
        </div>
      </section>
    </div>
  );
}
