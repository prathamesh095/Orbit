'use client';

import { AuthProvider } from './authContext';
import { ToastProvider } from './toastContext';
import { SettingsProvider } from './settingsContext';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './queryClient';
// import { ReactQueryDevtools } from '@tanstack/react-query-devtools'; // Uncomment if devtools installed
import type { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <ToastProvider>
                    <SettingsProvider>
                        {children}
                        {/* <ReactQueryDevtools initialIsOpen={false} /> */}
                    </SettingsProvider>
                </ToastProvider>
            </AuthProvider>
        </QueryClientProvider>
    );
}
