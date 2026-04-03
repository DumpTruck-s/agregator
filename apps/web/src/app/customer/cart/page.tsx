'use client';
import { useCartStore } from '@/lib/store/cart';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function CartPage() {
  const { items, total, clear, orgId, tradePointId } = useCartStore();
  const router = useRouter();

  async function checkout() {
    if (!orgId || !tradePointId) return;
    // TODO: получить адрес доставки от пользователя (форма или геолокация)
    const deliveryAddress = 'TODO: get from form';
    await api.post('/api/orders', {
      orgId,
      tradePointId,
      deliveryAddress,
      deliveryLat: 55.75, // TODO: real coords
      deliveryLng: 37.61,
      items: items.map(i => ({ menuItemId: i.menuItemId, quantity: i.quantity })),
    });
    clear();
    router.push('/customer/orders');
  }

  if (!items.length) return <div className="p-6 text-center">Cart is empty</div>;

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Cart</h1>
      {items.map(i => (
        <div key={i.menuItemId} className="flex justify-between py-2 border-b">
          <span>{i.name} x{i.quantity}</span>
          <span>{i.price * i.quantity} ₽</span>
        </div>
      ))}
      <div className="flex justify-between font-bold mt-4">
        <span>Total</span>
        <span>{total()} ₽</span>
      </div>
      <button onClick={checkout} className="w-full bg-black text-white rounded p-3 mt-4">Place Order</button>
    </div>
  );
}
