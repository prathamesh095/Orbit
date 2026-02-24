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
    error: string | null;
    login: (email: string, password: string) => Promise<void>;
    register: (fullName: string, email: string, password: string, confirmPassword: string) => Promise<void>;
    logout: () => Promise<void>;
    clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Check authentication status on mount
    useEffect(() => {
        async function checkAuth() {
            try {
                setIsLoading(true);
                const session = await authService.checkSession();
                if (session.authenticated) {
                    const currentUser = await authService.getCurrentUser();
                    setUser(currentUser);
                } else {
                    setUser(null);
                }
            } catch (err) {
                console.error('[v0] Auth check failed:', err);
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        }

        checkAuth();

        // Check session every 5 minutes
        const interval = setInterval(checkAuth, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        try {
            setError(null);
            const response = await authService.login({ email, password });
            if (response.success) {
                const currentUser = await authService.getCurrentUser();
                setUser(currentUser);
            } else {
                setError(response.message);
                throw new Error(response.message);
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Login failed';
            setError(message);
            throw err;
        }
    }, []);

    const register = useCallback(async (fullName: string, email: string, password: string, confirmPassword: string) => {
        try {
            setError(null);
            const response = await authService.register({ email, password, confirmPassword, fullName });
            if (response.success) {
                // After registration, user needs to log in
                console.log('[v0] Registration successful. Please log in.');
            } else {
                setError(response.message);
                throw new Error(response.message);
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Registration failed';
            setError(message);
            throw err;
        }
    }, []);

    const logout = useCallback(async () => {
        try {
            setError(null);
            await authService.logout();
            setUser(null);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Logout failed';
            setError(message);
            throw err;
        }
    }, []);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                isAuthenticated: user !== null,
                error,
                login,
                register,
                logout,
                clearError,
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
