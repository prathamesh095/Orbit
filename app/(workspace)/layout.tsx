'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Header } from '@/components/dashboard/Header';
import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const STORAGE_KEY = 'jt_sidebar_collapsed';
const ANIMATION_EASING = [0.4, 0, 0.2, 1] as const;
const ANIMATION_DURATION = 0.22;

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    // Read synchronously to avoid layout shift
    const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
        if (typeof window === 'undefined') return false;
        try {
            return window.localStorage.getItem(STORAGE_KEY) === 'true';
        } catch {
            return false;
        }
    });
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.replace('/login');
        }
    }, [isAuthenticated, isLoading, router]);

    const handleToggle = () => {
        setSidebarCollapsed((prev) => {
            const next = !prev;
            try { window.localStorage.setItem(STORAGE_KEY, String(next)); } catch { /* quota */ }
            return next;
        });
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-neutral-50">
                <div className="w-8 h-8 border-[3px] border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!isAuthenticated) return null;

    const contentMargin = sidebarCollapsed ? 72 : 272;

    return (
        <div className="min-h-screen bg-neutral-50">
            {/* Sidebar renders once here — persists across all workspace routes */}
            <Sidebar
                collapsed={sidebarCollapsed}
                onToggle={handleToggle}
                mobileOpen={mobileOpen}
                onMobileClose={() => setMobileOpen(false)}
            />

            {/* Content area shifts with sidebar on desktop only.
                On mobile the sidebar is a drawer overlay so margin must be 0. */}
            <motion.div
                animate={{ marginLeft: contentMargin }}
                transition={{ duration: ANIMATION_DURATION, ease: ANIMATION_EASING }}
                className="flex flex-col min-h-screen [&]:max-lg:!ml-0"
                style={{ isolation: 'isolate' }}
            >
                <Header onMenuClick={() => setMobileOpen((v) => !v)} />
                <main className="flex-1 p-6">
                    <ErrorBoundary>
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.16 }}
                        >
                            {children}
                        </motion.div>
                    </ErrorBoundary>
                </main>
            </motion.div>
        </div>
    );
}
