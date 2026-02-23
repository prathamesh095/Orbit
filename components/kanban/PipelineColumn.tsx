'use client';

import { memo } from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { motion } from 'framer-motion';
import { PipelineCard } from './PipelineCard';
import { cn } from '@/lib/utils';
import type { Application, ApplicationStatus } from '@/types';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface PipelineColumnProps {
    id: ApplicationStatus;
    title: string;
    accentClass: string;
    dotClass: string;
    bgClass: string;
    applications: Application[];
    totalApplications: number;
    onDeleteCard?: (id: string) => void;
    onView?: (id: string) => void;
    onEdit?: (id: string) => void;
}

// ─── Empty State ───────────────────────────────────────────────────────────────

const EMPTY_STATE_MESSAGES: Record<ApplicationStatus, { headline: string; sub: string }> = {
    draft: { headline: 'Start drafting', sub: 'Add an application to get started' },
    applied: { headline: 'Nothing applied', sub: 'Move a draft here once submitted' },
    interviewing: { headline: 'No interviews yet', sub: 'Move applied cards here when invited' },
    offer: { headline: 'No offers yet', sub: 'Keep going — offers come with prep' },
    rejected: { headline: 'None rejected', sub: 'This is the column to keep empty' },
};

function ColumnEmptyState({ status }: { status: ApplicationStatus }) {
    const msg = EMPTY_STATE_MESSAGES[status];
    return (
        <div className="flex flex-col items-center justify-center py-8 px-3 text-center min-h-[100px]">
            <span className="mb-2 select-none" style={{ fontSize: 22, opacity: 0.18 }} role="img" aria-hidden="true">
                {status === 'rejected' ? '🎯' : status === 'offer' ? '🏆' : '📋'}
            </span>
            <p className="font-medium text-neutral-400" style={{ fontSize: 12 }}>{msg.headline}</p>
            <p className="text-neutral-300 mt-0.5" style={{ fontSize: 11, lineHeight: 1.4 }}>{msg.sub}</p>
        </div>
    );
}

// ─── Progress bar ──────────────────────────────────────────────────────────────

function ColumnProgress({ count, total, fillClass }: { count: number; total: number; fillClass: string }) {
    const pct = total === 0 ? 0 : Math.round((count / total) * 100);
    return (
        <div className="h-0.5 w-full bg-neutral-200/60 rounded-full overflow-hidden mt-2 mb-3">
            <motion.div
                className={cn('h-full rounded-full', fillClass)}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
            />
        </div>
    );
}

// ─── Column ────────────────────────────────────────────────────────────────────

function PipelineColumnInner({
    id, title, accentClass, dotClass, bgClass,
    applications, totalApplications,
    onDeleteCard, onView, onEdit,
}: PipelineColumnProps) {
    return (
        <div
            className={cn('flex flex-col rounded-[14px] border border-neutral-100/80', bgClass)}
            style={{ width: 300, minWidth: 300, maxWidth: 300, padding: 12 }}
            role="region"
            aria-label={`${title} column, ${applications.length} items`}
        >
            {/* Column Header */}
            <div className="sticky top-0 z-10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                        <span className={cn('w-2 h-2 rounded-full shrink-0', dotClass)} />
                        <span
                            className={cn('font-semibold truncate', accentClass)}
                            style={{ fontSize: 13, letterSpacing: '0.01em' }}
                            title={title}
                        >
                            {title}
                        </span>
                    </div>
                    <span
                        className="inline-flex items-center justify-center rounded-full bg-white/80 border border-neutral-200/60 text-neutral-500 font-semibold tabular-nums shrink-0"
                        style={{ fontSize: 11, height: 20, minWidth: 24, paddingLeft: 6, paddingRight: 6 }}
                        aria-label={`${applications.length} items`}
                    >
                        {applications.length}
                    </span>
                </div>
                <ColumnProgress count={applications.length} total={totalApplications} fillClass={dotClass} />
            </div>

            {/* Drop zone / Card stack */}
            <Droppable droppableId={id} type="CARD">
                {(provided, snapshot) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={cn(
                            'flex-1 flex flex-col gap-3 overflow-y-auto overflow-x-hidden rounded-xl',
                            'transition-colors duration-200 min-h-[100px] px-0.5',
                            snapshot.isDraggingOver ? 'bg-blue-50/70 ring-2 ring-blue-200/50 ring-inset' : ''
                        )}
                        style={{ scrollbarWidth: 'thin', scrollbarColor: '#d1d5db transparent', paddingBottom: 4 }}
                        aria-dropeffect="move"
                    >
                        {applications.length === 0 ? (
                            <ColumnEmptyState status={id} />
                        ) : (
                            applications.map((app, index) => (
                                <PipelineCard
                                    key={app.id}
                                    application={app}
                                    index={index}
                                    onDelete={onDeleteCard}
                                    onView={onView}
                                    onEdit={onEdit}
                                />
                            ))
                        )}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </div>
    );
}

// ─── Memo ───────────────────────────────────────────────────────────────────────

export const PipelineColumn = memo(PipelineColumnInner, (prev, next) => {
    if (prev.applications.length !== next.applications.length) return false;
    if (prev.id !== next.id || prev.totalApplications !== next.totalApplications) return false;
    for (let i = 0; i < prev.applications.length; i++) {
        const p = prev.applications[i];
        const n = next.applications[i];
        if (
            p.id !== n.id ||
            p.status !== n.status ||
            p.nextFollowUp !== n.nextFollowUp ||
            p.updatedAt !== n.updatedAt ||
            (p.attachments?.length ?? 0) !== (n.attachments?.length ?? 0)
        ) return false;
    }
    return true;
});

PipelineColumn.displayName = 'PipelineColumn';
