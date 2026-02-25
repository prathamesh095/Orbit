import { NextRequest, NextResponse } from 'next/server';
import type { User } from '@/types';
import { getServerUsers, findUserByEmail, type StoredUser } from './shared-auth';

interface LoginRequest {
    email: string;
    password: string;
}

interface LoginResponse {
    success: boolean;
    user?: User;
    error?: string;
}

// Simple non-cryptographic hash for DEMO (must be bcryptjs in production)
function hashPassword(password: string): string {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0;
    }
    return `hash_${Math.abs(hash).toString(36)}_${password.length}`;
}

export async function POST(request: NextRequest): Promise<NextResponse<LoginResponse>> {
    try {
        const body: LoginRequest = await request.json();
        const { email, password } = body;

        console.log('[AUTH API] Login attempt:', { email });

        // Validate input
        if (!email || !password) {
            return NextResponse.json(
                { success: false, error: 'Email and password are required' },
                { status: 400 }
            );
        }

        const emailLower = email.toLowerCase().trim();
        const passwordTrimmed = password.trim();

        console.log('[AUTH API] Looking for user:', emailLower);
        console.log('[AUTH API] Users in system:', getServerUsers().map((u: StoredUser) => u.email));

        // Find user by email from server-side storage
        const user = findUserByEmail(emailLower);
        if (!user) {
            console.log('[AUTH API] User not found:', emailLower);
            return NextResponse.json(
                { success: false, error: 'Invalid email or password' },
                { status: 401 }
            );
        }

        // Verify password
        const incomingHash = hashPassword(passwordTrimmed);
        console.log('[AUTH API] Password hash check:', { stored: user.passwordHash, provided: incomingHash });

        if (incomingHash !== user.passwordHash) {
            console.log('[AUTH API] Password mismatch for user:', emailLower);
            return NextResponse.json(
                { success: false, error: 'Invalid email or password' },
                { status: 401 }
            );
        }

        console.log('[AUTH API] Password verified for user:', emailLower);

        // Create response with secure HTTP-only cookie
        const response = NextResponse.json<LoginResponse>(
            {
                success: true,
                user: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt },
            },
            { status: 200 }
        );

        // Set HTTP-only, Secure, SameSite cookie
        response.cookies.set({
            name: 'jt_session_id',
            value: user.id,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60,
            path: '/',
        });

        // Set session cookie for client
        response.cookies.set({
            name: 'jt_authenticated',
            value: '1',
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60,
            path: '/',
        });

        console.log('[AUTH API] Login successful:', emailLower);

        return response;
    } catch (error) {
        console.error('[AUTH API] Login error:', error);
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { success: false, error: `Login failed: ${errorMsg}` },
            { status: 500 }
        );
    }
}

export const runtime = 'nodejs';
