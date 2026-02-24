import { NextRequest, NextResponse } from 'next/server';
import type { StoredUser } from '@/services/storage/storageService';
import { getStoredUsers, saveSession, type User } from '@/services/storage/storageService';

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

        // Validate input
        if (!email || !password) {
            return NextResponse.json(
                { success: false, error: 'Email and password are required' },
                { status: 400 }
            );
        }

        // Get users from storage (in production: from database)
        const users = getStoredUsers();
        const emailLower = email.toLowerCase().trim();
        const passwordTrimmed = password.trim();

        // Find user
        const user = users.find((u: StoredUser) => u.email === emailLower);
        if (!user) {
            // Don't reveal user doesn't exist
            return NextResponse.json(
                { success: false, error: 'Invalid email or password' },
                { status: 401 }
            );
        }

        // Verify password
        const incomingHash = hashPassword(passwordTrimmed);
        if (incomingHash !== user.passwordHash) {
            return NextResponse.json(
                { success: false, error: 'Invalid email or password' },
                { status: 401 }
            );
        }

        // Create session in storage (in production: database)
        const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
        const session = {
            user: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt },
            expiresAt,
        };
        saveSession(session);

        // Create response with secure HTTP-only cookie
        const response = NextResponse.json<LoginResponse>(
            {
                success: true,
                user: session.user,
            },
            { status: 200 }
        );

        // Set HTTP-only, Secure, SameSite cookie
        // This cookie is only for middleware verification
        response.cookies.set({
            name: 'jt_session_id',
            value: user.id,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60, // 24 hours in seconds
            path: '/',
        });

        // Set session cookie for client (non-sensitive flag only)
        response.cookies.set({
            name: 'jt_authenticated',
            value: '1',
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60,
            path: '/',
        });

        return response;
    } catch (error) {
        console.error('[AUTH API] Login error:', error);
        return NextResponse.json(
            { success: false, error: 'Login failed. Please try again.' },
            { status: 500 }
        );
    }
}

export const runtime = 'nodejs';
