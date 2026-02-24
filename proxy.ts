import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require authentication
const PROTECTED_ROUTES = ['/workspace', '/dashboard', '/admin', '/applications', '/contacts', '/settings'];
// Routes only for unauthenticated users
const AUTH_ROUTES = ['/login', '/register', '/forgot-password', '/(auth)'];

/**
 * Next.js 16 Request Interception Proxy
 * Handles session validation and route protection
 */
export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Check for both legacy (jt_session) and new (session) session cookies
    const legacySessionCookie = request.cookies.get('jt_session');
    const newSessionCookie = request.cookies.get('session');
    const isAuthenticated = !!(legacySessionCookie?.value || newSessionCookie?.value);

    const isProtected = PROTECTED_ROUTES.some((r) => pathname.startsWith(r));
    const isAuthRoute = AUTH_ROUTES.some((r) => pathname.startsWith(r));

    // Redirect unauthenticated users from protected routes
    if (isProtected && !isAuthenticated) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        url.searchParams.set('next', pathname);
        console.log('[v0] Redirecting unauthenticated user from protected route:', pathname);
        return NextResponse.redirect(url);
    }

    // Redirect authenticated users away from auth routes
    if (isAuthRoute && isAuthenticated) {
        const url = request.nextUrl.clone();
        url.pathname = '/workspace';
        console.log('[v0] Redirecting authenticated user from auth route:', pathname);
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/workspace/:path*',
        '/dashboard/:path*',
        '/admin/:path*',
        '/applications/:path*',
        '/contacts/:path*',
        '/settings/:path*',
        '/login',
        '/register',
        '/forgot-password',
        '/(auth)/:path*',
    ],
};
