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
    default: 'bg-blue-100 text-blue-700 border-blue-200',
    success: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-100 text-amber-700 border-amber-200',
    danger: 'bg-red-100 text-red-700 border-red-200',
    info: 'bg-cyan-100 text-cyan-700 border-cyan-200',
    neutral: 'bg-gray-100 text-gray-700 border-gray-200',
};

const dotColors: Record<BadgeVariant, string> = {
    default: 'bg-blue-500',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-red-500',
    info: 'bg-cyan-500',
    neutral: 'bg-gray-400',
};

export function Badge({ variant = 'default', children, className, dot = false }: BadgeProps) {
    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border',
                variantStyles[variant],
                className
            )}
        >
            {dot && (
                <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotColors[variant])} />
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
