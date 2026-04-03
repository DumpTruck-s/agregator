import { NextRequest, NextResponse } from 'next/server';
import type { Role } from '@delivery/shared';

const ROLE_HOME: Record<Role, string> = {
  OWNER: '/owner/dashboard',
  COURIER: '/courier/dashboard',
  CUSTOMER: '/customer/catalog',
  ADMIN: '/admin/orgs',
};

// Какие роли допущены к каждому префиксу
const PROTECTED: { prefix: string; roles: Role[] }[] = [
  { prefix: '/owner',    roles: ['OWNER'] },
  { prefix: '/courier',  roles: ['COURIER'] },
  { prefix: '/customer', roles: ['CUSTOMER'] },
  { prefix: '/admin',    roles: ['ADMIN'] },
];

const AUTH_PAGES = ['/login', '/register'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get('token')?.value;

  const isAuthPage = AUTH_PAGES.includes(pathname);

  // Нет токена
  if (!token) {
    if (isAuthPage) return NextResponse.next();
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Декодируем токен (без верификации — сервер проверяет подпись)
  let role: Role;
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    role = payload.role as Role;
  } catch {
    // Битый токен — очищаем и на логин
    const res = NextResponse.redirect(new URL('/login', req.url));
    res.cookies.delete('token');
    return res;
  }

  // Авторизованный пользователь зашёл на /login или /register — редиректим домой
  if (isAuthPage) {
    return NextResponse.redirect(new URL(ROLE_HOME[role], req.url));
  }

  // Проверяем доступ к защищённому маршруту
  for (const { prefix, roles } of PROTECTED) {
    if (pathname.startsWith(prefix) && !roles.includes(role)) {
      return NextResponse.redirect(new URL(ROLE_HOME[role], req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
