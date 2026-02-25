import { NextRequest, NextResponse } from 'next/server';
import type { User } from '@/types';
import { createUser, createSession, generateSessionId } from '@/lib/db';

interface RegisterRequest {
    name: string;
    email: string;
    password: string;
}

interface RegisterResponse {
    success: boolean;
    user?: User;
    error?: string;
}

/**
 * Register endpoint - Create new user account
 * Server-driven, secure, production-grade authentication
 */
export async function POST(request: NextRequest): Promise<NextResponse<RegisterResponse>> {
    try {
        const body: RegisterRequest = await request.json();
        const { name, email, password } = body;

        console.log('[AUTH] Registration attempt:', { email: email?.trim() });

        // Input validation
        if (!name?.trim() || !email?.trim() || !password?.trim()) {
            return NextResponse.json(
                { success: false, error: 'Name, email, and password are required' },
                { status: 400 }
            );
        }

        if (name.trim().length < 2) {
            return NextResponse.json(
                { success: false, error: 'Name must be at least 2 characters' },
                { status: 400 }
            );
        }

        if (password.trim().length < 6) {
            return NextResponse.json(
                { success: false, error: 'Password must be at least 6 characters' },
                { status: 400 }
            );
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            return NextResponse.json(
                { success: false, error: 'Please enter a valid email address' },
                { status: 400 }
            );
        }

        // Create user (throws if email exists)
        let newUser;
        try {
            newUser = createUser(email, name, password);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to create user';
            console.log('[AUTH] User creation failed:', message);
            return NextResponse.json(
                { success: false, error: message },
                { status: message.includes('already') ? 409 : 400 }
            );
        }

        console.log('[AUTH] User created:', { id: newUser.id, email: newUser.email });

        // Create session - returns both sessionId and sessionData
        const { sessionId, sessionData } = createSession(newUser.id);

        console.log('[AUTH] Session created:', { sessionId });

        // Return response with secure HTTP-only cookies
        const response = NextResponse.json<RegisterResponse>(
            {
                success: true,
                user: {
                    id: newUser.id,
                    email: newUser.email,
                    name: newUser.name,
                    createdAt: newUser.createdAt.toISOString(),
                },
            },
            { status: 201 }
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

        console.log('[AUTH] Registration successful:', newUser.email);
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
