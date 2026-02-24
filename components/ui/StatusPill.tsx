'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { ApplicationStatus } from '@/types';

const STATUS_CONFIG: Record<ApplicationStatus, { label: string; dot: string; pill: string }> = {
    draft: {
        label: 'Draft',
        dot: 'bg-neutral-500',
        pill: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700',
    },
    applied: {
        label: 'Applied',
        dot: 'bg-blue-apple',
        pill: 'bg-blue-apple/10 dark:bg-blue-apple/15 text-blue-apple dark:text-blue-apple border border-blue-apple/20 dark:border-blue-apple/30',
    },
    interviewing: {
        label: 'Interviewing',
        dot: 'bg-warning',
        pill: 'bg-warning/10 dark:bg-warning/15 text-warning dark:text-warning border border-warning/20 dark:border-warning/30',
    },
    offer: {
        label: 'Offer',
        dot: 'bg-success',
        pill: 'bg-success/10 dark:bg-success/15 text-success dark:text-success border border-success/20 dark:border-success/30',
    },
    rejected: {
        label: 'Rejected',
        dot: 'bg-danger',
        pill: 'bg-danger/10 dark:bg-danger/15 text-danger dark:text-danger border border-danger/20 dark:border-danger/30',
    },
};

interface StatusPillProps {
    status: ApplicationStatus;
    className?: string;
    showDot?: boolean;
}

export function StatusPill({ status, className, showDot = true }: StatusPillProps) {
    const cfg = STATUS_CONFIG[status];
    if (!cfg) return null;

    return (
        <span
            className={cn(
                'inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider select-none whitespace-nowrap',
                'shadow-elevation-1 transition-all duration-150',
                cfg.pill,
                className
            )}
        >
            {showDot && <span className={cn('w-2 h-2 rounded-full shrink-0', cfg.dot)} />}
            {cfg.label}
        </span>
    );
}
