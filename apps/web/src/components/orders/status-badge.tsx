'use client';
import type { OrderStatus } from '@delivery/shared';
import { useLocaleStore } from '@/lib/store/locale';

const COLOR_MAP: Record<OrderStatus, string> = {
  CREATED:    'bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300',
  ACCEPTED:   'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  COOKING:    'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300',
  READY:      'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  PICKED_UP:  'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300',
  DELIVERING: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300',
  DELIVERED:  'bg-stone-100 text-stone-600 dark:bg-stone-800/60 dark:text-stone-400',
  CANCELLED:  'bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400',
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  const t = useLocaleStore(s => s.t);
  const label = t.orderStatus[status] ?? status;
  const className = COLOR_MAP[status] ?? 'bg-muted text-subtle';
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full transition-colors whitespace-nowrap ${className}`}>
      {label}
    </span>
  );
}
