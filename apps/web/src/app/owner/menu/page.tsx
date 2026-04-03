'use client';
import { useEffect, useState } from 'react';
import { useOrgStore, type OrgCategory } from '@/lib/store/org';
import { api } from '@/lib/api';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-600">{label}</label>
      {children}
    </div>
  );
}

const INPUT = 'border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black w-full';

// ─── Add trade point ──────────────────────────────────────────────────────────
function AddTradePointForm({ orgId, onAdded }: { orgId: string; onAdded: () => void }) {
  const [form, setForm] = useState({ address: '', lat: '', lng: '', deliveryRadiusKm: '5' });
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post(`/api/orgs/${orgId}/trade-points`, {
        address: form.address,
        lat: parseFloat(form.lat),
        lng: parseFloat(form.lng),
        deliveryRadiusKm: parseFloat(form.deliveryRadiusKm),
      });
      setOpen(false);
      setForm({ address: '', lat: '', lng: '', deliveryRadiusKm: '5' });
      onAdded();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setLoading(false);
    }
  }

  if (!open) return (
    <button onClick={() => setOpen(true)} className="text-sm border rounded-lg px-4 py-2 hover:bg-gray-50 transition">
      + Добавить точку
    </button>
  );

  return (
    <form onSubmit={handleSubmit} className="border rounded-xl p-4 bg-white space-y-3">
      <p className="font-medium text-sm">Новая торговая точка</p>
      <Field label="Адрес"><input className={INPUT} placeholder="ул. Ленина, 1" value={form.address} onChange={e => setForm(f => ({...f, address: e.target.value}))} required /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Широта"><input className={INPUT} placeholder="55.7558" value={form.lat} onChange={e => setForm(f => ({...f, lat: e.target.value}))} required /></Field>
        <Field label="Долгота"><input className={INPUT} placeholder="37.6176" value={form.lng} onChange={e => setForm(f => ({...f, lng: e.target.value}))} required /></Field>
      </div>
      <Field label="Радиус доставки (км)"><input className={INPUT} type="number" min="0.5" step="0.5" value={form.deliveryRadiusKm} onChange={e => setForm(f => ({...f, deliveryRadiusKm: e.target.value}))} required /></Field>
      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={loading} className="bg-black text-white rounded-lg px-4 py-2 text-sm disabled:opacity-50">{loading ? 'Сохраняем...' : 'Сохранить'}</button>
        <button type="button" onClick={() => setOpen(false)} className="text-sm text-gray-500 hover:text-black">Отмена</button>
      </div>
    </form>
  );
}

// ─── Add category ─────────────────────────────────────────────────────────────
function AddCategoryForm({ orgId, onAdded }: { orgId: string; onAdded: () => void }) {
  const [name, setName]     = useState('');
  const [loading, setLoading] = useState(false);
  const [open, setOpen]     = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post(`/api/orgs/${orgId}/categories`, { name, sortOrder: 0 });
      setName(''); setOpen(false); onAdded();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка');
    } finally { setLoading(false); }
  }

  if (!open) return (
    <button onClick={() => setOpen(true)} className="text-sm border-2 border-dashed border-gray-300 rounded-xl px-4 py-3 w-full text-gray-500 hover:border-gray-400 hover:text-gray-700 transition">
      + Новая категория
    </button>
  );

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input className={INPUT} placeholder="Название категории" value={name} onChange={e => setName(e.target.value)} autoFocus required />
      <button type="submit" disabled={loading} className="bg-black text-white rounded-lg px-4 text-sm shrink-0 disabled:opacity-50">Добавить</button>
      <button type="button" onClick={() => setOpen(false)} className="text-sm text-gray-400 hover:text-black shrink-0">✕</button>
    </form>
  );
}

// ─── Add menu item ────────────────────────────────────────────────────────────
function AddItemForm({ orgId, categoryId, onAdded }: { orgId: string; categoryId: string; onAdded: () => void }) {
  const [form, setForm] = useState({ name: '', description: '', price: '' });
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  function f(field: string) { return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(v => ({...v, [field]: e.target.value})); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post(`/api/orgs/${orgId}/items`, {
        categoryId,
        name: form.name,
        description: form.description || undefined,
        price: parseFloat(form.price),
        isAvailable: true,
      });
      setForm({ name: '', description: '', price: '' }); setOpen(false); onAdded();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка');
    } finally { setLoading(false); }
  }

  if (!open) return (
    <button onClick={() => setOpen(true)} className="text-xs text-gray-400 hover:text-black transition flex items-center gap-1 py-1">
      + позиция
    </button>
  );

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 rounded-lg p-3 space-y-2 mt-2">
      <div className="grid grid-cols-2 gap-2">
        <input className={INPUT} placeholder="Название" value={form.name} onChange={f('name')} autoFocus required />
        <input className={INPUT} type="number" placeholder="Цена, ₽" value={form.price} onChange={f('price')} min="1" step="0.01" required />
      </div>
      <input className={INPUT} placeholder="Описание (необязательно)" value={form.description} onChange={f('description')} />
      <div className="flex gap-2">
        <button type="submit" disabled={loading} className="bg-black text-white rounded-lg px-3 py-1.5 text-xs disabled:opacity-50">{loading ? '...' : 'Добавить'}</button>
        <button type="button" onClick={() => setOpen(false)} className="text-xs text-gray-400 hover:text-black">Отмена</button>
      </div>
    </form>
  );
}

// ─── Category section ─────────────────────────────────────────────────────────
function CategorySection({ cat, orgId, onRefresh }: { cat: OrgCategory; orgId: string; onRefresh: () => void }) {
  async function toggleItem(itemId: string) {
    try {
      await api.patch(`/api/orgs/items/${itemId}/toggle`, {});
      onRefresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка');
    }
  }

  return (
    <div className="bg-white border rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b bg-gray-50 font-semibold text-sm">{cat.name}</div>
      <div className="divide-y">
        {cat.items.length === 0 && (
          <p className="px-4 py-3 text-sm text-gray-400">Нет позиций</p>
        )}
        {cat.items.map(item => (
          <div key={item.id} className={`flex items-center justify-between px-4 py-3 ${!item.isAvailable ? 'opacity-50' : ''}`}>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{item.name}</p>
              {item.description && <p className="text-xs text-gray-500 truncate">{item.description}</p>}
            </div>
            <div className="flex items-center gap-4 ml-4 shrink-0">
              <span className="font-semibold text-sm">{item.price} ₽</span>
              <button
                onClick={() => toggleItem(item.id)}
                className={`relative w-10 h-6 rounded-full transition-colors ${item.isAvailable ? 'bg-black' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${item.isAvailable ? 'translate-x-5' : 'translate-x-1'}`} />
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

// ─── Main page ────────────────────────────────────────────────────────────────
export default function OwnerMenuPage() {
  const { org, loading, fetch } = useOrgStore();

  useEffect(() => { fetch(); }, []);

  if (loading) return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      {[1,2,3].map(i => <div key={i} className="h-32 bg-gray-200 rounded-xl animate-pulse" />)}
    </div>
  );

  if (!org) return <div className="p-6 text-gray-500 text-center">Сначала создайте ресторан на главной странице</div>;

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Trade points */}
      <section>
        <h2 className="font-semibold mb-3">Торговые точки</h2>
        {org.tradePoints.length === 0
          ? <p className="text-sm text-gray-500 mb-3">Нет торговых точек — покупатели не смогут сделать заказ</p>
          : (
            <div className="space-y-2 mb-3">
              {org.tradePoints.map(tp => (
                <div key={tp.id} className="bg-white border rounded-xl px-4 py-3 text-sm flex justify-between">
                  <span>📍 {tp.address}</span>
                  <span className="text-gray-500">радиус {tp.deliveryRadiusKm} км</span>
                </div>
              ))}
            </div>
          )
        }
        <AddTradePointForm orgId={org.id} onAdded={fetch} />
      </section>

      {/* Menu */}
      <section>
        <h2 className="font-semibold mb-3">Меню</h2>
        <div className="space-y-4">
          {org.categories.map(cat => (
            <CategorySection key={cat.id} cat={cat} orgId={org.id} onRefresh={fetch} />
          ))}
          <AddCategoryForm orgId={org.id} onAdded={fetch} />
        </div>
      </section>
    </div>
  );
}
