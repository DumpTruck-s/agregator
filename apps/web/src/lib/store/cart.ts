import { create } from 'zustand';

export interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
}

interface CartStore {
  orgId: string | null;
  tradePointId: string | null;
  items: CartItem[];
  addItem: (orgId: string, tradePointId: string, item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (menuItemId: string) => void;
  clear: () => void;
  total: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  orgId: null,
  tradePointId: null,
  items: [],

  addItem(orgId, tradePointId, item) {
    const { items, orgId: currentOrg } = get();
    // Если другая организация — очищаем корзину
    if (currentOrg && currentOrg !== orgId) {
      set({ orgId, tradePointId, items: [{ ...item, quantity: 1 }] });
      return;
    }
    const existing = items.find(i => i.menuItemId === item.menuItemId);
    if (existing) {
      set({ items: items.map(i => i.menuItemId === item.menuItemId ? { ...i, quantity: i.quantity + 1 } : i) });
    } else {
      set({ orgId, tradePointId, items: [...items, { ...item, quantity: 1 }] });
    }
  },

  removeItem(menuItemId) {
    set(s => ({ items: s.items.filter(i => i.menuItemId !== menuItemId) }));
  },

  clear() {
    set({ orgId: null, tradePointId: null, items: [] });
  },

  total() {
    return get().items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  },
}));
