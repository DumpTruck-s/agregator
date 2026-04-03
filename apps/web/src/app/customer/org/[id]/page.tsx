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
    addItem(org.id, org.tradePoints[0].id, {
      menuItemId: item.id,
      name: item.name,
      price: item.price,
    });
  }

  function handleRemove(menuItemId: string) {
    decreaseItem(menuItemId);
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 bg-gray-200 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!org) return <div className="p-6 text-gray-500">Ресторан не найден</div>;

  if (!org.tradePoints.length) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center text-gray-500 py-16">
        <p className="text-3xl mb-2">⚠️</p>
        <p>Нет доступных точек выдачи</p>
      </div>
    );
  }

  const visibleCategories = menu.filter(c => c.items.length > 0);

  return (
    <div className="max-w-2xl mx-auto pb-24">
      {/* Header */}
      <div className="bg-white border-b px-6 py-5">
        <div className="text-5xl mb-2">{org.logo || '🍽️'}</div>
        <h1 className="text-2xl font-bold">{org.name}</h1>
        {org.description && <p className="text-sm text-gray-500 mt-1">{org.description}</p>}
        <p className="text-xs text-gray-400 mt-2">📍 {org.tradePoints[0].address}</p>
      </div>

      {/* Category tabs */}
      {visibleCategories.length > 1 && (
        <div className="flex gap-2 overflow-x-auto px-6 py-3 bg-white border-b sticky top-0 z-10">
          {visibleCategories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition ${
                activeCategory === cat.id
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Menu */}
      <div className="px-6 pt-4 space-y-8">
        {visibleCategories
          .filter(cat => !activeCategory || visibleCategories.length <= 1 || cat.id === activeCategory)
          .map(cat => (
            <section key={cat.id}>
              <h2 className="text-lg font-semibold mb-3">{cat.name}</h2>
              <div className="space-y-3">
                {cat.items.map(item => {
                  const qty = getQty(item.id);
                  return (
                    <div key={item.id} className="bg-white border rounded-xl p-4 flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900">{item.name}</p>
                        {item.description && (
                          <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{item.description}</p>
                        )}
                        <p className="font-bold mt-1">{item.price} ₽</p>
                      </div>

                      {qty === 0 ? (
                        <button
                          onClick={() => handleAdd(item)}
                          className="shrink-0 w-9 h-9 rounded-full bg-black text-white flex items-center justify-center text-xl font-light hover:bg-gray-800 transition"
                        >
                          +
                        </button>
                      ) : (
                        <div className="flex items-center gap-3 shrink-0">
                          <button
                            onClick={() => handleRemove(item.id)}
                            className="w-9 h-9 rounded-full border-2 border-black flex items-center justify-center text-xl font-light hover:bg-gray-100 transition"
                          >
                            −
                          </button>
                          <span className="w-4 text-center font-semibold">{qty}</span>
                          <button
                            onClick={() => handleAdd(item)}
                            className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center text-xl font-light hover:bg-gray-800 transition"
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
