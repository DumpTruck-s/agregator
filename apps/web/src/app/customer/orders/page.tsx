'use client';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Package, MapPin, X, Clock, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useOrdersStore } from '@/lib/store/orders';
import { useLocaleStore } from '@/lib/store/locale';
import { StatusBadge } from '@/components/orders/status-badge';
import { getSocket, connectSocket, joinOrderRoom } from '@/lib/socket';
import type { OrderStatus } from '@delivery/shared';

const OrderTrackingMap = dynamic(() => import('@/components/maps/OrderTrackingMap').then(m => m.OrderTrackingMap), { ssr: false, loading: () => <div className="h-[200px] bg-muted rounded-xl animate-pulse" /> });

type OS = OrderStatus;

const STEPS: OS[] = ['CREATED', 'ACCEPTED', 'COOKING', 'READY', 'PICKED_UP', 'DELIVERING', 'DELIVERED'];

const STATUS_RU: Record<OS, string> = {
  CREATED:    'Принят',
  ACCEPTED:   'Подтверждён',
  COOKING:    'Готовится',
  READY:      'Готов',
  PICKED_UP:  'Забрал курьер',
  DELIVERING: 'В пути',
  DELIVERED:  'Доставлен',
  CANCELLED:  'Отменён',
};

function OrderProgress({ status }: { status: OS }) {
  const idx      = STEPS.indexOf(status);
  const progress = Math.round(((idx + 1) / STEPS.length) * 100);
  return (
    <div className="mt-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-subtle">{STATUS_RU[status]}</span>
        <span className="text-xs text-subtle">{progress}%</span>
      </div>
      <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
        <div
          className="bg-accent h-1.5 rounded-full transition-all duration-700"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

const ACTIVE_STATUSES: OrderStatus[] = ['CREATED', 'ACCEPTED', 'COOKING', 'READY', 'PICKED_UP', 'DELIVERING'];
const CANCELLABLE: OrderStatus[] = ['CREATED', 'ACCEPTED', 'COOKING'];

function OrderCard({ order, onCancel, cancelling }: {
  order: ReturnType<typeof useOrdersStore.getState>['orders'][0];
  onCancel: (id: string) => void;
  cancelling: string | null;
}) {
  const t = useLocaleStore(s => s.t);
  const isActive = ACTIVE_STATUSES.includes(order.status);

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-theme-sm neon-card">
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
              onClick={() => onCancel(order.id)}
              disabled={cancelling === order.id}
              className="flex items-center gap-1 text-xs text-red-500 dark:text-red-400 border border-red-200 dark:border-red-900/50 rounded-lg px-2 py-1 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all disabled:opacity-50 active:scale-95"
            >
              <X className="w-3 h-3" strokeWidth={2.5} />
              Отменить
            </button>
          )}
        </div>
      </div>

      {isActive && (
        <div className="px-4 pb-4 space-y-3">
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
  );
}

export default function CustomerOrdersPage() {
  const { orders, fetch, updateStatus } = useOrdersStore();
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [tab, setTab] = useState<'active' | 'history'>('active');
  const t = useLocaleStore(s => s.t);
  const co = t.customerOrders;

  async function cancelOrder(id: string) {
    if (!confirm('Отменить заказ?')) return;
    setCancelling(id);
    try {
      await api.patch(`/api/orders/${id}/status`, { status: 'CANCELLED' });
      updateStatus(id, 'CANCELLED');
    } catch (e) { alert(e instanceof Error ? e.message : 'Ошибка'); }
    finally { setCancelling(null); }
  }

  useEffect(() => { fetch(); }, [fetch]);

  useEffect(() => {
    if (!orders.length) return;
    connectSocket();
    const socket = getSocket();
    orders.forEach(o => joinOrderRoom(o.id));
    socket.on('order:updated', (u: { id: string; status: OS }) => updateStatus(u.id, u.status));
    return () => { socket.off('order:updated'); };
  }, [orders.length]);

  const activeOrders  = orders.filter(o => ACTIVE_STATUSES.includes(o.status));
  const historyOrders = orders.filter(o => !ACTIVE_STATUSES.includes(o.status));
  const shown = tab === 'active' ? activeOrders : historyOrders;

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
      <h1 className="font-display text-3xl font-semibold text-text mb-5">{co.title}</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted rounded-2xl p-1 mb-5">
        <button
          onClick={() => setTab('active')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${tab === 'active' ? 'bg-card shadow-theme-sm text-text' : 'text-subtle hover:text-text'}`}
        >
          <Clock className="w-4 h-4" strokeWidth={2} />
          Активные
          {activeOrders.length > 0 && (
            <span className="bg-accent text-accent-fg text-xs rounded-full px-1.5 py-0.5 leading-none">{activeOrders.length}</span>
          )}
        </button>
        <button
          onClick={() => setTab('history')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${tab === 'history' ? 'bg-card shadow-theme-sm text-text' : 'text-subtle hover:text-text'}`}
        >
          <CheckCircle2 className="w-4 h-4" strokeWidth={2} />
          История
        </button>
      </div>

      {shown.length === 0 ? (
        <div className="text-center py-16 text-subtle animate-fade-in">
          <p className="font-medium text-text mb-1">
            {tab === 'active' ? 'Нет активных заказов' : 'История пуста'}
          </p>
          <p className="text-sm">
            {tab === 'active' ? 'Все заказы завершены' : 'Завершённые заказы появятся здесь'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {shown.map((order, i) => (
            <div key={order.id} className="animate-slide-up" style={{ animationDelay: `${i * 0.07}s` }}>
              <OrderCard order={order} onCancel={cancelOrder} cancelling={cancelling} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
