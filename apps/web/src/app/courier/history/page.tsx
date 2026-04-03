'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { StatusBadge } from '@/components/orders/status-badge';
import type { OrderStatus } from '@delivery/shared';

interface HistoryOrder {
  id: string;
  status: OrderStatus;
  totalPrice: number;
  deliveryAddress: string;
  updatedAt: string;
  org: { name: string };
}

export default function CourierHistoryPage() {
  const [orders, setOrders] = useState<HistoryOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<HistoryOrder[]>('/api/courier/orders/history')
      .then(setOrders)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const delivered  = orders.filter(o => o.status === 'DELIVERED');
  const totalEarnings = delivered.reduce((s, o) => s + o.totalPrice, 0);

  return (
    <div className="max-w-lg mx-auto p-6">
      <h1 className="text-xl font-bold mb-2">История доставок</h1>

      {/* Stats */}
      {delivered.length > 0 && (
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white border rounded-xl p-4">
            <p className="text-sm text-gray-500">Выполнено</p>
            <p className="text-2xl font-bold mt-1">{delivered.length}</p>
          </div>
          <div className="bg-white border rounded-xl p-4">
            <p className="text-sm text-gray-500">Сумма заказов</p>
            <p className="text-2xl font-bold mt-1">{totalEarnings} ₽</p>
          </div>
        </div>
      )}

      {loading && (
        <div className="space-y-3">
          {[1,2,3,4].map(i => <div key={i} className="h-20 bg-gray-200 rounded-xl animate-pulse" />)}
        </div>
      )}

      {!loading && orders.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📋</p>
          <p>История пуста</p>
        </div>
      )}

      <div className="space-y-3">
        {orders.map(order => (
          <div key={order.id} className="bg-white border rounded-xl px-4 py-3 flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{order.org.name}</p>
              <p className="text-xs text-gray-500 truncate mt-0.5">📍 {order.deliveryAddress}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {new Date(order.updatedAt).toLocaleString('ru-RU', {
                  day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                })}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2 ml-4 shrink-0">
              <span className="font-semibold">{order.totalPrice} ₽</span>
              <StatusBadge status={order.status} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
