'use client';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Package, MapPin, X } from 'lucide-react';
import { api } from '@/lib/api';
import { useOrdersStore } from '@/lib/store/orders';
import { useLocaleStore } from '@/lib/store/locale';
import { StatusBadge } from '@/components/orders/status-badge';
import { getSocket, connectSocket, joinOrderRoom } from '@/lib/socket';
import type { OrderStatus } from '@delivery/shared';

const OrderTrackingMap = dynamic(() => import('@/components/maps/OrderTrackingMap').then(m => m.OrderTrackingMap), { ssr: false, loading: () => <div className="h-[200px] bg-muted rounded-xl animate-pulse" /> });

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

const CANCELLABLE: OrderStatus[] = ['CREATED', 'ACCEPTED', 'COOKING'];

export default function CustomerOrdersPage() {
  const { orders, fetch, updateStatus } = useOrdersStore();
  const [cancelling, setCancelling] = useState<string | null>(null);

  async function cancelOrder(id: string) {
    if (!confirm('Отменить заказ?')) return;
    setCancelling(id);
    try {
      await api.patch(`/api/orders/${id}/status`, { status: 'CANCELLED' });
      updateStatus(id, 'CANCELLED');
    } catch (e) { alert(e instanceof Error ? e.message : 'Ошибка'); }
    finally { setCancelling(null); }
  }
  const t = useLocaleStore(s => s.t);
  const co = t.customerOrders;

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
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
        <Package className="w-7 h-7 text-subtle" strokeWidth={1.5} />
      </div>
      <p className="font-medium text-text mb-4">{co.empty}</p>
      <Link href="/customer/catalog" className="bg-accent text-accent-fg rounded-xl px-6 py-2.5 text-sm font-medium hover:opacity-90 transition-all active:scale-95 inline-block">
        {co.toCatalog}
      </Link>
    </div>
  );

  return (
    <div className="max-w-lg mx-auto p-6 animate-fade-in">
      <h1 className="font-display text-3xl font-semibold text-text mb-6">{co.title}</h1>
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
                  {new Date(order.createdAt).toLocaleString(t.dateLocale, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
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
              <div className="flex items-center gap-1.5 text-subtle max-w-[55%]">
                <MapPin className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
                <p className="text-sm truncate">{order.deliveryAddress}</p>
              </div>
              <div className="flex items-center gap-2">
                <p className="font-bold text-text">{order.totalPrice} ₽</p>
                {CANCELLABLE.includes(order.status) && (
                  <button
                    onClick={() => cancelOrder(order.id)}
                    disabled={cancelling === order.id}
                    className="flex items-center gap-1 text-xs text-red-500 dark:text-red-400 border border-red-200 dark:border-red-900/50 rounded-lg px-2 py-1 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all disabled:opacity-50 active:scale-95"
                  >
                    <X className="w-3 h-3" strokeWidth={2.5} />
                    Отменить
                  </button>
                )}
              </div>
            </div>
            {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
              <div className="px-4 pb-3 space-y-3">
                <OrderProgress status={order.status} />
                {order.tradePoint && order.deliveryLat && order.deliveryLng && (
                  <OrderTrackingMap
                    pickup={{ lat: order.tradePoint.lat, lng: order.tradePoint.lng, label: order.tradePoint.address }}
                    delivery={{ lat: order.deliveryLat, lng: order.deliveryLng, label: order.deliveryAddress }}
                    height="200px"
                  />
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
