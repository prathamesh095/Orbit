import { NextRequest, NextResponse } from 'next/server';
import { createUser, logAuthEvent, validatePassword, parseIpAddress } from '@/lib/auth-server';
import { checkRateLimit, getRateLimitResetTime, getRateLimitKey, RATE_LIMIT_CONFIGS } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, confirmPassword, fullName } = body;

    // Get client IP and user agent
    const rawIpAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const ipAddress = parseIpAddress(rawIpAddress);
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Check rate limit
    const rateLimitKey = getRateLimitKey('register', ipAddress);
    const isAllowed = checkRateLimit(rateLimitKey, RATE_LIMIT_CONFIGS.register);
    
    if (!isAllowed) {
      const resetTime = getRateLimitResetTime(rateLimitKey);
      return NextResponse.json(
        { success: false, message: `Too many registration attempts. Please try again in ${Math.ceil(resetTime / 1000)} seconds.` },
        { status: 429, headers: { 'Retry-After': Math.ceil(resetTime / 1000).toString() } }
      );
    }

    // Validate input
    if (!email || !password || !confirmPassword || !fullName) {
      await logAuthEvent(null, 'REGISTER_ATTEMPT', ipAddress, userAgent, false, 'Missing required fields');
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      await logAuthEvent(null, 'REGISTER_ATTEMPT', ipAddress, userAgent, false, 'Invalid email format');
      return NextResponse.json(
        { success: false, message: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate passwords match
    if (password !== confirmPassword) {
      await logAuthEvent(null, 'REGISTER_ATTEMPT', ipAddress, userAgent, false, 'Passwords do not match');
      return NextResponse.json(
        { success: false, message: 'Passwords do not match' },
        { status: 400 }
      );
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      await logAuthEvent(null, 'REGISTER_ATTEMPT', ipAddress, userAgent, false, passwordValidation.errors.join(', '));
      return NextResponse.json(
        { success: false, message: 'Password does not meet requirements', errors: passwordValidation.errors },
        { status: 400 }
      );
    }

    // Create user
    const result = await createUser(email.toLowerCase(), password, fullName);
    
    if (!result) {
      await logAuthEvent(null, 'REGISTER_ATTEMPT', ipAddress, userAgent, false, 'User creation failed - email may already exist');
      return NextResponse.json(
        { success: false, message: 'Registration failed. Email may already be registered.' },
        { status: 409 }
      );
    }

    // Log successful registration
    await logAuthEvent(result.userId, 'REGISTER_SUCCESS', ipAddress, userAgent, true);

    return NextResponse.json(
      { success: true, message: 'Registration successful. Please log in.' },
      { status: 201 }
    );
  } catch (error) {
    console.error('[v0] Register error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred during registration' },
      { status: 500 }
    );
  }
}
