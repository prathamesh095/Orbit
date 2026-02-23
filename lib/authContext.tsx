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
        // Restore session on mount
        const session = authService.getCurrentSession();
        if (session) {
            setUser(session.user);
        }
        setIsLoading(false);

        // Check session expiry every minute
        const interval = setInterval(() => {
            const valid = authService.getCurrentSession();
            if (!valid) {
                setUser(null);
            }
        }, 60_000);

        return () => clearInterval(interval);
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        const { user: loggedIn } = await authService.login(email, password);
        setUser(loggedIn);
    }, []);

    const register = useCallback(async (name: string, email: string, password: string) => {
        const { user: registered } = await authService.register(name, email, password);
        setUser(registered);
    }, []);

    const logout = useCallback(async () => {
        await authService.logout();
        setUser(null);
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
