'use client';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { useCartStore } from '@/lib/store/cart';
import { useLocaleStore } from '@/lib/store/locale';

export function CartFab() {
  const items = useCartStore(s => s.items);
  const total = useCartStore(s => s.total);
  const t = useLocaleStore(s => s.t);

  if (!items.length) return null;

  const count = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <Link
      href="/customer/cart"
      className="fixed bottom-6 right-6 bg-accent text-accent-fg rounded-2xl px-5 py-3.5 shadow-theme-lg flex items-center gap-3 hover:opacity-90 active:scale-95 transition-all duration-200 z-50 animate-slide-up"
    >
      <div className="relative">
        <ShoppingCart className="w-5 h-5" strokeWidth={2} />
        <span className="absolute -top-2 -right-2 bg-accent-fg text-accent rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold leading-none">
          {count}
        </span>
      </div>
      <span className="text-sm font-medium">{t.cart.fab}</span>
      <span className="text-sm font-bold">{total()} ₽</span>
    </Link>
  );
}
