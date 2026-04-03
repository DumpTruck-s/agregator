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
    return JSON.parse(atob(token.split('.')[1])) as JwtPayload;
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
