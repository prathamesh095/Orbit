'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { ApplicationFormValues } from '@/lib/validations';

type Intent = ApplicationFormValues['recordIntent'];

const INTENT_STYLES: Record<Intent, string> = {
    application: 'bg-blue-50/80 text-blue-700 ring-blue-200/60 shadow-sm shadow-blue-100/50',
    outreach: 'bg-purple-50/80 text-purple-700 ring-purple-200/60 shadow-sm shadow-purple-100/50',
    recruiter: 'bg-amber-50/80 text-amber-700 ring-amber-200/60 shadow-sm shadow-amber-100/50',
    networking: 'bg-emerald-50/80 text-emerald-700 ring-emerald-200/60 shadow-sm shadow-emerald-100/50',
    followup: 'bg-rose-50/80 text-rose-700 ring-rose-200/60 shadow-sm shadow-rose-100/50',
};

const INTENT_LABELS: Record<Intent, string> = {
    application: 'Application',
    outreach: 'Outreach',
    recruiter: 'Recruiter',
    networking: 'Networking',
    followup: 'Follow-up',
};

interface IntentBadgeProps {
    intent: Intent;
    className?: string;
}

export function IntentBadge({ intent, className }: IntentBadgeProps) {
    return (
        <span className={cn(
            'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide ring-1 ring-inset whitespace-nowrap',
            INTENT_STYLES[intent] || 'bg-neutral-50 text-neutral-600 ring-neutral-600/10',
            className
        )}>
            {INTENT_LABELS[intent] || intent}
        </span>
    );
}
