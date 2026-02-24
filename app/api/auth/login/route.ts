import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail, verifyPassword, createSession, logAuthEvent, updateLastLogin } from '@/lib/auth-server';
import { checkRateLimit, getRateLimitRemaining, getRateLimitResetTime, getRateLimitKey, RATE_LIMIT_CONFIGS } from '@/lib/rate-limit';
import { serialize } from 'cookie';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60, // 7 days
  path: '/',
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Get client IP and user agent
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Check rate limit
    const rateLimitKey = getRateLimitKey('login', ipAddress);
    const isAllowed = checkRateLimit(rateLimitKey, RATE_LIMIT_CONFIGS.login);
    
    if (!isAllowed) {
      const resetTime = getRateLimitResetTime(rateLimitKey);
      return NextResponse.json(
        { success: false, message: `Too many login attempts. Please try again in ${Math.ceil(resetTime / 1000)} seconds.` },
        { status: 429, headers: { 'Retry-After': Math.ceil(resetTime / 1000).toString() } }
      );
    }

    // Validate input
    if (!email || !password) {
      await logAuthEvent(null, 'LOGIN_ATTEMPT', ipAddress, userAgent, false, 'Missing email or password');
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Get user
    const user = await getUserByEmail(email);
    if (!user) {
      // Log failed attempt without revealing user doesn't exist (security)
      await logAuthEvent(null, 'LOGIN_ATTEMPT', ipAddress, userAgent, false, 'Invalid credentials');
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      await logAuthEvent(user.id, 'LOGIN_ATTEMPT', ipAddress, userAgent, false, 'Invalid password');
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Create session
    const sessionResult = await createSession(user.id, ipAddress, userAgent);
    if (!sessionResult) {
      await logAuthEvent(user.id, 'LOGIN_ATTEMPT', ipAddress, userAgent, false, 'Session creation failed');
      return NextResponse.json(
        { success: false, message: 'Failed to create session' },
        { status: 500 }
      );
    }

    // Update last login
    await updateLastLogin(user.id);

    // Log successful login
    await logAuthEvent(user.id, 'LOGIN_SUCCESS', ipAddress, userAgent, true);

    // Create response
    const response = NextResponse.json(
      { success: true, message: 'Login successful' },
      { status: 200 }
    );

    // Set secure session cookie
    const cookie = serialize('session', sessionResult.token, COOKIE_OPTIONS);
    response.headers.append('Set-Cookie', cookie);

    return response;
  } catch (error) {
    console.error('[v0] Login error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred during login' },
      { status: 500 }
    );
  }
}
