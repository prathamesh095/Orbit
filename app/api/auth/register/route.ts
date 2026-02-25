import { NextRequest, NextResponse } from 'next/server';
import type { User } from '@/types';
import { getServerUsers, addServerUser, emailExists, type StoredUser } from './shared-auth';

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

function generateId(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
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

export async function POST(request: NextRequest): Promise<NextResponse<RegisterResponse>> {
    try {
        const body: RegisterRequest = await request.json();
        const { name, email, password } = body;

        console.log('[AUTH API] Register attempt:', { name, email });

        // Validate input
        if (!name || !email || !password) {
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

        const emailLower = email.toLowerCase().trim();

        console.log('[AUTH API] Checking for existing user:', emailLower);

        // Check if user already exists
        if (emailExists(emailLower)) {
            console.log('[AUTH API] User already exists:', emailLower);
            return NextResponse.json(
                { success: false, error: 'An account with this email already exists' },
                { status: 409 }
            );
        }

        // Create new user
        const now = new Date().toISOString();
        const newUser: StoredUser = {
            id: generateId(),
            email: emailLower,
            name: name.trim(),
            passwordHash: hashPassword(password.trim()),
            createdAt: now,
        };

        console.log('[AUTH API] Creating new user:', newUser.id);

        // Save user to server-side storage
        addServerUser(newUser);

        // Verify write succeeded
        const users = getServerUsers();
        const persisted = users.find((u: StoredUser) => u.id === newUser.id);
        if (!persisted) {
            console.error('[AUTH API] User not found after save:', newUser.id);
            return NextResponse.json(
                { success: false, error: 'Failed to save account' },
                { status: 500 }
            );
        }

        console.log('[AUTH API] User saved successfully:', newUser.email);

        // Create response with secure cookies
        const response = NextResponse.json<RegisterResponse>(
            {
                success: true,
                user: { id: newUser.id, email: newUser.email, name: newUser.name, createdAt: newUser.createdAt },
            },
            { status: 201 }
        );

        // Set HTTP-only, Secure, SameSite cookie
        response.cookies.set({
            name: 'jt_session_id',
            value: newUser.id,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60,
            path: '/',
        });

        response.cookies.set({
            name: 'jt_authenticated',
            value: '1',
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60,
            path: '/',
        });

        console.log('[AUTH API] Registration successful:', newUser.email);

        return response;
    } catch (error) {
        console.error('[AUTH API] Register error:', error);
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { success: false, error: `Registration failed: ${errorMsg}` },
            { status: 500 }
        );
    }
}

export const runtime = 'nodejs';
