import { NextRequest, NextResponse } from 'next/server';

const ROLE_PATHS: Record<string, string[]> = {
  '/owner': ['OWNER'],
  '/courier': ['COURIER'],
  '/customer': ['CUSTOMER'],
  '/admin': ['ADMIN'],
};

export function middleware(req: NextRequest) {
  const token = req.cookies.get('token')?.value;
  const { pathname } = req.nextUrl;

  const isAuthPage = pathname.startsWith('/(auth)') || pathname === '/login' || pathname === '/register';

  if (!token) {
    if (isAuthPage) return NextResponse.next();
    return NextResponse.redirect(new URL('/login', req.url));
  }

  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    const role: string = payload.role;

    for (const [prefix, roles] of Object.entries(ROLE_PATHS)) {
      if (pathname.startsWith(prefix) && !roles.includes(role)) {
        return NextResponse.redirect(new URL(`/${role.toLowerCase()}/dashboard`, req.url));
      }
    }

    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL('/login', req.url));
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};
