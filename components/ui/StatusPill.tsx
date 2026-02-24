'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { ApplicationStatus } from '@/types';

const STATUS_CONFIG: Record<ApplicationStatus, { label: string; dot: string; pill: string }> = {
    draft: { label: 'Draft', dot: 'bg-neutral-400', pill: 'bg-neutral-100 text-neutral-600 ring-neutral-200 shadow-[0_1px_2px_rgba(0,0,0,0.03)]' },
    applied: { label: 'Applied', dot: 'bg-blue-500', pill: 'bg-blue-50/80 text-blue-700 ring-blue-200/60 shadow-[0_2px_8px_-2px_rgba(59,130,246,0.12)]' },
    interviewing: { label: 'Interviewing', dot: 'bg-amber-500', pill: 'bg-amber-50/80 text-amber-700 ring-amber-200/60 shadow-[0_2px_8px_-2px_rgba(245,158,11,0.12)]' },
    offer: { label: 'Offer', dot: 'bg-emerald-500', pill: 'bg-emerald-50/80 text-emerald-700 ring-emerald-200/60 shadow-[0_2px_8px_-2px_rgba(16,185,129,0.12)]' },
    rejected: { label: 'Rejected', dot: 'bg-red-400', pill: 'bg-red-50/80 text-red-600 ring-red-200/60 shadow-[0_2px_8px_-2px_rgba(239,68,68,0.12)]' },
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
        <span className={cn(
            'inline-flex items-center gap-1.5 px-2.5 h-6 rounded-full text-[11px] font-semibold uppercase tracking-wide ring-1 select-none whitespace-nowrap',
            cfg.pill,
            className
        )}>
            {showDot && <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', cfg.dot)} />}
            {cfg.label}
        </span>
    );
}
