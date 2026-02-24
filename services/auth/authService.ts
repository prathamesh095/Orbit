'use client';

import type { User } from '@/types';

// ─── Client-side Auth Service ─────────────────────────────────────────────────
// All authentication now goes through secure server-side API endpoints.
// Passwords are hashed server-side, sessions are managed via HTTP-only cookies.

export interface RegisterPayload {
    email: string;
    password: string;
    confirmPassword: string;
    fullName: string;
}

export interface LoginPayload {
    email: string;
    password: string;
}

export interface AuthResponse {
    success: boolean;
    message: string;
    errors?: string[];
}

export interface SessionResponse {
    authenticated: boolean;
    userId?: string;
}

// Register user via secure API
export async function register(payload: RegisterPayload): Promise<AuthResponse> {
    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            credentials: 'include',
        });

        const data: AuthResponse = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Registration failed');
        }

        return data;
    } catch (error) {
        console.error('[v0] Registration error:', error);
        throw error instanceof Error ? error : new Error('Registration failed');
    }
}

// Login user via secure API
export async function login(payload: LoginPayload): Promise<AuthResponse> {
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            credentials: 'include',
        });

        const data: AuthResponse = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Login failed');
        }

        return data;
    } catch (error) {
        console.error('[v0] Login error:', error);
        throw error instanceof Error ? error : new Error('Login failed');
    }
}

// Logout user via secure API
export async function logout(): Promise<void> {
    try {
        await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include',
        });
    } catch (error) {
        console.error('[v0] Logout error:', error);
        throw error instanceof Error ? error : new Error('Logout failed');
    }
}

// Check session status via secure API
export async function checkSession(): Promise<SessionResponse> {
    try {
        const response = await fetch('/api/auth/session', {
            method: 'GET',
            credentials: 'include',
        });

        const data: SessionResponse = await response.json();
        return data;
    } catch (error) {
        console.error('[v0] Session check error:', error);
        return { authenticated: false };
    }
}

// Get user data (stub - in production, fetch from /api/auth/user endpoint)
export async function getCurrentUser(): Promise<User | null> {
    const session = await checkSession();
    if (session.authenticated && session.userId) {
        // In production, fetch user details from database
        return {
            id: session.userId,
            email: 'user@example.com',
            name: 'User',
            createdAt: new Date().toISOString(),
        };
    }
    return null;
}

// Backward compatibility wrappers
export async function register_legacy(
    name: string,
    email: string,
    password: string
): Promise<{ user: User }> {
    const response = await register({ email, password, confirmPassword: password, fullName: name });
    if (!response.success) throw new Error(response.message);
    return { user: { id: '', email, name, createdAt: new Date().toISOString() } };
}

export async function login_legacy(
    email: string,
    password: string
): Promise<{ user: User }> {
    const response = await login({ email, password });
    if (!response.success) throw new Error(response.message);
    return { user: { id: '', email, name: 'User', createdAt: new Date().toISOString() } };
}

export function getCurrentSession(): { user: User; expiresAt: number } | null {
    // Sessions are managed server-side via HTTP-only cookies
    // This is a placeholder for backward compatibility
    return null;
}

export function isAuthenticated(): boolean {
    // Use checkSession for real authentication status
    return false;
}
