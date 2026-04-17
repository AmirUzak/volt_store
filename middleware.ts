import { NextRequest, NextResponse } from 'next/server';

const protectedRoutes = ['/profile', '/checkout'];
const adminRoutes = ['/admin'];
const BACKEND_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').replace(/\/$/, '');

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = protectedRoutes.some((r) => pathname.startsWith(r));
  const isAdmin = adminRoutes.some((r) => pathname.startsWith(r));

  if (!isProtected && !isAdmin) return NextResponse.next();

  // Forward the auth cookie to the backend to validate
  const cookieHeader = request.headers.get('cookie') || '';

  try {
    const res = await fetch(`${BACKEND_BASE}/api/v1/auth/me`, {
      headers: { cookie: cookieHeader },
      credentials: 'include',
    });

    if (!res.ok) {
      // Not authenticated
      if (isProtected || isAdmin) {
        return NextResponse.redirect(new URL('/auth', request.url));
      }
    }

    if (isAdmin) {
      const user = await res.json();
      if (user?.role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/', request.url));
      }
    }
  } catch {
    // Backend unreachable at build/edge time — let client-side auth handle it
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/profile/:path*', '/admin/:path*', '/checkout/:path*'],
};
