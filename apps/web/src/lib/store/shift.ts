import { create } from 'zustand';
import { api } from '../api';

export interface Shift {
  id: string;
  isActive: boolean;
  startedAt: string;
  deliveryZoneLat: number;
  deliveryZoneLng: number;
  deliveryRadiusKm: number;
}

interface ShiftStore {
  shift: Shift | null;
  loading: boolean;
  fetch: () => Promise<void>;
  start: (lat: number, lng: number, radiusKm: number) => Promise<void>;
  end: () => Promise<void>;
}

export const useShiftStore = create<ShiftStore>((set) => ({
  shift: null,
  loading: false,

  async fetch() {
    set({ loading: true });
    try {
      const shift = await api.get<Shift | null>('/api/courier/shift');
      set({ shift });
    } catch {
      set({ shift: null });
    } finally {
      set({ loading: false });
    }
  },

  async start(lat, lng, radiusKm) {
    const shift = await api.post<Shift>('/api/courier/shift/start', {
      deliveryZoneLat: lat,
      deliveryZoneLng: lng,
      deliveryRadiusKm: radiusKm,
    });
    set({ shift });
  },

  async end() {
    await api.post('/api/courier/shift/end', {});
    set({ shift: null });
  },
}));
