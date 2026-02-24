'use client';

import { memo, useCallback, useRef, useState } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
    Clock,
    MoreHorizontal,
    Pencil,
    Eye,
    Trash2,
    GripVertical,
    Paperclip,
} from 'lucide-react';
import { cn, formatRelativeDate, classifyUrgency } from '@/lib/utils';
import type { Application, ApplicationStatus } from '@/types';
import { IntentBadge } from '@/components/ui/IntentBadge';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface PipelineCardProps {
    application: Application;
    index: number;
    isSelected?: boolean;
    onToggleSelection?: (id: string) => void;
    onDelete?: (id: string) => void;
    onView?: (id: string) => void;
    onEdit?: (id: string) => void;
}

// ─── Status accent ─────────────────────────────────────────────────────────────

const STATUS_ACCENT: Record<ApplicationStatus, string> = {
    draft: 'bg-neutral-300',
    applied: 'bg-blue-400',
    interviewing: 'bg-amber-400',
    offer: 'bg-emerald-400',
    rejected: 'bg-red-400',
};

// ─── Follow-up pill ────────────────────────────────────────────────────────────

function FollowUpPill({ urgency }: { urgency: 'overdue' | 'critical' | 'due_today' | 'normal' }) {
    if (urgency === 'normal') return null;
    const isRed = urgency === 'overdue' || urgency === 'critical';
    const label = isRed ? 'Urgent' : 'Today';
    return (
        <span
            className={cn(
                'inline-flex items-center gap-1 px-1.5 rounded-lg font-bold select-none shrink-0 shadow-sm',
                isRed
                    ? 'bg-red-50 text-red-600 ring-1 ring-red-200'
                    : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
            )}
            style={{ fontSize: 9, height: 18, lineHeight: 1, textTransform: 'uppercase', letterSpacing: '0.025em' }}
        >
            <Clock style={{ width: 8, height: 8, strokeWidth: 3 }} />
            {label}
        </span>
    );
}

// ─── Quick Actions Menu ─────────────────────────────────────────────────────────

interface QuickActionsProps {
    appId: string;
    onDelete?: (id: string) => void;
    onView?: (id: string) => void;
    onEdit?: (id: string) => void;
}

function QuickActions({ appId, onDelete, onView, onEdit }: QuickActionsProps) {
    const [open, setOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const actions = [
        ...(onView ? [{ label: 'View details', Icon: Eye, onClick: () => { onView(appId); setOpen(false); } }] : []),
        ...(onEdit ? [{ label: 'Edit', Icon: Pencil, onClick: () => { onEdit(appId); setOpen(false); } }] : []),
        ...(onDelete ? [{
            label: 'Delete', Icon: Trash2, danger: true,
            onClick: () => { onDelete(appId); setOpen(false); },
        }] : []),
    ];

    return (
        <div className="relative" ref={menuRef}>
            <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
                onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false); }}
                aria-label="Card actions"
                aria-haspopup="menu"
                aria-expanded={open}
                className={cn(
                    'w-6.5 h-6.5 rounded-lg flex items-center justify-center shrink-0',
                    'text-neutral-400 outline-none transition-all duration-200',
                    'focus-visible:ring-2 focus-visible:ring-blue-400',
                    open
                        ? 'bg-neutral-900 text-white opacity-100 shadow-md scale-105'
                        : 'opacity-0 group-hover:opacity-100 hover:bg-neutral-100 hover:text-neutral-700'
                )}
            >
                <MoreHorizontal style={{ width: 14, height: 14, strokeWidth: 2.5 }} />
            </button>

            <AnimatePresence>
                {open && (
                    <>
                        <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
                        <motion.div
                            role="menu"
                            aria-label="Application actions"
                            initial={{ opacity: 0, scale: 0.98, y: -4 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.98, y: -4 }}
                            transition={{ duration: 0.1 }}
                            className={cn(
                                'absolute right-0 top-8 z-30 w-44',
                                'bg-white rounded-xl border border-neutral-100',
                                'shadow-xl shadow-neutral-200/50 overflow-hidden py-1.5'
                            )}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {actions.map(({ label, Icon, onClick, danger }) => (
                                <button
                                    key={label}
                                    type="button"
                                    role="menuitem"
                                    onClick={(e) => { e.stopPropagation(); onClick(); }}
                                    className={cn(
                                        'w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors font-bold',
                                        'outline-none focus-visible:bg-neutral-50',
                                        danger
                                            ? 'text-red-600 hover:bg-red-50'
                                            : 'text-neutral-700 hover:bg-neutral-50'
                                    )}
                                    style={{ fontSize: 12 }}
                                >
                                    <Icon style={{ width: 13, height: 13, strokeWidth: 2 }} />
                                    {label}
                                </button>
                            ))}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── Card Component ─────────────────────────────────────────────────────────────

function PipelineCardInner({ application: app, index, isSelected, onToggleSelection, onDelete, onView, onEdit }: PipelineCardProps) {
    const shouldReduceMotion = useReducedMotion();

    const handleClick = useCallback(() => {
        if (onView) onView(app.id);
    }, [onView, app.id]);

    const urgency = classifyUrgency(app);
    const showFollowUp = urgency !== 'normal' && Boolean(app.nextFollowUp);
    const attachmentCount = app.attachments?.length ?? 0;

    const hoverAnimation = shouldReduceMotion
        ? {}
        : { y: -2, boxShadow: '0 12px 32px -8px rgba(0,0,0,0.12)' };

    return (
        <Draggable draggableId={app.id} index={index}>
            {(provided, snapshot) => (
                <motion.div
                    ref={provided.innerRef}
                    {...(provided.draggableProps as object)}
                    whileHover={snapshot.isDragging ? {} : hoverAnimation}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    onClick={handleClick}
                    role="button"
                    tabIndex={0}
                    className={cn(
                        'group relative bg-white rounded-2xl overflow-hidden select-none outline-none transition-all duration-300',
                        'border focus-visible:ring-2 focus-visible:ring-blue-400',
                        snapshot.isDragging
                            ? 'border-blue-500 ring-1 ring-blue-500 shadow-2xl scale-[1.02] rotate-[1deg] cursor-grabbing z-50'
                            : isSelected
                                ? 'border-blue-500 shadow-lg shadow-blue-100 ring-1 ring-blue-500'
                                : 'border-neutral-100/80 shadow-sm cursor-pointer hover:border-neutral-200'
                    )}
                    style={provided.draggableProps.style}
                >
                    {/* Status accent bar (left edge) */}
                    <div className={cn('absolute left-0 top-0 bottom-0 w-1 opacity-80', STATUS_ACCENT[app.status])} />

                    {/* Selection Overlay (optional for Kanban, but keeping for sync) */}
                    {onToggleSelection && (
                        <div
                            className={cn(
                                'absolute left-4 top-4 z-10 transition-opacity duration-200',
                                isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                            )}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => onToggleSelection(app.id)}
                                className="w-4 h-4 rounded-md border-neutral-300 text-neutral-900 focus:ring-neutral-900 cursor-pointer shadow-sm"
                            />
                        </div>
                    )}

                    {/* Card body */}
                    <div className="pl-5 pr-4 pt-4 pb-3">

                        {/* Row 1: drag handle + company + actions */}
                        <div className="flex items-start gap-2 mb-1">
                            <div
                                {...provided.dragHandleProps}
                                className="mt-1 shrink-0 text-neutral-200 hover:text-neutral-400 transition-colors cursor-grab active:cursor-grabbing"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <GripVertical style={{ width: 12, height: 12 }} />
                            </div>

                            <p
                                className="flex-1 font-bold text-neutral-900 leading-tight truncate"
                                style={{ fontSize: 13.5 }}
                                title={app.company}
                            >
                                {app.company}
                            </p>

                            <QuickActions appId={app.id} onDelete={onDelete} onView={onView} onEdit={onEdit} />
                        </div>

                        {/* Row 2: Role title */}
                        <p
                            className="text-neutral-500 font-medium leading-snug line-clamp-1 mt-0.5 mb-3"
                            style={{ fontSize: 12.5, paddingLeft: 18 }}
                        >
                            {app.roleTitle}
                        </p>

                        {/* Row 3: Badges */}
                        <div className="flex items-center gap-1.5 flex-wrap mb-3" style={{ paddingLeft: 18 }}>
                            <IntentBadge intent={app.recordIntent || 'application'} />
                            {app.source && (
                                <span className="inline-flex items-center h-4.5 px-2 rounded-lg bg-neutral-100 text-neutral-500 font-bold uppercase tracking-wider ring-1 ring-inset ring-neutral-200" style={{ fontSize: 9 }}>
                                    {app.source}
                                </span>
                            )}
                        </div>

                        {/* Footer: Freshness + Attachments */}
                        <div className="flex items-center justify-between gap-2 border-t border-dashed border-neutral-100 pt-2.5 mt-1" style={{ paddingLeft: 18 }}>
                            <div className="flex items-center gap-1.5">
                                {showFollowUp && <FollowUpPill urgency={urgency as any} />}
                                {attachmentCount > 0 && (
                                    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-neutral-400 bg-neutral-50 px-1.5 py-0.5 rounded-md ring-1 ring-neutral-100">
                                        <Paperclip style={{ width: 10, height: 10, strokeWidth: 2.5 }} />
                                        {attachmentCount}
                                    </span>
                                )}
                            </div>

                            <span className="text-neutral-300 font-medium uppercase tracking-tighter" style={{ fontSize: 9.5 }}>
                                {formatRelativeDate(app.updatedAt)}
                            </span>
                        </div>
                    </div>
                </motion.div>
            )}
        </Draggable>
    );
}

// ─── Memo ───────────────────────────────────────────────────────────────────────

export const PipelineCard = memo(PipelineCardInner, (prev, next) => {
    return (
        prev.application.id === next.application.id &&
        prev.application.status === next.application.status &&
        prev.application.company === next.application.company &&
        prev.application.roleTitle === next.application.roleTitle &&
        prev.application.location === next.application.location &&
        prev.application.nextFollowUp === next.application.nextFollowUp &&
        prev.application.actionDate === next.application.actionDate &&
        prev.application.updatedAt === next.application.updatedAt &&
        prev.application.replyReceived === next.application.replyReceived &&
        prev.application.attachments?.length === next.application.attachments?.length &&
        prev.isSelected === next.isSelected &&
        prev.index === next.index
    );
});

PipelineCard.displayName = 'PipelineCard';
