'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { useOrdersStore } from '@/lib/store/orders';
import { StatusBadge } from '@/components/orders/status-badge';
import { getSocket, connectSocket, joinOrderRoom } from '@/lib/socket';
import type { OrderStatus } from '@delivery/shared';

type OS = OrderStatus;

const STEPS: OS[] = ['CREATED', 'ACCEPTED', 'COOKING', 'READY', 'PICKED_UP', 'DELIVERING', 'DELIVERED'];

function OrderProgress({ status }: { status: OS }) {
  const idx      = STEPS.indexOf(status);
  const progress = Math.round(((idx + 1) / STEPS.length) * 100);
  return (
    <div className="mt-3">
      <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
        <div
          className="bg-accent h-1.5 rounded-full transition-all duration-700 ease-spring"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

export default function CustomerOrdersPage() {
  const { orders, fetch, updateStatus } = useOrdersStore();

  useEffect(() => { fetch(); }, [fetch]);

  useEffect(() => {
    if (!orders.length) return;
    connectSocket();
    const socket = getSocket();
    orders.forEach(o => joinOrderRoom(o.id));
    socket.on('order:updated', (u: { id: string; status: OS }) => updateStatus(u.id, u.status));
    return () => { socket.off('order:updated'); };
  }, [orders.length]);

  if (!orders.length) return (
    <div className="max-w-md mx-auto p-6 text-center py-20 text-subtle animate-fade-in">
      <p className="text-5xl mb-3">📦</p>
      <p className="font-medium text-text mb-4">Заказов пока нет</p>
      <Link href="/customer/catalog" className="bg-accent text-accent-fg rounded-xl px-6 py-2.5 text-sm font-medium hover:opacity-90 transition-all active:scale-95">
        Перейти в каталог
      </Link>
    </div>
  );

  return (
    <div className="max-w-lg mx-auto p-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-text mb-6">Мои заказы</h1>
      <div className="space-y-4">
        {orders.map((order, i) => (
          <div
            key={order.id}
            className="bg-card border border-border rounded-2xl overflow-hidden shadow-theme-sm hover:shadow-theme-md transition-all duration-300 animate-slide-up"
            style={{ animationDelay: `${i * 0.07}s` }}
          >
            <div className="flex items-start justify-between gap-2 px-4 py-3 border-b border-border">
              <div>
                <p className="font-semibold text-text">{order.org.name}</p>
                <p className="text-xs text-subtle mt-0.5">
                  {new Date(order.createdAt).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <StatusBadge status={order.status} />
            </div>
            <div className="px-4 py-3 space-y-1">
              {order.items.map((item, j) => (
                <p key={j} className="text-sm text-subtle">{item.menuItem.name} × {item.quantity}</p>
              ))}
            </div>
            <div className="flex items-center justify-between border-t border-border px-4 py-3">
              <p className="text-sm text-subtle truncate max-w-[60%]">📍 {order.deliveryAddress}</p>
              <p className="font-bold text-text">{order.totalPrice} ₽</p>
            </div>
            {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
              <div className="px-4 pb-3">
                <OrderProgress status={order.status} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
