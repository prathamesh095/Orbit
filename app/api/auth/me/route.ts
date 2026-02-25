import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSession, findUserById } from '@/lib/db';
import type { User } from '@/types';

interface MeResponse {
    success: boolean;
    user?: User;
    error?: string;
}

/**
 * Get current user session endpoint
 * Used to restore session after page refresh
 * Validates the HTTP-only session cookie server-side
 */
export async function GET(request: NextRequest): Promise<NextResponse<MeResponse>> {
    try {
        console.log('[AUTH] Get current user attempt');

        // Get session cookie
        const cookieStore = await cookies();
        const sessionId = cookieStore.get('jt_session_id')?.value;

        if (!sessionId) {
            console.log('[AUTH] No session cookie found');
            return NextResponse.json(
                { success: false, error: 'Not authenticated' },
                { status: 401 }
            );
        }

        // Verify session exists and is not expired
        const sessionData = getSession(sessionId);
        if (!sessionData) {
            console.log('[AUTH] Session invalid or expired:', sessionId);
            return NextResponse.json(
                { success: false, error: 'Session invalid or expired' },
                { status: 401 }
            );
        }

        console.log('[AUTH] Session valid:', { userId: sessionData.userId });

        // Get fresh user data from database
        const user = findUserById(sessionData.userId);
        if (!user) {
            console.log('[AUTH] User not found:', sessionData.userId);
            return NextResponse.json(
                { success: false, error: 'User not found' },
                { status: 401 }
            );
        }

        console.log('[AUTH] Current user retrieved:', user.email);
        return NextResponse.json<MeResponse>(
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
    } catch (error) {
        console.error('[AUTH] Get me error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export const runtime = 'nodejs';
