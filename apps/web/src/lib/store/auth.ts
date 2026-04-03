import { create } from 'zustand';
import { api } from '../api';
import type { Role } from '@delivery/shared';

interface AuthUser {
  sub: string;
  email: string;
  name: string;
  role: Role;
}

interface AuthStore {
  user: AuthUser | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,

  hydrate() {
    api.loadToken();
    const token = localStorage.getItem('token');
    if (token) {
      // Decode JWT payload (no verification — server validates)
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        set({ user: payload, token });
      } catch {
        api.setToken(null);
      }
    }
  },

  async login(email, password) {
    const { user, token } = await api.post<{ user: AuthUser; token: string }>('/api/auth/login', { email, password });
    api.setToken(token);
    set({ user, token });
  },

  logout() {
    api.setToken(null);
    set({ user: null, token: null });
  },
}));
