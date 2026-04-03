import type { OrderStatus } from '@delivery/shared';

const CONFIG: Record<OrderStatus, { label: string; className: string }> = {
  CREATED:    { label: 'Новый',      className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  ACCEPTED:   { label: 'Принят',     className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300' },
  COOKING:    { label: 'Готовится',  className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' },
  READY:      { label: 'Готов',      className: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
  PICKED_UP:  { label: 'Забрали',    className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
  DELIVERING: { label: 'В пути',     className: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' },
  DELIVERED:  { label: 'Доставлен',  className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
  CANCELLED:  { label: 'Отменён',    className: 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300' },
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  const { label, className } = CONFIG[status] ?? { label: status, className: 'bg-muted text-subtle' };
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${className}`}>
      {label}
    </span>
  );
}
