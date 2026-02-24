'use client';

import { memo, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Eye, Pencil, Trash2, MoreHorizontal,
    CalendarClock, Clock,
} from 'lucide-react';
import { cn, formatDate, classifyUrgency } from '@/lib/utils';
import type { Application, UrgencyLevel } from '@/types';

// ─── Constants ────────────────────────────────────────────────────────

const STIFF_SPRING = { type: 'spring', stiffness: 400, damping: 30 };

const URGENCY_CFG: Record<UrgencyLevel, { label: string; cls: string }> = {
    critical: { label: 'Interview today', cls: 'text-amber-700 bg-amber-50/80 ring-1 ring-amber-200/60 shadow-sm' },
    overdue: { label: 'Overdue', cls: 'text-red-700 bg-red-50/80 ring-1 ring-red-200/60 shadow-sm' },
    due_today: { label: 'Due today', cls: 'text-blue-700 bg-blue-50/80 ring-1 ring-blue-200/60 shadow-sm' },
    normal: { label: '', cls: 'text-neutral-400' },
};

// ─── Highlight (Premium Search Touch) ─────────────────────────────────────────

export function Highlight({ text, query }: { text: string; query: string }) {
    if (!query.trim() || !text) return <>{text}</>;
    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return (
        <>
            {parts.map((part, i) =>
                part.toLowerCase() === query.toLowerCase() ? (
                    <mark key={i} className="bg-blue-100/80 text-blue-900 px-0.5 rounded-sm no-underline inline-block">
                        {part}
                    </mark>
                ) : part
            )}
        </>
    );
}

// ─── Next Step Cell ───────────────────────────────────────────────────────────

export function NextStepCell({ app }: { app: Application }) {
    const urgency = classifyUrgency(app);
    const cfg = URGENCY_CFG[urgency];
    if (!app.nextFollowUp && urgency === 'normal') {
        return <span className="text-neutral-300 text-[12px]">—</span>;
    }
    const date = app.nextFollowUp ? formatDate(app.nextFollowUp) : '';
    if (urgency === 'normal') {
        return (
            <div className="flex items-center gap-1.5 text-neutral-400" style={{ fontSize: 12 }}>
                <CalendarClock style={{ width: 13, height: 13 }} /> {date}
            </div>
        );
    }
    return (
        <span className={cn('inline-flex items-center gap-1 px-2 h-6 rounded-md text-[11px] font-semibold', cfg.cls)}>
            <Clock style={{ width: 10, height: 10, strokeWidth: 2 }} />
            {urgency === 'critical' ? cfg.label : date}
        </span>
    );
}

// ─── Row Actions ──────────────────────────────────────────────────────────────

interface RowActionsProps {
    appId: string;
    isOpen: boolean;
    onToggle: (open: boolean) => void;
    onDelete: (id: string) => void;
    onEdit: (id: string) => void;
    onView: (id: string) => void;
}

export function RowActions({ appId, isOpen, onToggle, onDelete, onEdit, onView }: RowActionsProps) {
    const items = [
        { label: 'View Details', Icon: Eye, action: () => { onView(appId); onToggle(false); } },
        { label: 'Edit Entry', Icon: Pencil, action: () => { onEdit(appId); onToggle(false); } },
        { label: 'Delete Entry', Icon: Trash2, action: () => { onDelete(appId); onToggle(false); }, danger: true },
    ];

    useEffect(() => {
        if (!isOpen) return;
        const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onToggle(false); };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onToggle]);

    return (
        <div className="relative flex justify-end">
            <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onToggle(!isOpen); }}
                className={cn(
                    'w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200',
                    'text-neutral-400 outline-none focus-visible:ring-2 focus-visible:ring-blue-400',
                    isOpen ? 'bg-neutral-900 text-white shadow-md' : 'opacity-0 group-hover:opacity-100 hover:bg-neutral-100 hover:text-neutral-700'
                )}
            >
                <MoreHorizontal style={{ width: 14, height: 14, strokeWidth: 2.5 }} />
            </button>
            <AnimatePresence>
                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-[100]" onClick={() => onToggle(false)} />
                        <motion.div
                            role="menu"
                            initial={{ opacity: 0, scale: 0.96, y: -4 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: -4 }}
                            transition={{ ...STIFF_SPRING }}
                            className="fixed z-[101] w-48 bg-white rounded-xl border border-neutral-100 shadow-2xl shadow-neutral-200/60 overflow-hidden py-1.5"
                            style={{ transform: 'translate(-100%, 8px)' }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {items.map(({ label, Icon, action, danger }) => (
                                <button
                                    key={label}
                                    type="button"
                                    onClick={() => { action(); }}
                                    className={cn(
                                        'w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-[13px] font-semibold transition-colors',
                                        'outline-none focus-visible:bg-neutral-50',
                                        danger ? 'text-red-600 hover:bg-red-50' : 'text-neutral-700 hover:bg-neutral-50'
                                    )}
                                >
                                    <Icon style={{ width: 14, height: 14, strokeWidth: 2.5 }} /> {label}
                                </button>
                            ))}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
