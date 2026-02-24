import { NextRequest, NextResponse } from 'next/server';
import { clearSession } from '@/services/storage/storageService';

interface LogoutResponse {
    success: boolean;
}

export async function POST(request: NextRequest): Promise<NextResponse<LogoutResponse>> {
    try {
        // Clear server-side session
        clearSession();

        // Create response
        const response = NextResponse.json<LogoutResponse>(
            { success: true },
            { status: 200 }
        );

        // Clear authentication cookies
        response.cookies.set({
            name: 'jt_session_id',
            value: '',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 0,
            path: '/',
        });

        response.cookies.set({
            name: 'jt_authenticated',
            value: '',
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 0,
            path: '/',
        });

        return response;
    } catch (error) {
        console.error('[AUTH API] Logout error:', error);
        return NextResponse.json(
            { success: false } as any,
            { status: 500 }
        );
    }
}

export const runtime = 'nodejs';
