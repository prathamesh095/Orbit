import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken, hashToken } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  try {
    // Get session token from cookie
    const sessionToken = request.cookies.get('session')?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { authenticated: false, user: null },
        { status: 200 }
      );
    }

    // Verify session token
    const tokenHash = hashToken(sessionToken);
    const sessionData = await verifySessionToken(tokenHash);

    if (!sessionData) {
      return NextResponse.json(
        { authenticated: false, user: null },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { authenticated: true, userId: sessionData.userId },
      { status: 200 }
    );
  } catch (error) {
    console.error('[v0] Session verification error:', error);
    return NextResponse.json(
      { authenticated: false, user: null },
      { status: 200 }
    );
  }
}
