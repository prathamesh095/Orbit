import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require authentication
const PROTECTED_ROUTES = ['/dashboard', '/applications', '/contacts', '/settings'];
// Routes only for unauthenticated users
const AUTH_ROUTES = ['/login', '/register', '/forgot-password'];

/**
 * Next.js 16 Request Interception Proxy
 * This replaces the deprecated middleware convention.
 */
export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Check if session cookie exists
    const sessionCookie = request.cookies.get('jt_session');
    const isAuthenticated = !!sessionCookie?.value;

    const isProtected = PROTECTED_ROUTES.some((r) => pathname.startsWith(r));
    const isAuthRoute = AUTH_ROUTES.some((r) => pathname.startsWith(r));

    if (isProtected && !isAuthenticated) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        url.searchParams.set('next', pathname);
        return NextResponse.redirect(url);
    }

    if (isAuthRoute && isAuthenticated) {
        const url = request.nextUrl.clone();
        url.pathname = '/dashboard';
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/dashboard/:path*',
        '/applications/:path*',
        '/contacts/:path*',
        '/settings/:path*',
        '/login',
        '/register',
        '/forgot-password',
    ],
};
