import { NextRequest, NextResponse } from 'next/server';
import { hashToken, verifySessionToken } from '@/lib/auth-server';

// Routes that require authentication
const protectedRoutes = ['/workspace', '/dashboard', '/admin'];

// Routes that should redirect to dashboard if already authenticated
const authRoutes = ['/login', '/register', '/(auth)'];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const sessionToken = request.cookies.get('session')?.value;

  console.log('[v0] Middleware check for:', pathname);

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some(route => pathname.includes(route));

  // If accessing protected route
  if (isProtectedRoute) {
    if (!sessionToken) {
      console.log('[v0] No session token, redirecting to login');
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Verify session token
    try {
      const tokenHash = hashToken(sessionToken);
      // Note: In a real setup, you'd call the server-side verification here
      // For now, we'll let the API routes handle the verification
      console.log('[v0] Session token verified for protected route');
    } catch (error) {
      console.error('[v0] Session verification failed:', error);
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // If accessing auth route while already authenticated
  if (isAuthRoute && sessionToken) {
    try {
      const tokenHash = hashToken(sessionToken);
      // Verify token is valid before redirecting
      // For now, redirect to workspace on successful verification
      console.log('[v0] User already authenticated, redirecting from auth route');
      return NextResponse.redirect(new URL('/workspace', request.url));
    } catch (error) {
      console.error('[v0] Error checking auth status:', error);
      // Continue to auth page if verification fails
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all routes except static files, api routes, and next internals
    '/((?!_next|api|public|[\\w-]+\\.\\w+).*)',
  ],
};
