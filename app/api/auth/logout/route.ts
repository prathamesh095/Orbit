import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { deleteSession } from '@/lib/db';

interface LogoutResponse {
    success: boolean;
}

/**
 * Logout endpoint - Destroy session and clear cookies
 * Server-driven session termination
 */
export async function POST(request: NextRequest): Promise<NextResponse<LogoutResponse>> {
    try {
        console.log('[AUTH] Logout attempt');

        // Get session ID from cookies and delete it
        const cookieStore = await cookies();
        const sessionId = cookieStore.get('jt_session_id')?.value;
        if (sessionId) {
            deleteSession(sessionId);
            console.log('[AUTH] Session deleted:', sessionId);
        }

        // Create response
        const response = NextResponse.json<LogoutResponse>(
            { success: true },
            { status: 200 }
        );

        // Clear authentication cookies
        const secure = process.env.NODE_ENV === 'production';
        response.cookies.set({
            name: 'jt_session_id',
            value: '',
            httpOnly: true,
            secure,
            sameSite: 'strict',
            maxAge: 0,
            path: '/',
        });

        response.cookies.set({
            name: 'jt_authenticated',
            value: '',
            httpOnly: false,
            secure,
            sameSite: 'strict',
            maxAge: 0,
            path: '/',
        });

        console.log('[AUTH] Logout successful');
        return response;
    } catch (error) {
        console.error('[AUTH] Logout error:', error);
        return NextResponse.json(
            { success: false },
            { status: 500 }
        );
    }
}

export const runtime = 'nodejs';
