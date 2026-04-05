'use client';
import type { OrderStatus } from '@delivery/shared';
import { useLocaleStore } from '@/lib/store/locale';

const STYLE_MAP: Record<OrderStatus, string> = {
  CREATED:    'bg-slate-100  text-slate-600  border-slate-300  dark:bg-slate-900/40  dark:text-slate-300  dark:border-slate-700',
  ACCEPTED:   'bg-amber-100  text-amber-700  border-amber-300  dark:bg-amber-900/30  dark:text-amber-300  dark:border-amber-700',
  COOKING:    'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700',
  READY:      'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700',
  PICKED_UP:  'neon-badge',
  DELIVERING: 'neon-badge',
  DELIVERED:  'bg-stone-100 text-stone-500 border-stone-300 dark:bg-stone-900/30 dark:text-stone-400 dark:border-stone-700',
  CANCELLED:  'bg-red-100 text-red-600 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  const t = useLocaleStore(s => s.t);
  const label = t.orderStatus[status] ?? status;
  const cls = STYLE_MAP[status] ?? 'bg-muted text-subtle border-border';
  return (
    <span className={`inline-flex items-center text-[11px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wider whitespace-nowrap transition-all ${cls}`}>
      {label}
    </span>
  );
}
