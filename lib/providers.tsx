'use client';

import { AuthProvider } from './authContext';
import { ToastProvider } from './toastContext';
import { SettingsProvider } from './settingsContext';
import type { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
    return (
        <AuthProvider>
            <ToastProvider>
                <SettingsProvider>
                    {children}
                </SettingsProvider>
            </ToastProvider>
        </AuthProvider>
    );
}
