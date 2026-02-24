'use client';

import { useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';

interface NavigationGuardProps {
    when: boolean;
    message?: string;
    onNavigate?: (url: string) => void;
}

/**
 * NavigationGuard (Experimental / Forensic Implementation)
 * 
 * Intercepts internal Next.js navigation attempts when 'when' is true.
 * Uses a combination of 'beforeunload' for browser-level events
 * and a click-interceptor for local <Link> transitions.
 */
export function NavigationGuard({
    when,
    message = 'You have unsaved changes. Are you sure you want to leave?',
    onNavigate,
}: NavigationGuardProps) {
    const router = useRouter();
    const pathname = usePathname();

    // ── Browser-level guard (refresh/tab close) ──────────────────────────────
    useEffect(() => {
        if (!when) return;
        const handler = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = message;
            return message;
        };
        window.addEventListener('beforeunload', handler);
        return () => window.removeEventListener('beforeunload', handler);
    }, [when, message]);

    // ── Client-side Link interceptor ──────────────────────────────────────────
    const handleAnchorClick = useCallback((e: MouseEvent) => {
        if (!when) return;

        // Find the nearest anchor
        let target = e.target as HTMLElement | null;
        while (target && target.tagName !== 'A') {
            target = target.parentElement;
        }

        const anchor = target as HTMLAnchorElement | null;
        if (!anchor || !anchor.href) return;

        // Check if it's an internal link
        const url = new URL(anchor.href, window.location.origin);
        const isInternal = url.origin === window.location.origin;
        const isSamePath = url.pathname === pathname;

        if (isInternal && !isSamePath) {
            if (!window.confirm(message)) {
                e.preventDefault();
                e.stopPropagation();
            } else {
                onNavigate?.(url.pathname);
            }
        }
    }, [when, message, pathname, onNavigate]);

    useEffect(() => {
        // Use capture phase to intercept before Next.js Link component
        window.addEventListener('click', handleAnchorClick, true);
        return () => window.removeEventListener('click', handleAnchorClick, true);
    }, [handleAnchorClick]);

    return null;
}
