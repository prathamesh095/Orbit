'use client';

import React from 'react';
import { cn } from '@/lib/utils';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface BadgeProps {
    variant?: BadgeVariant;
    children: React.ReactNode;
    className?: string;
    dot?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
    default: 'bg-blue-apple/10 text-blue-apple border-blue-apple/20 dark:bg-blue-apple/15 dark:text-blue-apple dark:border-blue-apple/30',
    success: 'bg-success/10 text-success border-success/20 dark:bg-success/15 dark:border-success/30',
    warning: 'bg-warning/10 text-warning border-warning/20 dark:bg-warning/15 dark:border-warning/30',
    danger: 'bg-danger/10 text-danger border-danger/20 dark:bg-danger/15 dark:border-danger/30',
    info: 'bg-info/10 text-info border-info/20 dark:bg-info/15 dark:border-info/30',
    neutral: 'bg-neutral-400/10 text-neutral-600 border-neutral-400/20 dark:bg-neutral-600/20 dark:text-neutral-300 dark:border-neutral-600/30',
};

const dotColors: Record<BadgeVariant, string> = {
    default: 'bg-blue-apple',
    success: 'bg-success',
    warning: 'bg-warning',
    danger: 'bg-danger',
    info: 'bg-info',
    neutral: 'bg-neutral-500',
};

export function Badge({ variant = 'default', children, className, dot = false }: BadgeProps) {
    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border',
                variantStyles[variant],
                className
            )}
        >
            {dot && (
                <span className={cn('w-2 h-2 rounded-full shrink-0', dotColors[variant])} />
            )}
            {children}
        </span>
    );
}

// Status-specific convenience
const STATUS_BADGE_MAP: Record<string, BadgeVariant> = {
    draft: 'neutral',
    applied: 'default',
    interviewing: 'warning',
    offer: 'success',
    rejected: 'danger',
};

const STATUS_LABELS: Record<string, string> = {
    draft: 'Draft',
    applied: 'Applied',
    interviewing: 'Interviewing',
    offer: 'Offer',
    rejected: 'Rejected',
};

export function StatusBadge({ status }: { status: string }) {
    const variant = STATUS_BADGE_MAP[status] ?? 'neutral';
    return (
        <Badge variant={variant} dot>
            {STATUS_LABELS[status] ?? status}
        </Badge>
    );
}
