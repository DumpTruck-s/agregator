import type { Role } from '@delivery/shared';

export interface JwtPayload {
  sub: string;
  email: string;
  name: string;
  role: Role;
}

export const ROLE_HOME: Record<Role, string> = {
  OWNER: '/owner/dashboard',
  COURIER: '/courier/dashboard',
  CUSTOMER: '/customer/catalog',
  ADMIN: '/admin/orgs',
};

export function decodeJwt(token: string): JwtPayload | null {
  try {
    // atob() is Latin-1 only — need proper UTF-8 decode for Cyrillic names
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64).split('').map(c => '%' + c.charCodeAt(0).toString(16).padStart(2, '0')).join('')
    );
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

export function setTokenCookie(token: string) {
  const secure = typeof location !== 'undefined' && location.protocol === 'https:' ? ';Secure' : '';
  document.cookie = `token=${token};path=/;max-age=604800;SameSite=Lax${secure}`;
}

export function clearTokenCookie() {
  document.cookie = 'token=;path=/;max-age=0';
}
