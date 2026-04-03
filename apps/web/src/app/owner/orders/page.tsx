'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { StatusBadge } from '@/components/orders/status-badge';
import { getSocket, connectSocket, joinOrderRoom } from '@/lib/socket';
import type { OrderStatus } from '@delivery/shared';

interface Order {
  id: string;
  status: OrderStatus;
  totalPrice: number;
  createdAt: string;
  deliveryAddress: string;
  customer: { name: string; phone?: string };
  items: { quantity: number; price: number; menuItem: { name: string } }[];
}

// Какую кнопку показать владельцу в зависимости от статуса
const OWNER_ACTION: Partial<Record<OrderStatus, { label: string; next: OrderStatus }>> = {
  ACCEPTED: { label: 'Начать готовить',  next: 'COOKING' },
  COOKING:  { label: 'Готово к выдаче', next: 'READY' },
};

const ACTIVE_STATUSES: OrderStatus[] = ['CREATED', 'ACCEPTED', 'COOKING', 'READY'];

export default function OwnerOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'active' | 'done'>('active');
  const [updating, setUpdating] = useState<string | null>(null);

  async function fetchOrders() {
    try {
      const data = await api.get<Order[]>('/api/orders/org');
      setOrders(data);
    } catch {
      // бэк недоступен — ок
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchOrders(); }, []);

  // WebSocket — новые заказы и обновления статусов
  useEffect(() => {
    connectSocket();
    const socket = getSocket();

    socket.on('order:new', (order: Order) => {
      setOrders(prev => [order, ...prev]);
    });

    socket.on('order:updated', (updated: { id: string; status: OrderStatus }) => {
      setOrders(prev => prev.map(o => o.id === updated.id ? { ...o, status: updated.status } : o));
    });

    return () => {
      socket.off('order:new');
      socket.off('order:updated');
    };
  }, []);

  // Подписываемся на обновления каждого заказа
  useEffect(() => {
    orders.forEach(o => joinOrderRoom(o.id));
  }, [orders.length]);

  async function updateStatus(orderId: string, status: OrderStatus) {
    setUpdating(orderId);
    try {
      await api.patch(`/api/orders/${orderId}/status`, { status });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setUpdating(null);
    }
  }

  const active = orders.filter(o => ACTIVE_STATUSES.includes(o.status));
  const done   = orders.filter(o => !ACTIVE_STATUSES.includes(o.status));
  const shown  = tab === 'active' ? active : done;

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
        {(['active', 'done'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition ${tab === t ? 'bg-white shadow text-black' : 'text-gray-500 hover:text-black'}`}
          >
            {t === 'active' ? `Активные ${active.length > 0 ? `(${active.length})` : ''}` : 'Завершённые'}
          </button>
        ))}
      </div>

      {loading && (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-28 bg-gray-200 rounded-xl animate-pulse" />)}
        </div>
      )}

      {!loading && shown.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">{tab === 'active' ? '🟢' : '📋'}</p>
          <p>{tab === 'active' ? 'Нет активных заказов' : 'Нет завершённых заказов'}</p>
        </div>
      )}

      <div className="space-y-4">
        {shown.map(order => {
          const action = OWNER_ACTION[order.status];
          return (
            <div key={order.id} className="bg-white border rounded-xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
                <div>
                  <p className="font-semibold text-sm">{order.customer.name}</p>
                  {order.customer.phone && (
                    <p className="text-xs text-gray-500">{order.customer.phone}</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold">{order.totalPrice} ₽</span>
                  <StatusBadge status={order.status} />
                </div>
              </div>

              {/* Items */}
              <div className="px-4 py-3 space-y-1">
                {order.items.map((item, i) => (
                  <p key={i} className="text-sm text-gray-700">
                    {item.menuItem.name}
                    <span className="text-gray-400"> × {item.quantity}</span>
                  </p>
                ))}
              </div>

              {/* Footer */}
              <div className="px-4 py-3 border-t flex items-center justify-between">
                <p className="text-xs text-gray-400">
                  {new Date(order.createdAt).toLocaleString('ru-RU', {
                    hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short',
                  })}
                  <span className="ml-2">📍 {order.deliveryAddress}</span>
                </p>
                {action && (
                  <button
                    onClick={() => updateStatus(order.id, action.next)}
                    disabled={updating === order.id}
                    className="bg-black text-white text-xs rounded-lg px-4 py-2 hover:bg-gray-800 transition disabled:opacity-50 shrink-0"
                  >
                    {updating === order.id ? '...' : action.label}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
