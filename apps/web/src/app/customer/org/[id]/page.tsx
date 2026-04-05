'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { MapPin, Utensils, AlertTriangle, Plus, Minus, Store } from 'lucide-react';
import { api } from '@/lib/api';
import { useCartStore } from '@/lib/store/cart';
import { useLocaleStore } from '@/lib/store/locale';

const MapZoneView = dynamic(
  () => import('@/components/maps/MapZoneView').then(m => m.MapZoneView),
  { ssr: false, loading: () => <div className="h-[220px] bg-muted rounded-xl animate-pulse" /> }
);

interface TradePoint { id: string; address: string; lat: number; lng: number; deliveryRadiusKm: number }
interface OrgDetails  { id: string; name: string; description?: string; logo?: string; tradePoints: TradePoint[] }
interface MenuItem    { id: string; name: string; price: number; description?: string; image?: string }
interface Category    { id: string; name: string; items: MenuItem[] }

const POINTS_TAB = '__points__';

export default function OrgMenuPage() {
  const { id } = useParams<{ id: string }>();
  const [org, setOrg]   = useState<OrgDetails | null>(null);
  const [menu, setMenu] = useState<Category[]>([]);
  const [loading, setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const t = useLocaleStore(s => s.t);

  const { items: cartItems, addItem, decreaseItem } = useCartStore();

  useEffect(() => {
    Promise.all([
      api.get<OrgDetails>(`/api/orgs/${id}`),
      api.get<Category[]>(`/api/orgs/${id}/menu`),
    ])
      .then(([orgData, menuData]) => {
        setOrg(orgData);
        setMenu(menuData);
        if (menuData[0]) setActiveTab(menuData[0].id);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  function getQty(menuItemId: string) {
    return cartItems.find(i => i.menuItemId === menuItemId)?.quantity ?? 0;
  }

  function handleAdd(item: MenuItem) {
    if (!org?.tradePoints[0]) return;
    addItem(org.id, org.tradePoints[0].id, { menuItemId: item.id, name: item.name, price: item.price });
  }

  if (loading) return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-16 bg-muted rounded-2xl animate-pulse" />
      ))}
    </div>
  );

  if (!org) return <div className="p-6 text-subtle text-center">{t.orgMenu.notFound}</div>;

  if (!org.tradePoints.length) return (
    <div className="max-w-2xl mx-auto p-6 text-center text-subtle py-16">
      <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
        <AlertTriangle className="w-6 h-6 text-subtle" strokeWidth={1.5} />
      </div>
      <p>{t.orgMenu.noPickup}</p>
    </div>
  );

  const visibleCategories = menu.filter(c => c.items.length > 0);

  return (
    <div className="max-w-2xl mx-auto pb-24 animate-fade-in">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 py-5">
        <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-3 overflow-hidden">
          {org.logo
            ? <img src={org.logo} alt={org.name} className="w-full h-full object-cover" />
            : <Utensils className="w-6 h-6 text-subtle" strokeWidth={1.5} />
          }
        </div>
        <h1 className="font-display text-2xl font-semibold text-text">{org.name}</h1>
        {org.description && <p className="text-sm text-subtle mt-1">{org.description}</p>}
        <div className="flex items-center gap-1.5 mt-2 text-subtle">
          <MapPin className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
          <p className="text-xs">{org.tradePoints[0].address}</p>
        </div>
      </div>

      {/* Tabs: categories + points */}
      <div className="flex gap-2 overflow-x-auto px-6 py-3 bg-card border-b border-border sticky top-[57px] z-10 scrollbar-hide">
        {visibleCategories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveTab(cat.id)}
            className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
              activeTab === cat.id
                ? 'bg-accent text-accent-fg'
                : 'bg-muted text-subtle hover:bg-border hover:text-text'
            }`}
          >
            {cat.name}
          </button>
        ))}
        <button
          onClick={() => setActiveTab(POINTS_TAB)}
          className={`shrink-0 flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
            activeTab === POINTS_TAB
              ? 'bg-accent text-accent-fg'
              : 'bg-muted text-subtle hover:bg-border hover:text-text'
          }`}
        >
          <Store className="w-3.5 h-3.5" strokeWidth={2} />
          Точки
        </button>
      </div>

      {/* Trade points view */}
      {activeTab === POINTS_TAB && (
        <div className="px-6 pt-4 space-y-4 animate-fade-in">
          {org.tradePoints.map(tp => (
            <div key={tp.id} className="bg-card border border-border rounded-2xl overflow-hidden shadow-theme-sm">
              <div className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <MapPin className="w-4 h-4 text-accent shrink-0" strokeWidth={2} />
                  <span className="text-sm font-medium text-text truncate">{tp.address}</span>
                </div>
                <span className="text-xs text-subtle shrink-0 ml-3">
                  Зона {tp.deliveryRadiusKm} км
                </span>
              </div>
              <MapZoneView
                zones={[{ lat: tp.lat, lng: tp.lng, radiusKm: tp.deliveryRadiusKm, label: tp.address }]}
                height="220px"
              />
            </div>
          ))}
        </div>
      )}

      {/* Menu items */}
      {activeTab !== POINTS_TAB && (
        <div className="px-6 pt-4 space-y-8">
          {visibleCategories
            .filter(cat => !activeTab || cat.id === activeTab)
            .map((cat, ci) => (
              <section key={cat.id} className="animate-slide-up" style={{ animationDelay: `${ci * 0.05}s` }}>
                <h2 className="font-display text-xl font-semibold text-text mb-3">{cat.name}</h2>
                <div className="space-y-3">
                  {cat.items.map((item, ii) => {
                    const qty = getQty(item.id);
                    return (
                      <div
                        key={item.id}
                        className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3 hover:shadow-theme-sm hover:border-accent/20 transition-all duration-200 animate-slide-up"
                        style={{ animationDelay: `${(ci * 4 + ii) * 0.04}s` }}
                      >
                        {item.image && (
                          <img src={item.image} alt={item.name} className="w-16 h-16 rounded-xl object-cover shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-text">{item.name}</p>
                          {item.description && (
                            <p className="text-sm text-subtle mt-0.5 line-clamp-2">{item.description}</p>
                          )}
                          <p className="font-bold text-text mt-1">{item.price} ₽</p>
                        </div>

                        {qty === 0 ? (
                          <button
                            onClick={() => handleAdd(item)}
                            className="shrink-0 w-9 h-9 rounded-full bg-accent text-accent-fg flex items-center justify-center hover:opacity-90 hover:scale-110 active:scale-90 transition-all duration-200"
                          >
                            <Plus className="w-4 h-4" strokeWidth={2.5} />
                          </button>
                        ) : (
                          <div className="flex items-center gap-2 shrink-0 animate-scale-in">
                            <button
                              onClick={() => decreaseItem(item.id)}
                              className="w-9 h-9 rounded-full border-2 border-accent text-text flex items-center justify-center hover:bg-muted active:scale-90 transition-all duration-200"
                            >
                              <Minus className="w-4 h-4" strokeWidth={2.5} />
                            </button>
                            <span className="w-5 text-center font-bold text-text">{qty}</span>
                            <button
                              onClick={() => handleAdd(item)}
                              className="w-9 h-9 rounded-full bg-accent text-accent-fg flex items-center justify-center hover:opacity-90 active:scale-90 transition-all duration-200"
                            >
                              <Plus className="w-4 h-4" strokeWidth={2.5} />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
        </div>
      )}
    </div>
  );
}
