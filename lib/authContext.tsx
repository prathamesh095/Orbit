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
import * as authService from '@/services/auth/authService';

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

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Restore session from server on mount
        const restoreSession = async () => {
            try {
                const session = authService.getCurrentSession();
                if (session) {
                    setUser(session.user);
                }
            } catch (error) {
                console.error('[AUTH] Failed to restore session:', error);
            } finally {
                setIsLoading(false);
            }
        };

        restoreSession();

        // Check session validity periodically
        const interval = setInterval(() => {
            const session = authService.getCurrentSession();
            if (!session) {
                setUser(null);
            }
        }, 60_000); // Check every minute

        return () => clearInterval(interval);
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        try {
            // Call server-side API route
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include', // Include cookies
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Login failed');
            }

            const data = await response.json();
            if (data.success && data.user) {
                // Server set HTTP-only cookie, update state
                setUser(data.user);
                // Also update localStorage session for hydration
                authService.saveSession({
                    user: data.user,
                    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
                });
            } else {
                throw new Error(data.error || 'Login failed');
            }
        } catch (error) {
            console.error('[AUTH] Login error:', error);
            throw error;
        }
    }, []);

    const register = useCallback(async (name: string, email: string, password: string) => {
        try {
            // Call server-side API route
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ name, email, password }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Registration failed');
            }

            const data = await response.json();
            if (data.success && data.user) {
                setUser(data.user);
                // Also update localStorage session for hydration
                authService.saveSession({
                    user: data.user,
                    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
                });
            } else {
                throw new Error(data.error || 'Registration failed');
            }
        } catch (error) {
            console.error('[AUTH] Register error:', error);
            throw error;
        }
    }, []);

    const logout = useCallback(async () => {
        try {
            // Call server-side logout API
            await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include',
            });

            // Clear client state
            authService.logout();
            setUser(null);
        } catch (error) {
            console.error('[AUTH] Logout error:', error);
            // Clear state anyway
            authService.logout();
            setUser(null);
        }
    }, []);

    const forgotPassword = useCallback(async (email: string) => {
        return authService.forgotPassword(email);
    }, []);

    const resetPassword = useCallback(async (token: string, newPassword: string) => {
        return authService.resetPassword(token, newPassword);
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
