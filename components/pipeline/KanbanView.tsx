'use client';

import { useCallback, useRef, useState, useEffect } from 'react';
import { DragDropContext, type DropResult } from '@hello-pangea/dnd';
import { motion, AnimatePresence } from 'framer-motion';
import { PipelineColumn } from '@/components/kanban/PipelineColumn';
import { cn } from '@/lib/utils';
import type { Application, ApplicationStatus } from '@/types';
import { ChevronLeft, ChevronRight, Briefcase, Plus } from 'lucide-react';

// ─── Column Definitions ────────────────────────────────────────────────────────

interface ColumnDef {
    id: ApplicationStatus;
    title: string;
    accentClass: string;
    dotClass: string;
    bgClass: string;
}

const COLUMNS: ColumnDef[] = [
    { id: 'draft', title: 'Draft', accentClass: 'text-neutral-600', dotClass: 'bg-neutral-400', bgClass: 'bg-neutral-50' },
    { id: 'applied', title: 'Applied', accentClass: 'text-blue-700', dotClass: 'bg-blue-400', bgClass: 'bg-blue-50/40' },
    { id: 'interviewing', title: 'Interviewing', accentClass: 'text-amber-700', dotClass: 'bg-amber-400', bgClass: 'bg-amber-50/40' },
    { id: 'offer', title: 'Offer', accentClass: 'text-emerald-700', dotClass: 'bg-emerald-500', bgClass: 'bg-emerald-50/40' },
    { id: 'rejected', title: 'Rejected', accentClass: 'text-red-600', dotClass: 'bg-red-400', bgClass: 'bg-red-50/30' },
];

// ─── Board Skeleton ────────────────────────────────────────────────────────────

function BoardSkeleton() {
    return (
        <div className="flex gap-5 overflow-hidden" style={{ paddingLeft: 4 }}>
            {COLUMNS.map((col) => (
                <div
                    key={col.id}
                    className="rounded-[14px] bg-neutral-50 border border-neutral-100 animate-pulse shrink-0"
                    style={{ width: 300, height: 420, padding: 12 }}
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className={cn('w-2 h-2 rounded-full', col.dotClass, 'opacity-30')} />
                        <div className="h-3.5 rounded bg-neutral-200 flex-1 mx-2" />
                        <div className="h-5 w-6 rounded-full bg-neutral-200" />
                    </div>
                    {[1, 2, 3].map((j) => (
                        <div key={j} className="h-28 bg-neutral-100 rounded-xl mb-3" />
                    ))}
                </div>
            ))}
        </div>
    );
}

// ─── KanbanView ────────────────────────────────────────────────────────────────

interface KanbanViewProps {
    apps: Application[];
    isFiltered: boolean;
    selectedIds: Set<string>;
    toggleSelection: (id: string) => void;
    onStatusChange: (id: string, newStatus: ApplicationStatus) => void;
    onDelete: (id: string) => void;
    onView: (id: string) => void;
    onEdit: (id: string) => void;
    onCreate: () => void;
    isLoading?: boolean;
}

export function KanbanView({
    apps, isFiltered, selectedIds, toggleSelection,
    onStatusChange, onDelete, onView, onEdit, onCreate, isLoading
}: KanbanViewProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const byStatus = COLUMNS.reduce<Record<ApplicationStatus, Application[]>>(
        (acc, col) => ({ ...acc, [col.id]: apps.filter((a) => a.status === col.id) }),
        {} as Record<ApplicationStatus, Application[]>
    );

    const totalApps = apps.length;

    const handleDragEnd = useCallback((result: DropResult) => {
        if (!result.destination) return;
        const { draggableId, destination } = result;
        const newStatus = destination.droppableId as ApplicationStatus;
        const app = apps.find((a) => a.id === draggableId);
        if (app && app.status !== newStatus) {
            onStatusChange(draggableId, newStatus);
        }
    }, [apps, onStatusChange]);

    const checkScroll = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        setCanScrollLeft(el.scrollLeft > 10);
        setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
    }, []);

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        checkScroll();
        el.addEventListener('scroll', checkScroll, { passive: true });
        const ro = new ResizeObserver(checkScroll);
        ro.observe(el);
        return () => { el.removeEventListener('scroll', checkScroll); ro.disconnect(); };
    }, [checkScroll]);

    const scroll = (dir: 'left' | 'right') => {
        scrollRef.current?.scrollBy({ left: dir === 'right' ? 320 : -320, behavior: 'smooth' });
    };

    if (isLoading) return <BoardSkeleton />;

    if (apps.length === 0 && !isFiltered) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-14 h-14 rounded-2xl bg-neutral-100 flex items-center justify-center mb-4">
                    <Briefcase className="text-neutral-400" style={{ width: 24, height: 24, strokeWidth: 1.5 }} />
                </div>
                <h3 className="font-semibold text-neutral-800 mb-1" style={{ fontSize: 15 }}>Your pipeline is empty</h3>
                <p className="text-neutral-400 max-w-xs" style={{ fontSize: 13 }}>Add your first job application to see the board.</p>
                <button
                    onClick={onCreate}
                    className="mt-5 inline-flex items-center gap-1.5 h-9 px-4 rounded-xl text-[13px] font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                    <Plus style={{ width: 13, height: 13, strokeWidth: 2.5 }} /> New Entry
                </button>
            </div>
        );
    }

    return (
        <div className="relative">
            {/* Left scroll nav */}
            <AnimatePresence>
                {canScrollLeft && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute left-0 top-0 bottom-0 z-10 flex items-center pointer-events-none"
                        style={{ background: 'linear-gradient(to right, rgba(249,249,249,0.9) 0%, transparent 100%)', width: 48 }}
                    >
                        <button
                            type="button" onClick={() => scroll('left')} aria-label="Scroll left"
                            className="pointer-events-auto ml-1 w-7 h-7 flex items-center justify-center rounded-lg bg-white border border-neutral-200 text-neutral-500 hover:bg-neutral-50 shadow-sm transition-colors"
                        >
                            <ChevronLeft style={{ width: 14, height: 14 }} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Right scroll nav */}
            <AnimatePresence>
                {canScrollRight && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute right-0 top-0 bottom-0 z-10 flex items-center justify-end pointer-events-none"
                        style={{ background: 'linear-gradient(to left, rgba(249,249,249,0.9) 0%, transparent 100%)', width: 48 }}
                    >
                        <button
                            type="button" onClick={() => scroll('right')} aria-label="Scroll right"
                            className="pointer-events-auto mr-1 w-7 h-7 flex items-center justify-center rounded-lg bg-white border border-neutral-200 text-neutral-500 hover:bg-neutral-50 shadow-sm transition-colors"
                        >
                            <ChevronRight style={{ width: 14, height: 14 }} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Board scroll area */}
            <div
                ref={scrollRef}
                className="overflow-x-auto pb-3"
                style={{
                    scrollSnapType: 'x mandatory',
                    WebkitOverflowScrolling: 'touch',
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#e5e7eb transparent',
                }}
            >
                <DragDropContext onDragEnd={handleDragEnd}>
                    <div className="flex gap-4" style={{ paddingLeft: 4, paddingRight: 4, minWidth: 'max-content' }}>
                        {COLUMNS.map((col) => (
                            <div key={col.id} style={{ scrollSnapAlign: 'start', width: 300 }}>
                                <PipelineColumn
                                    id={col.id}
                                    title={col.title}
                                    applications={byStatus[col.id]}
                                    totalApplications={totalApps}
                                    accentClass={col.accentClass}
                                    dotClass={col.dotClass}
                                    bgClass={col.bgClass}
                                    selectedIds={selectedIds}
                                    toggleSelection={toggleSelection}
                                    onDeleteCard={onDelete}
                                    onView={onView}
                                    onEdit={onEdit}
                                />
                            </div>
                        ))}
                    </div>
                </DragDropContext>
            </div>
        </div>
    );
}
