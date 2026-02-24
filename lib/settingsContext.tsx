'use client';

import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    type ReactNode,
} from 'react';
import type { AppSettings, UserSettings } from '@/types';
import * as storageService from '@/services/storage/storageService';
import { useAuth } from './authContext';

const DEFAULT_APP_SETTINGS: Omit<AppSettings, 'userId' | 'updatedAt'> = {
    theme: 'light',
    density: 'normal',
    themeAccent: 'blue',
    statusColors: {
        draft: '#94a3b8',
        applied: '#3b82f6',
        interviewing: '#f59e0b',
        offer: '#10b981',
        rejected: '#ef4444',
    },
    notifyFollowUp: true,
    notifyOverdue: true,
    notifyInterviewing: true,
    defaultView: 'list',
    pageSize: 10,
    defaultFollowUpDays: 3,
};

interface SettingsContextValue {
    settings: AppSettings;
    updateSettings: (partial: Partial<Omit<AppSettings, 'userId' | 'updatedAt'>>) => void;
    isLoading: boolean;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

function getSettings(userId: string): AppSettings {
    const stored = storageService.getUserSettings(userId);
    // getUserSettings already merges DEFAULT_SETTINGS and handles userId/updatedAt
    // However, AppSettings has some fields that UserSettings (legacy) might not have.
    // We cast it and ensure it matches the full AppSettings interface.
    return stored as unknown as AppSettings;
}

function saveSettings(userId: string, settings: AppSettings): void {
    storageService.saveUserSettings(userId, settings);
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
