import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, verifySession } from '@/lib/cms/session';

// Everything under /admin needs a signed-in admin, except the login page and the login call itself.
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname === '/admin/login' || pathname === '/api/admin/login') return NextResponse.next();

  const user = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  if (user) return NextResponse.next();

  if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'Please sign in again.' }, { status: 401 });
  const login = new URL('/admin/login', req.url);
  login.searchParams.set('next', pathname);
  return NextResponse.redirect(login);
}

export const config = { matcher: ['/admin/:path*', '/api/admin/:path*'] };
