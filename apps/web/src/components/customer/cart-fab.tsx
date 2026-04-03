'use client';
import Link from 'next/link';
import { useCartStore } from '@/lib/store/cart';

export function CartFab() {
  const items = useCartStore(s => s.items);
  const total = useCartStore(s => s.total);

  if (!items.length) return null;

  const count = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <Link
      href="/customer/cart"
      className="fixed bottom-6 right-6 bg-accent text-accent-fg rounded-2xl px-5 py-3.5 shadow-theme-lg flex items-center gap-3 hover:opacity-90 active:scale-95 transition-all duration-200 z-50 animate-slide-up"
    >
      <span className="bg-accent-fg text-accent rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
        {count}
      </span>
      <span className="text-sm font-medium">Корзина</span>
      <span className="text-sm font-bold">{total()} ₽</span>
    </Link>
  );
}
