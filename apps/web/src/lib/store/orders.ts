import { create } from 'zustand';
import { api } from '../api';
import type { OrderStatus } from '@delivery/shared';

export interface Order {
  id: string;
  status: OrderStatus;
  totalPrice: number;
  deliveryAddress: string;
  deliveryLat: number;
  deliveryLng: number;
  courierRating: number | null;
  courierId: string | null;
  createdAt: string;
  org: { name: string };
  tradePoint: { address: string; lat: number; lng: number } | null;
  items: { quantity: number; price: number; menuItem: { name: string } }[];
}

interface OrdersStore {
  orders: Order[];
  fetch: () => Promise<void>;
  updateStatus: (id: string, status: OrderStatus) => void;
  setRating: (id: string, rating: number) => void;
}

export const useOrdersStore = create<OrdersStore>((set, get) => ({
  orders: [],

  async fetch() {
    const orders = await api.get<Order[]>('/api/orders/my');
    set({ orders });
  },

  updateStatus(id, status) {
    set({ orders: get().orders.map(o => o.id === id ? { ...o, status } : o) });
  },

  setRating(id, rating) {
    set({ orders: get().orders.map(o => o.id === id ? { ...o, courierRating: rating } : o) });
  },
}));
