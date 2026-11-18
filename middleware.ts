import { NextRequest, NextResponse } from 'next/server';
import { COOKIE, verify } from './lib/auth';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname === '/admin/login' || pathname === '/api/admin/login') return NextResponse.next();
  if (await verify(req.cookies.get(COOKIE)?.value)) return NextResponse.next();
  if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  return NextResponse.redirect(new URL(pathname.startsWith('/kitchen') ? '/admin/login?next=kitchen' : '/admin/login', req.url));
}
export const config = { matcher: ['/admin/:path*', '/api/admin/:path*', '/kitchen/:path*'] };
