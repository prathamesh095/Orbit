import { NextRequest, NextResponse } from 'next/server';
import type { User } from '@/types';
import { findUserByEmail, verifyPassword, createSession, generateSessionId } from '@/lib/db';

interface LoginRequest {
    email: string;
    password: string;
}

interface LoginResponse {
    success: boolean;
    user?: User;
    error?: string;
}

/**
 * Login endpoint - Authenticate user and create session
 * Server-driven, secure, production-grade authentication
 */
export async function POST(request: NextRequest): Promise<NextResponse<LoginResponse>> {
    try {
        const body: LoginRequest = await request.json();
        const { email, password } = body;

        console.log('[AUTH] Login attempt:', { email: email?.trim() });

        // Input validation
        if (!email?.trim() || !password?.trim()) {
            return NextResponse.json(
                { success: false, error: 'Email and password are required' },
                { status: 400 }
            );
        }

        const emailLower = email.toLowerCase().trim();

        // Find user by email
        const user = findUserByEmail(emailLower);
        if (!user) {
            console.log('[AUTH] User not found:', emailLower);
            return NextResponse.json(
                { success: false, error: 'Invalid email or password' },
                { status: 401 }
            );
        }

        console.log('[AUTH] User found:', { id: user.id });

        // Verify password
        if (!verifyPassword(user, password)) {
            console.log('[AUTH] Password mismatch for user:', emailLower);
            return NextResponse.json(
                { success: false, error: 'Invalid email or password' },
                { status: 401 }
            );
        }

        console.log('[AUTH] Password verified:', emailLower);

        // Create session - returns both sessionId and sessionData
        const { sessionId, sessionData } = createSession(user.id);

        console.log('[AUTH] Session created:', { sessionId, userId: user.id });

        // Return response with secure HTTP-only cookie
        const response = NextResponse.json<LoginResponse>(
            {
                success: true,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    createdAt: user.createdAt.toISOString(),
                },
            },
            { status: 200 }
        );

        // Set secure HTTP-only session cookie (server-side only)
        const secure = process.env.NODE_ENV === 'production';
        response.cookies.set({
            name: 'jt_session_id',
            value: sessionId,
            httpOnly: true,
            secure,
            sameSite: 'strict',
            maxAge: 24 * 60 * 60,
            path: '/',
        });

        // Optional non-httpOnly cookie for client-side checks
        response.cookies.set({
            name: 'jt_authenticated',
            value: '1',
            httpOnly: false,
            secure,
            sameSite: 'strict',
            maxAge: 24 * 60 * 60,
            path: '/',
        });

        console.log('[AUTH] Login successful:', emailLower);
        return response;
    } catch (error) {
        console.error('[AUTH] Unexpected error:', error);
        const errorMsg = error instanceof Error ? error.message : 'Internal server error';
        return NextResponse.json(
            { success: false, error: errorMsg },
            { status: 500 }
        );
    }
}

export const runtime = 'nodejs';
