'use client';
import { useEffect } from 'react';
import { useOrdersStore } from '@/lib/store/orders';

const STATUS_LABELS: Record<string, string> = {
  CREATED: 'Принят', ACCEPTED: 'Готовится', COOKING: 'Готовится',
  READY: 'Готов', PICKED_UP: 'Забирают', DELIVERING: 'В пути',
  DELIVERED: 'Доставлен', CANCELLED: 'Отменён',
};

export default function CustomerOrdersPage() {
  const { orders, fetch } = useOrdersStore();
  useEffect(() => { fetch(); }, [fetch]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">My Orders</h1>
      {orders.map(order => (
        <div key={order.id} className="border rounded-lg p-4 mb-3">
          <div className="flex justify-between">
            <span className="font-semibold">{order.org.name}</span>
            <span className="text-sm bg-gray-100 px-2 py-1 rounded">{STATUS_LABELS[order.status] ?? order.status}</span>
          </div>
          <p className="text-sm text-gray-500 mt-1">{order.deliveryAddress}</p>
          <p className="font-bold mt-2">{order.totalPrice} ₽</p>
        </div>
      ))}
    </div>
  );
}
