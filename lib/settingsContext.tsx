'use client';

import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    type ReactNode,
} from 'react';
import type { AppSettings } from '@/types';
import * as storageService from '@/services/storage/storageService';
import { useAuth } from './authContext';

const DEFAULT_APP_SETTINGS: Omit<AppSettings, 'userId' | 'updatedAt'> = {
    theme: 'light',
    density: 'normal',
    themeAccent: 'blue',
    statusColors: {
        draft: '#6b7280',
        applied: '#3b82f6',
        interviewing: '#f59e0b',
        offer: '#10b981',
        rejected: '#ef4444',
    },
    notifyFollowUp: true,
    notifyOverdue: true,
    notifyInterviewing: true,
    defaultView: 'list',
    pageSize: 20,
    defaultFollowUpDays: 3,
};

interface SettingsContextValue {
    settings: AppSettings;
    updateSettings: (partial: Partial<Omit<AppSettings, 'userId' | 'updatedAt'>>) => void;
    isLoading: boolean;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

function getSettings(userId: string): AppSettings {
    const key = `jt_v1_${userId}_settings`;
    try {
        const raw = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
        if (!raw) return { ...DEFAULT_APP_SETTINGS, userId, updatedAt: new Date().toISOString() };
        const parsed = JSON.parse(raw) as Partial<AppSettings>;
        return { ...DEFAULT_APP_SETTINGS, ...parsed, userId, updatedAt: parsed.updatedAt ?? new Date().toISOString() };
    } catch {
        return { ...DEFAULT_APP_SETTINGS, userId, updatedAt: new Date().toISOString() };
    }
}

function saveSettings(userId: string, settings: AppSettings): void {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(`jt_v1_${userId}_settings`, JSON.stringify(settings));
    } catch { /* quota exceeded */ }
}

const GUEST_SETTINGS: AppSettings = {
    ...DEFAULT_APP_SETTINGS,
    userId: 'guest',
    updatedAt: new Date().toISOString(),
};

export function SettingsProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [settings, setSettings] = useState<AppSettings>(GUEST_SETTINGS);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (user) {
            setSettings(getSettings(user.id));
        } else {
            setSettings(GUEST_SETTINGS);
        }
        setIsLoading(false);
    }, [user]);

    const updateSettings = useCallback(
        (partial: Partial<Omit<AppSettings, 'userId' | 'updatedAt'>>) => {
            if (!user) return;
            setSettings((prev) => {
                const next: AppSettings = {
                    ...prev,
                    ...partial,
                    userId: user.id,
                    updatedAt: new Date().toISOString(),
                };
                saveSettings(user.id, next);
                return next;
            });
        },
        [user]
    );

    return (
        <SettingsContext.Provider value={{ settings, updateSettings, isLoading }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings(): SettingsContextValue {
    const ctx = useContext(SettingsContext);
    if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
    return ctx;
}
