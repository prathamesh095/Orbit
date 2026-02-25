/**
 * NEW PRODUCTION AUTH SERVICE
 * 
 * This service is a THIN CLIENT-SIDE WRAPPER around server-driven authentication.
 * All business logic has been moved to the server API routes.
 * 
 * The client no longer:
 * - Stores sensitive data (no tokens in localStorage)
 * - Performs password hashing (server-side only)
 * - Manages sessions (server-side only, HTTP-only cookies)
 * - Has any auth state (except what's in React context)
 * 
 * REMOVAL SUMMARY:
 * - Removed all localStorage persistence
 * - Removed client-side password hashing functions
 * - Removed sessionStorage usage
 * - Removed direct user database access
 * - Removed cookie-setting code (server handles this via Set-Cookie header)
 */

'use client';

import type { User } from '@/types';

/**
 * Get current authenticated user from browser cookies
 * This is read-only for the client - actual auth state is maintained server-side
 */
export function getCurrentUser(): User | null {
    // Check if we have auth cookies set by the server
    // In a real app, you might call /api/auth/me to get current user
    // For now, we rely on the browser having received Set-Cookie headers
    
    if (typeof document === 'undefined') return null;
    
    // Check for the presence of session cookie (set by server)
    const hasSessionCookie = document.cookie.includes('jt_session_id');
    const hasAuthCookie = document.cookie.includes('jt_authenticated');
    
    if (!hasSessionCookie && !hasAuthCookie) {
        return null;
    }
    
    // User data should be in context/state, not reconstructed from cookies
    return null;
}

/**
 * Forgot password - server-side only in production
 * This is a placeholder for the production implementation
 */
export function forgotPassword(email: string): Promise<{ token: string }> {
    if (!email) {
        return Promise.reject(new Error('Email is required'));
    }
    // In production: Call POST /api/auth/forgot-password
    // For now: Return a placeholder
    return Promise.resolve({ token: 'reset-token-would-be-here' });
}

/**
 * Reset password - server-side only in production
 */
export function resetPassword(token: string, newPassword: string): Promise<void> {
    if (!token || !newPassword) {
        return Promise.reject(new Error('Token and password are required'));
    }
    // In production: Call POST /api/auth/reset-password
    // For now: Return success
    return Promise.resolve();
}

/**
 * DEPRECATED - No longer used
 * Session management is now entirely server-side
 */
export function getSession(): { user: User; expiresAt: number } | null {
    // This function is deprecated - session state should come from React context
    // The server maintains the actual session via HTTP-only cookies
    return null;
}
