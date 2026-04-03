import { create } from 'zustand';
import { api } from '../api';

export interface OrgItem {
  id: string; name: string; description?: string;
  price: number; isAvailable: boolean; image?: string;
}
export interface OrgCategory {
  id: string; name: string; sortOrder: number; items: OrgItem[];
}
export interface OrgDetails {
  id: string; name: string; description?: string; logo?: string;
  isVerified: boolean; isActive: boolean;
  tradePoints: { id: string; address: string; deliveryRadiusKm: number }[];
  categories: OrgCategory[];
}

interface OrgStore {
  org: OrgDetails | null;
  loading: boolean;
  fetch: () => Promise<void>;
  setOrg: (org: OrgDetails) => void;
}

export const useOrgStore = create<OrgStore>((set) => ({
  org: null,
  loading: false,

  async fetch() {
    set({ loading: true });
    try {
      const org = await api.get<OrgDetails>('/api/orgs/my');
      set({ org });
    } catch {
      set({ org: null });
    } finally {
      set({ loading: false });
    }
  },

  setOrg(org) { set({ org }); },
}));
