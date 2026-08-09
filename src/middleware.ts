import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedPrefixes = [
  '/dashboard',
  '/results',
  '/history',
  '/questions',
  '/claim',
  '/claims',
  '/admin',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = protectedPrefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (!isProtected) {
    return NextResponse.next();
  }

  const sessionToken =
    request.cookies.get('better-auth.session_token') ??
    request.cookies.get('__Secure-better-auth.session_token');

  if (!sessionToken) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Legacy /claims → admin claims queue
  if (pathname === '/claims' || pathname.startsWith('/claims/')) {
    return NextResponse.redirect(new URL('/admin/claims', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
};
