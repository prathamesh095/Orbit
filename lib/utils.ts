import { type ClassValue, clsx } from 'clsx';
import type { UrgencyLevel, Application } from '@/types';

// Simple cn() utility without installing clsx — inline implementation
export function cn(...classes: (string | undefined | null | boolean)[]): string {
    return classes.filter(Boolean).join(' ');
}

export function formatDate(dateStr: string | undefined | null): string {
    if (!dateStr) return '—';
    try {
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        }).format(new Date(dateStr));
    } catch {
        return dateStr;
    }
}

export function formatRelativeDate(dateStr: string): string {
    try {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        return formatDate(dateStr);
    } catch {
        return dateStr;
    }
}

export function classifyUrgency(app: Application): UrgencyLevel {
    const todayStr = new Date().toISOString().split('T')[0];

    if (app.status === 'interviewing') return 'critical';

    // Outreach/Networking specific logic
    const isOutreach = app.recordIntent === 'outreach' || app.recordIntent === 'networking';
    const followUpSent = isOutreach ? (app as any).followUpSent : false;

    if (app.nextFollowUp) {
        if (app.nextFollowUp < todayStr && !followUpSent) return 'overdue';
        if (app.nextFollowUp === todayStr && !followUpSent) return 'due_today';
    }

    return 'normal';
}

export function generateId(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function truncate(str: string, maxLen: number): string {
    if (str.length <= maxLen) return str;
    return `${str.slice(0, maxLen)}…`;
}

export function slugify(str: string): string {
    return str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

export function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const STATUS_LABELS: Record<string, string> = {
    draft: 'Draft',
    applied: 'Applied',
    interviewing: 'Interviewing',
    offer: 'Offer',
    rejected: 'Rejected',
};

export const STATUS_COLORS: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700 border-gray-200',
    applied: 'bg-blue-100 text-blue-700 border-blue-200',
    interviewing: 'bg-amber-100 text-amber-700 border-amber-200',
    offer: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    rejected: 'bg-red-100 text-red-700 border-red-200',
};

export const URGENCY_COLORS: Record<UrgencyLevel, string> = {
    critical: 'text-red-600',
    overdue: 'text-rose-600',
    due_today: 'text-amber-600',
    normal: 'text-gray-400',
};

export const AVATAR_PALETTES = [
    'bg-blue-50 text-blue-700 ring-1 ring-blue-100',
    'bg-violet-50 text-violet-700 ring-1 ring-violet-100',
    'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100',
    'bg-amber-50 text-amber-700 ring-1 ring-amber-100',
    'bg-rose-50 text-rose-700 ring-1 ring-rose-100',
    'bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100',
];

export function avatarPalette(s: string) {
    if (!s) return AVATAR_PALETTES[0];
    let h = 0;
    for (let i = 0; i < s.length; i++) h = s.charCodeAt(i) + ((h << 5) - h);
    return AVATAR_PALETTES[Math.abs(h) % AVATAR_PALETTES.length];
}

export function getInitials(s: string) {
    if (!s) return '';
    return s.split(/\s+/).slice(0, 2).map((w) => w[0] ?? '').join('').toUpperCase();
}
