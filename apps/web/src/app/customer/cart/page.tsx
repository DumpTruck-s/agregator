'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/lib/store/cart';
import { api } from '@/lib/api';

export default function CartPage() {
  const router = useRouter();
  const { items, orgId, tradePointId, total, removeItem, clear } = useCartStore();
  const [address, setAddress]   = useState('');
  const [coords, setCoords]     = useState<{ lat: number; lng: number } | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  function getGeolocation() {
    if (!navigator.geolocation) return;
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      pos => { setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setGeoLoading(false); },
      () => setGeoLoading(false),
    );
  }

  async function handleOrder() {
    if (!address.trim()) { setError('Введите адрес доставки'); return; }
    if (!coords)         { setError('Нажмите «Определить» для получения координат'); return; }
    if (!orgId || !tradePointId) return;
    setError(''); setLoading(true);
    try {
      await api.post('/api/orders', {
        orgId, tradePointId, deliveryAddress: address,
        deliveryLat: coords.lat, deliveryLng: coords.lng,
        items: items.map(i => ({ menuItemId: i.menuItemId, quantity: i.quantity })),
      });
      clear();
      router.push('/customer/orders');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка при оформлении');
      setLoading(false);
    }
  }

  if (!items.length) return (
    <div className="max-w-md mx-auto p-6 text-center py-20 text-subtle animate-fade-in">
      <p className="text-5xl mb-3">🛒</p>
      <p className="font-medium text-text">Корзина пуста</p>
    </div>
  );

  return (
    <div className="max-w-md mx-auto p-6 pb-10 animate-fade-in">
      <h1 className="text-2xl font-bold text-text mb-6">Корзина</h1>

      <div className="bg-card border border-border rounded-2xl divide-y divide-border mb-6 shadow-theme-sm overflow-hidden">
        {items.map(item => (
          <div key={item.menuItemId} className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors">
            <div>
              <p className="font-medium text-text">{item.name}</p>
              <p className="text-sm text-subtle">{item.quantity} × {item.price} ₽</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-semibold text-text">{item.price * item.quantity} ₽</span>
              <button onClick={() => removeItem(item.menuItemId)} className="text-subtle hover:text-red-500 dark:hover:text-red-400 transition-colors text-lg leading-none hover:scale-110 active:scale-90 transform">×</button>
            </div>
          </div>
        ))}
        <div className="flex justify-between px-4 py-3 font-bold text-text">
          <span>Итого</span>
          <span>{total()} ₽</span>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-4 mb-6 space-y-3 shadow-theme-sm">
        <p className="font-semibold text-text">Адрес доставки</p>
        <input
          className="w-full border border-border bg-muted rounded-xl px-3 py-2.5 text-sm text-text placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all"
          placeholder="Улица, дом, квартира"
          value={address} onChange={e => setAddress(e.target.value)}
        />
        <div className="flex items-center gap-2">
          <button
            onClick={getGeolocation} disabled={geoLoading}
            className="flex items-center gap-2 text-sm border border-border bg-muted rounded-xl px-3 py-2 hover:bg-border text-subtle hover:text-text transition-all disabled:opacity-50 active:scale-95"
          >
            📍 {geoLoading ? 'Определяем...' : 'Определить координаты'}
          </button>
          {coords && <span className="text-xs text-green-600 dark:text-green-400 font-medium">✓ Готово</span>}
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-3 py-2 mb-4 animate-slide-down">
          {error}
        </div>
      )}

      <button
        onClick={handleOrder} disabled={loading}
        className="w-full bg-accent text-accent-fg rounded-2xl py-3.5 font-semibold hover:opacity-90 active:scale-95 transition-all duration-200 disabled:opacity-50"
      >
        {loading ? 'Оформляем...' : `Заказать · ${total()} ₽`}
      </button>
    </div>
  );
}
