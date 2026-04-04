'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useCartStore } from '@/lib/store/cart';

interface TradePoint { id: string; address: string }
interface OrgDetails  { id: string; name: string; description?: string; logo?: string; tradePoints: TradePoint[] }
interface MenuItem    { id: string; name: string; price: number; description?: string }
interface Category    { id: string; name: string; items: MenuItem[] }

export default function OrgMenuPage() {
  const { id } = useParams<{ id: string }>();
  const [org, setOrg]   = useState<OrgDetails | null>(null);
  const [menu, setMenu] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const { items: cartItems, addItem, decreaseItem } = useCartStore();

  useEffect(() => {
    Promise.all([
      api.get<OrgDetails>(`/api/orgs/${id}`),
      api.get<Category[]>(`/api/orgs/${id}/menu`),
    ])
      .then(([orgData, menuData]) => {
        setOrg(orgData);
        setMenu(menuData);
        if (menuData[0]) setActiveCategory(menuData[0].id);
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

  if (!org) return <div className="p-6 text-subtle text-center">Ресторан не найден</div>;

  if (!org.tradePoints.length) return (
    <div className="max-w-2xl mx-auto p-6 text-center text-subtle py-16">
      <p className="text-3xl mb-2">⚠️</p>
      <p>Нет доступных точек выдачи</p>
    </div>
  );

  const visibleCategories = menu.filter(c => c.items.length > 0);

  return (
    <div className="max-w-2xl mx-auto pb-24 animate-fade-in">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 py-5">
        <div className="text-5xl mb-2">{org.logo || '🍽️'}</div>
        <h1 className="text-2xl font-bold text-text">{org.name}</h1>
        {org.description && <p className="text-sm text-subtle mt-1">{org.description}</p>}
        <p className="text-xs text-subtle mt-2">📍 {org.tradePoints[0].address}</p>
      </div>

      {/* Category tabs */}
      {visibleCategories.length > 1 && (
        <div className="flex gap-2 overflow-x-auto px-6 py-3 bg-card border-b border-border sticky top-[57px] z-10">
          {visibleCategories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                activeCategory === cat.id
                  ? 'bg-accent text-accent-fg scale-105'
                  : 'bg-muted text-subtle hover:bg-border hover:text-text'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Menu items */}
      <div className="px-6 pt-4 space-y-8">
        {visibleCategories
          .filter(cat => !activeCategory || visibleCategories.length <= 1 || cat.id === activeCategory)
          .map((cat, ci) => (
            <section key={cat.id} className="animate-slide-up" style={{ animationDelay: `${ci * 0.05}s` }}>
              <h2 className="text-lg font-semibold text-text mb-3">{cat.name}</h2>
              <div className="space-y-3">
                {cat.items.map((item, ii) => {
                  const qty = getQty(item.id);
                  return (
                    <div
                      key={item.id}
                      className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between gap-4 hover:shadow-theme-sm hover:border-accent/20 transition-all duration-200 animate-slide-up"
                      style={{ animationDelay: `${(ci * 4 + ii) * 0.04}s` }}
                    >
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
                          className="shrink-0 w-9 h-9 rounded-full bg-accent text-accent-fg flex items-center justify-center text-xl font-light hover:opacity-90 hover:scale-110 active:scale-90 transition-all duration-200"
                        >
                          +
                        </button>
                      ) : (
                        <div className="flex items-center gap-2 shrink-0 animate-scale-in">
                          <button
                            onClick={() => decreaseItem(item.id)}
                            className="w-9 h-9 rounded-full border-2 border-accent text-text flex items-center justify-center text-xl hover:bg-muted active:scale-90 transition-all duration-200"
                          >
                            −
                          </button>
                          <span className="w-5 text-center font-bold text-text">{qty}</span>
                          <button
                            onClick={() => handleAdd(item)}
                            className="w-9 h-9 rounded-full bg-accent text-accent-fg flex items-center justify-center text-xl hover:opacity-90 active:scale-90 transition-all duration-200"
                          >
                            +
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
    </div>
  );
}
