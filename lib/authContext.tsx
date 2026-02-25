'use client';

import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    type ReactNode,
} from 'react';
import type { User } from '@/types';

interface AuthContextValue {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    forgotPassword: (email: string) => Promise<{ token: string }>;
    resetPassword: (token: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * AuthProvider - NEW PRODUCTION IMPLEMENTATION
 * 
 * Server-driven authentication with NO client-side session storage
 * - Authentication state lives only in React context
 * - Session backed by HTTP-only cookies (server-side only)
 * - User data populated from API responses
 * - No localStorage persistence
 * - No sensitive data on client
 */
export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Initialize auth state - user should come from API on refresh
    useEffect(() => {
        console.log('[AUTH] Context initializing');
        // On mount, user will be populated by login/register responses
        // For page refresh: user must call /api/auth/me or similar endpoint
        // For now: We rely on cookies to persist server-side
        setIsLoading(false);
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        console.log('[AUTH Context] Login called');
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include', // Critical: send cookies
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Login failed');
            }

            const data = await response.json();
            if (data.success && data.user) {
                console.log('[AUTH Context] Login successful:', data.user.email);
                // Server set HTTP-only cookie automatically
                setUser(data.user);
            } else {
                throw new Error(data.error || 'Login failed');
            }
        } catch (error) {
            console.error('[AUTH Context] Login error:', error);
            setUser(null);
            throw error;
        }
    }, []);

    const register = useCallback(async (name: string, email: string, password: string) => {
        console.log('[AUTH Context] Register called');
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include', // Critical: send cookies
                body: JSON.stringify({ name, email, password }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Registration failed');
            }

            const data = await response.json();
            if (data.success && data.user) {
                console.log('[AUTH Context] Registration successful:', data.user.email);
                // Server set HTTP-only cookie automatically
                setUser(data.user);
            } else {
                throw new Error(data.error || 'Registration failed');
            }
        } catch (error) {
            console.error('[AUTH Context] Register error:', error);
            setUser(null);
            throw error;
        }
    }, []);

    const logout = useCallback(async () => {
        console.log('[AUTH Context] Logout called');
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include', // Critical: send cookies
            });

            console.log('[AUTH Context] Logout successful');
            setUser(null);
        } catch (error) {
            console.error('[AUTH Context] Logout error:', error);
            // Clear state anyway
            setUser(null);
        }
    }, []);

    const forgotPassword = useCallback(async (email: string) => {
        // TODO: Implement in production
        return Promise.resolve({ token: '' });
    }, []);

    const resetPassword = useCallback(async (token: string, newPassword: string) => {
        // TODO: Implement in production
        return Promise.resolve();
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                isAuthenticated: user !== null,
                login,
                register,
                logout,
                forgotPassword,
                resetPassword,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
