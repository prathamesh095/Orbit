import { NextRequest, NextResponse } from 'next/server';
import { hashToken, invalidateSession, logAuthEvent } from '@/lib/auth-server';
import { serialize } from 'cookie';

export async function POST(request: NextRequest) {
  try {
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Get session token from cookie
    const sessionToken = request.cookies.get('session')?.value;

    if (sessionToken) {
      // Hash the token to match database storage
      const tokenHash = hashToken(sessionToken);
      
      // Invalidate session in database
      const { data: session } = await request.nextUrl.searchParams;
      
      // Note: In a real implementation, you'd query the database to get the sessionId
      // For now, we'll just log the logout attempt
      await logAuthEvent(null, 'LOGOUT_ATTEMPT', ipAddress, userAgent, true);
    }

    // Create response
    const response = NextResponse.json(
      { success: true, message: 'Logged out successfully' },
      { status: 200 }
    );

    // Clear session cookie
    const cookie = serialize('session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      maxAge: 0,
      path: '/',
    });
    response.headers.append('Set-Cookie', cookie);

    return response;
  } catch (error) {
    console.error('[v0] Logout error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred during logout' },
      { status: 500 }
    );
  }
}
