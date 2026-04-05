import { create } from 'zustand';
import { api } from '../api';
import { decodeJwt, setTokenCookie, clearTokenCookie, ROLE_HOME, type JwtPayload } from '../token';

interface AuthStore {
  user: JwtPayload | null;
  token: string | null;
  /** Возвращает путь для редиректа на основе роли */
  login: (email: string, password: string) => Promise<string>;
  register: (data: { email: string; password: string; name: string; role: string }) => Promise<string>;
  logout: () => void;
  /** Вызывать один раз при маунте приложения */
  hydrate: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,

  hydrate() {
    // Читаем токен из localStorage (cookie уже есть, api.ts нужен localStorage)
    const token = localStorage.getItem('token');
    if (!token) return;
    const payload = decodeJwt(token);
    if (!payload) {
      localStorage.removeItem('token');
      clearTokenCookie();
      return;
    }
    api.setToken(token);
    set({ user: payload, token });
  },

  async login(email, password) {
    const { user, token } = await api.post<{ user: JwtPayload; token: string }>(
      '/api/auth/login',
      { email, password },
    );
    api.setToken(token);        // localStorage — для заголовков fetch
    setTokenCookie(token);      // cookie — для middleware Next.js
    set({ user, token });
    return ROLE_HOME[user.role];
  },

  async register({ email, password, name, role }) {
    const result = await api.post<{ needsVerification?: boolean; email?: string; fallbackCode?: string } | { user: JwtPayload; token: string }>(
      '/api/auth/register',
      { email, password, name, role },
    );
    if ('needsVerification' in result && result.needsVerification) {
      const params = new URLSearchParams({ email: result.email ?? email });
      if (result.fallbackCode) params.set('code', result.fallbackCode);
      return `/verify-email?${params}`;
    }
    // Fallback: direct login (should not happen with verification on)
    const { user, token } = result as { user: JwtPayload; token: string };
    api.setToken(token);
    setTokenCookie(token);
    set({ user, token });
    return ROLE_HOME[user.role];
  },

  logout() {
    api.setToken(null);
    clearTokenCookie();
    set({ user: null, token: null });
  },
}));
