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
    default: 'bg-[#007AFF]/10 text-[#007AFF] border-[#007AFF]/10',
    success: 'bg-[#34C759]/10 text-[#34C759] border-[#34C759]/10',
    warning: 'bg-[#FF9500]/10 text-[#FF9500] border-[#FF9500]/10',
    danger: 'bg-[#FF3B30]/10 text-[#FF3B30] border-[#FF3B30]/10',
    info: 'bg-[#5856D6]/10 text-[#5856D6] border-[#5856D6]/10',
    neutral: 'bg-[#8E8E93]/10 text-[#8E8E93] border-[#8E8E93]/10',
};

const dotColors: Record<BadgeVariant, string> = {
    default: 'bg-[#007AFF]',
    success: 'bg-[#34C759]',
    warning: 'bg-[#FF9500]',
    danger: 'bg-[#FF3B30]',
    info: 'bg-[#5856D6]',
    neutral: 'bg-[#8E8E93]',
};

export function Badge({ variant = 'default', children, className, dot = false }: BadgeProps) {
    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[6px] text-[11px] font-semibold uppercase tracking-wider border',
                variantStyles[variant],
                className
            )}
        >
            {dot && (
                <span className={cn('w-1 h-1 rounded-full shrink-0', dotColors[variant])} />
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
