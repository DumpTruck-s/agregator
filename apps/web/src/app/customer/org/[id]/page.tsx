'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useCartStore } from '@/lib/store/cart';

interface MenuItem { id: string; name: string; price: number; description?: string; isAvailable: boolean }
interface Category { id: string; name: string; items: MenuItem[] }

export default function OrgMenuPage() {
  const { id } = useParams<{ id: string }>();
  const [menu, setMenu] = useState<Category[]>([]);
  const addItem = useCartStore(s => s.addItem);

  useEffect(() => {
    api.get<Category[]>(`/api/orgs/${id}/menu`).then(setMenu).catch(console.error);
  }, [id]);

  return (
    <div className="p-6">
      {menu.map(cat => (
        <section key={cat.id} className="mb-8">
          <h2 className="text-xl font-semibold mb-3">{cat.name}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {cat.items.map(item => (
              <div key={item.id} className="border rounded-lg p-3 flex justify-between items-center">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-gray-500">{item.description}</p>
                  <p className="font-bold mt-1">{item.price} ₽</p>
                </div>
                <button
                  onClick={() => addItem(id, 'TODO_TRADE_POINT_ID', { menuItemId: item.id, name: item.name, price: item.price })}
                  className="bg-black text-white rounded-full w-8 h-8 flex items-center justify-center text-xl"
                >+</button>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
