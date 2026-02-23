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
    MessageSquare,
    GripVertical,
    Paperclip,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate, formatRelativeDate, classifyUrgency } from '@/lib/utils';
import type { Application, ApplicationStatus } from '@/types';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface PipelineCardProps {
    application: Application;
    index: number;
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

function FollowUpPill({ date, urgency }: { date: string; urgency: 'overdue' | 'critical' | 'due_today' | 'normal' }) {
    if (urgency === 'normal') return null;
    const isRed = urgency === 'overdue' || urgency === 'critical';
    const label = isRed ? 'Overdue' : 'Today';
    const formattedDate = formatDate(date);
    return (
        <span
            className={cn(
                'inline-flex items-center gap-1 px-1.5 rounded-full font-medium select-none shrink-0',
                isRed
                    ? 'bg-red-50 text-red-500 ring-1 ring-red-200'
                    : 'bg-amber-50 text-amber-600 ring-1 ring-amber-200'
            )}
            style={{ fontSize: 10, height: 18, lineHeight: 1 }}
            title={`Follow-up: ${formattedDate}`}
        >
            <Clock style={{ width: 8, height: 8, strokeWidth: 2.5 }} />
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
                    'w-6 h-6 rounded-md flex items-center justify-center shrink-0',
                    'text-neutral-400 outline-none transition-colors duration-100',
                    'focus-visible:ring-2 focus-visible:ring-blue-400',
                    open
                        ? 'bg-neutral-100 text-neutral-600 opacity-100'
                        : 'opacity-0 group-hover:opacity-100 hover:bg-neutral-100 hover:text-neutral-600'
                )}
            >
                <MoreHorizontal style={{ width: 14, height: 14 }} />
            </button>

            <AnimatePresence>
                {open && (
                    <>
                        <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
                        <motion.div
                            role="menu"
                            aria-label="Application actions"
                            initial={{ opacity: 0, scale: 0.95, y: -4 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -4 }}
                            transition={{ duration: 0.12, ease: 'easeOut' }}
                            className={cn(
                                'absolute right-0 top-8 z-30 w-44',
                                'bg-white rounded-xl border border-neutral-100',
                                'shadow-lg shadow-neutral-200/60 overflow-hidden py-1'
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
                                        'w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors duration-100',
                                        'outline-none focus-visible:bg-neutral-50',
                                        danger
                                            ? 'text-red-500 hover:bg-red-50'
                                            : 'text-neutral-700 hover:bg-neutral-50'
                                    )}
                                    style={{ fontSize: 13 }}
                                >
                                    <Icon style={{ width: 13, height: 13, strokeWidth: 1.75 }} />
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

function PipelineCardInner({ application: app, index, onDelete, onView, onEdit }: PipelineCardProps) {
    const shouldReduceMotion = useReducedMotion();

    const handleClick = useCallback(() => {
        if (onView) onView(app.id);
    }, [onView, app.id]);

    const urgency = classifyUrgency(app);
    const showFollowUp = urgency !== 'normal' && Boolean(app.nextFollowUp);
    const hasReply = app.replyReceived === true;
    const attachmentCount = app.attachments?.length ?? 0;

    const hoverAnimation = shouldReduceMotion
        ? {}
        : { y: -2, boxShadow: '0 8px 24px rgba(0,0,0,0.10)' };

    return (
        <Draggable draggableId={app.id} index={index}>
            {(provided, snapshot) => (
                <motion.div
                    ref={provided.innerRef}
                    {...(provided.draggableProps as object)}
                    whileHover={snapshot.isDragging ? {} : hoverAnimation}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    onClick={handleClick}
                    role="button"
                    tabIndex={0}
                    aria-label={`${app.company}, ${app.roleTitle}. Press Enter to open.`}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick(); }
                    }}
                    className={cn(
                        'group relative bg-white rounded-xl overflow-hidden select-none outline-none',
                        'border focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-1',
                        snapshot.isDragging
                            ? 'border-blue-300 shadow-2xl shadow-blue-100/60 rotate-[1.2deg] cursor-grabbing z-50'
                            : 'border-neutral-100/80 shadow-sm cursor-pointer'
                    )}
                    style={provided.draggableProps.style}
                >
                    {/* Status accent bar (left edge) */}
                    <div className={cn('absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl', STATUS_ACCENT[app.status])} />

                    {/* Card body */}
                    <div className="pl-4 pr-3 pt-3 pb-2.5">

                        {/* Row 1: drag handle + company + actions */}
                        <div className="flex items-start gap-1.5 mb-0.5">
                            <div
                                {...provided.dragHandleProps}
                                className="mt-0.5 shrink-0 text-neutral-200 hover:text-neutral-400 transition-colors cursor-grab active:cursor-grabbing"
                                aria-label="Drag to reorder"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <GripVertical style={{ width: 12, height: 12 }} />
                            </div>

                            <p
                                className="flex-1 font-semibold text-neutral-800 leading-tight truncate"
                                style={{ fontSize: 13.5 }}
                                title={app.company}
                            >
                                {app.company}
                            </p>

                            <QuickActions appId={app.id} onDelete={onDelete} onView={onView} onEdit={onEdit} />
                        </div>

                        {/* Row 2: Role title */}
                        <p
                            className="text-neutral-400 leading-snug line-clamp-2 mt-0.5 mb-1.5"
                            style={{ fontSize: 12, paddingLeft: 18 }}
                        >
                            {app.roleTitle}
                            {app.location ? <span className="text-neutral-300"> · {app.location}</span> : null}
                        </p>

                        {/* Row 3: Source chip */}
                        {app.source && (
                            <p className="text-[10px] text-neutral-400 mb-1.5" style={{ paddingLeft: 18 }}>
                                <span className="inline-flex items-center h-4 px-1.5 rounded-full bg-neutral-100 text-neutral-500 ring-1 ring-neutral-200 truncate max-w-[100px]">
                                    {app.source}
                                </span>
                            </p>
                        )}

                        {/* Row 4: badges + date */}
                        <div className="flex items-center gap-1.5 flex-wrap" style={{ paddingLeft: 18 }}>
                            {showFollowUp && (
                                <FollowUpPill
                                    date={app.nextFollowUp!}
                                    urgency={urgency as 'overdue' | 'critical' | 'due_today' | 'normal'}
                                />
                            )}

                            {hasReply && (
                                <span
                                    className="inline-flex items-center gap-1 px-1.5 rounded-full font-medium bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200 select-none"
                                    style={{ fontSize: 10, height: 18, lineHeight: 1 }}
                                >
                                    <MessageSquare style={{ width: 8, height: 8, strokeWidth: 2.5 }} />
                                    Reply
                                </span>
                            )}

                            {attachmentCount > 0 && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] text-neutral-400"
                                    style={{ height: 18, lineHeight: 1 }}>
                                    <Paperclip style={{ width: 8, height: 8 }} />
                                    {attachmentCount}
                                </span>
                            )}

                            <span className="ml-auto text-neutral-300 shrink-0" style={{ fontSize: 11 }}>
                                {formatDate(app.actionDate)}
                            </span>
                        </div>

                        {/* Activity freshness */}
                        <p className="text-[10px] text-neutral-300 mt-1" style={{ paddingLeft: 18 }}>
                            {formatRelativeDate(app.updatedAt)}
                        </p>
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
        prev.index === next.index
    );
});

PipelineCard.displayName = 'PipelineCard';
