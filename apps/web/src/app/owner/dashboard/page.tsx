'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { useOrgStore } from '@/lib/store/org';
import { useLocaleStore } from '@/lib/store/locale';
import { api } from '@/lib/api';
import { ImageUpload } from '@/components/ui/image-upload';
import { StatusBadge } from '@/components/orders/status-badge';
import type { OrderStatus } from '@delivery/shared';

interface Order {
  id: string; status: OrderStatus; totalPrice: number; createdAt: string;
  customer: { name: string };
  items: { quantity: number; menuItem: { name: string } }[];
}

function CreateOrgForm({ onCreated }: { onCreated: () => void }) {
  const [name, setName]       = useState('');
  const [desc, setDesc]       = useState('');
  const [logo, setLogo]       = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const t = useLocaleStore(s => s.t);
  const oc = t.owner.createOrg;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true);
    try { await api.post('/api/orgs', { name, description: desc || undefined, logo: logo || undefined }); onCreated(); }
    catch (err) { setError(err instanceof Error ? err.message : oc.error); setLoading(false); }
  }

  return (
    <div className="max-w-md mx-auto mt-16 bg-card border border-border rounded-2xl p-8 shadow-theme-md animate-scale-in">
      <h2 className="font-display text-2xl font-semibold text-text mb-1">{oc.title}</h2>
      <p className="text-sm text-subtle mb-6">{oc.subtitle}</p>
      {error && <p className="text-sm text-red-500 dark:text-red-400 mb-4">{error}</p>}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <ImageUpload value={logo} onChange={setLogo} placeholder={oc.logoPlaceholder} />
        <input
          className="border border-border bg-muted rounded-xl px-3.5 py-2.5 text-sm text-text placeholder:text-subtle/60 focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent transition-all"
          placeholder={oc.namePlaceholder} value={name} onChange={e => setName(e.target.value)} required
        />
        <textarea
          className="border border-border bg-muted rounded-xl px-3.5 py-2.5 text-sm text-text placeholder:text-subtle/60 focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent transition-all resize-none"
          placeholder={oc.descPlaceholder} rows={3} value={desc} onChange={e => setDesc(e.target.value)}
        />
        <button className="bg-accent text-accent-fg rounded-xl py-2.5 text-sm font-semibold hover:opacity-90 active:scale-95 transition-all disabled:opacity-50" disabled={loading}>
          {loading ? oc.creating : oc.submit}
        </button>
      </form>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-theme-sm hover:shadow-theme-md transition-all duration-300">
      <p className="text-sm text-subtle">{label}</p>
      <p className="font-display text-2xl font-semibold text-text mt-1">{value}</p>
    </div>
  );
}

export default function OwnerDashboard() {
  const { org, loading, fetch } = useOrgStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const t = useLocaleStore(s => s.t);
  const od = t.owner.dashboard;

  useEffect(() => { fetch(); }, []);
  useEffect(() => {
    if (!org) return;
    api.get<Order[]>('/api/orders/org').then(setOrders).catch(() => {});
  }, [org?.id]);

  if (loading) return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      {[1,2,3].map(i => <div key={i} className="h-20 bg-muted rounded-2xl animate-pulse" />)}
    </div>
  );

  if (!org) return <CreateOrgForm onCreated={fetch} />;

  const today        = new Date().toDateString();
  const todayOrders  = orders.filter(o => new Date(o.createdAt).toDateString() === today);
  const activeOrders = orders.filter(o => !['DELIVERED','CANCELLED'].includes(o.status));
  const revenue      = todayOrders.reduce((s, o) => s + o.totalPrice, 0);

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-text">{org.name}</h1>
          <div className="flex items-center gap-1.5 mt-1 text-subtle">
            {org.isVerified
              ? <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" strokeWidth={2} /><span className="text-sm">{od.verified}</span></>
              : <><Clock className="w-3.5 h-3.5" strokeWidth={2} /><span className="text-sm">{od.pending}</span></>
            }
          </div>
        </div>
        <Link href="/owner/menu" className="text-sm border border-border bg-card rounded-xl px-4 py-2 text-subtle hover:text-text hover:shadow-theme-sm transition-all">
          {od.goToMenu}
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: od.ordersToday, value: todayOrders.length },
          { label: od.revenueToday, value: `${revenue} ₽` },
          { label: od.active,       value: activeOrders.length },
        ].map((s, i) => (
          <div key={i} className="animate-slide-up" style={{ animationDelay: `${i * 0.08}s` }}>
            <StatCard {...s} />
          </div>
        ))}
      </div>

      {activeOrders.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-text">{od.activeOrders}</h2>
            <Link href="/owner/orders" className="text-sm text-subtle hover:text-text transition-colors">{od.seeAll}</Link>
          </div>
          <div className="space-y-3">
            {activeOrders.slice(0, 3).map((order, i) => (
              <div key={order.id} className="bg-card border border-border rounded-2xl px-4 py-3 flex items-center justify-between animate-slide-up shadow-theme-sm" style={{ animationDelay: `${i * 0.07}s` }}>
                <div>
                  <p className="font-medium text-text">{order.customer.name}</p>
                  <p className="text-sm text-subtle">{order.items.map(i => `${i.menuItem.name} ×${i.quantity}`).join(', ')}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-text">{order.totalPrice} ₽</span>
                  <StatusBadge status={order.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {org.tradePoints.length === 0 && (
        <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-2xl px-4 py-3 text-sm text-amber-800 dark:text-amber-300 animate-slide-up">
          <AlertTriangle className="w-4 h-4 shrink-0" strokeWidth={2} />
          <span>{od.addTradePointHint} <Link href="/owner/menu" className="underline font-medium">{t.ownerNav.menu}</Link></span>
        </div>
      )}
    </div>
  );
}
