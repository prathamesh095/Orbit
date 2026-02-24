'use client';

import { memo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, formatRelativeDate, classifyUrgency } from '@/lib/utils';
import type { Application, ApplicationStatus, UrgencyLevel, Attachment } from '@/types';
import {
    Building2, MapPin, CalendarClock, Clock,
    ChevronLeft, ChevronRight, Briefcase,
    MoreHorizontal, Eye, Pencil, Trash2, Plus,
    Paperclip, ChevronDown, CheckCircle2,
} from 'lucide-react';
import { IntentBadge } from '@/components/ui/IntentBadge';
import { StatusPill } from '@/components/ui/StatusPill';

// ─── Shared config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<ApplicationStatus, { label: string; dot: string; pill: string }> = {
    draft: { label: 'Draft', dot: 'bg-neutral-400', pill: 'bg-neutral-100 text-neutral-600 ring-neutral-200' },
    applied: { label: 'Applied', dot: 'bg-blue-500', pill: 'bg-blue-50 text-blue-700 ring-blue-200' },
    interviewing: { label: 'Interviewing', dot: 'bg-amber-500', pill: 'bg-amber-50 text-amber-700 ring-amber-200' },
    offer: { label: 'Offer', dot: 'bg-emerald-500', pill: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
    rejected: { label: 'Rejected', dot: 'bg-red-400', pill: 'bg-red-50 text-red-600 ring-red-200' },
};
const ALL_STATUSES: ApplicationStatus[] = ['draft', 'applied', 'interviewing', 'offer', 'rejected'];

const STATUS_ACCENT: Record<ApplicationStatus, string> = {
    draft: 'bg-neutral-200',
    applied: 'bg-blue-400',
    interviewing: 'bg-amber-400',
    offer: 'bg-emerald-500',
    rejected: 'bg-red-400',
};

const URGENCY_PAD: Record<UrgencyLevel, string> = {
    critical: 'text-amber-700 bg-amber-50 ring-1 ring-amber-200',
    overdue: 'text-red-600 bg-red-50 ring-1 ring-red-200',
    due_today: 'text-blue-600 bg-blue-50 ring-1 ring-blue-200',
    normal: 'text-neutral-400',
};

const AVATAR_PALETTES = [
    'bg-blue-100 text-blue-700', 'bg-violet-100 text-violet-700',
    'bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-700',
    'bg-rose-100 text-rose-700', 'bg-cyan-100 text-cyan-700',
];
function avatarPalette(s: string) {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = s.charCodeAt(i) + ((h << 5) - h);
    return AVATAR_PALETTES[Math.abs(h) % AVATAR_PALETTES.length];
}
function getInitials(s: string) {
    return s.split(/\s+/).slice(0, 2).map((w) => w[0] ?? '').join('').toUpperCase();
}
function getTimelineText(app: Application): string {
    if (app.status === 'interviewing') return `Interview · ${formatRelativeDate(app.actionDate)}`;
    if (app.status === 'offer') return `Offer · ${formatRelativeDate(app.actionDate)}`;
    if (app.status === 'rejected') return `Rejected · ${formatRelativeDate(app.actionDate)}`;
    if (app.status === 'applied') return `Applied · ${formatRelativeDate(app.actionDate)}`;
    return `Drafted · ${formatRelativeDate(app.actionDate)}`;
}

// ─── Inline Status Picker ──────────────────────────────────────────────────────

function QuickStatusPicker({ current, onSelect }: {
    current: ApplicationStatus;
    onSelect: (s: ApplicationStatus) => void;
}) {
    const [open, setOpen] = useState(false);
    const cfg = STATUS_CONFIG[current];
    return (
        <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
                className={cn(
                    'inline-flex items-center gap-1.5 px-2 h-5.5 rounded-full text-[10px] font-bold uppercase tracking-wider ring-1 transition-all cursor-pointer outline-none shadow-sm',
                    cfg.pill
                )}
            >
                <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', cfg.dot)} />
                {cfg.label}
                <ChevronDown className="w-2.5 h-2.5 ml-0.5 opacity-60" />
            </button>
            <AnimatePresence>
                {open && (
                    <>
                        <div className="fixed inset-0 z-50" onClick={(e) => { e.stopPropagation(); setOpen(false); }} />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -4 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -4 }}
                            transition={{ duration: 0.1 }}
                            className="absolute left-0 top-8 z-50 w-40 bg-white rounded-xl border border-neutral-100 shadow-xl py-1.5 overflow-hidden"
                        >
                            {ALL_STATUSES.map((s) => {
                                const c = STATUS_CONFIG[s];
                                return (
                                    <button
                                        key={s} type="button"
                                        onClick={(e) => { e.stopPropagation(); onSelect(s); setOpen(false); }}
                                        className={cn(
                                            'w-full flex items-center gap-2.5 px-3 py-2 text-[12px] text-left transition-colors',
                                            'outline-none hover:bg-neutral-50',
                                            s === current ? 'font-bold text-neutral-900 bg-neutral-50/50' : 'text-neutral-600 font-medium'
                                        )}
                                    >
                                        <span className={cn('w-2 h-2 rounded-full shrink-0', c.dot)} />
                                        {c.label}
                                        {s === current && <CheckCircle2 className="w-3.5 h-3.5 ml-auto text-blue-600" />}
                                    </button>
                                );
                            })}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── Card actions menu ─────────────────────────────────────────────────────────

interface CardMenuProps {
    appId: string;
    onDelete: (id: string) => void;
    onView: (id: string) => void;
    onEdit: (id: string) => void;
}

function CardMenu({ appId, onDelete, onView, onEdit }: CardMenuProps) {
    const [open, setOpen] = useState(false);

    const items = [
        { label: 'View details', Icon: Eye, action: () => { onView(appId); setOpen(false); } },
        { label: 'Edit Entry', Icon: Pencil, action: () => { onEdit(appId); setOpen(false); } },
        { label: 'Delete Entry', Icon: Trash2, action: () => { onDelete(appId); setOpen(false); }, danger: true },
    ];

    return (
        <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
                type="button"
                aria-label="Card actions"
                aria-haspopup="menu"
                aria-expanded={open}
                onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
                className={cn(
                    'w-8 h-8 flex items-center justify-center rounded-xl transition-all duration-200',
                    'text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700',
                    'outline-none focus-visible:ring-2 focus-visible:ring-blue-400',
                    open ? 'bg-neutral-900 text-white shadow-md' : 'opacity-0 group-hover:opacity-100'
                )}
            >
                <MoreHorizontal style={{ width: 14, height: 14, strokeWidth: 2.5 }} />
            </button>
            <AnimatePresence>
                {open && (
                    <>
                        <div className="fixed inset-0 z-20" onClick={(e) => { e.stopPropagation(); setOpen(false); }} />
                        <motion.div
                            role="menu"
                            initial={{ opacity: 0, scale: 0.98, y: -4 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.98, y: -4 }}
                            transition={{ duration: 0.1 }}
                            className="absolute right-0 top-10 z-30 w-48 bg-white rounded-xl border border-neutral-100 shadow-xl shadow-neutral-200/50 py-1.5 overflow-hidden"
                        >
                            {items.map(({ label, Icon, action, danger }) => (
                                <button
                                    key={label}
                                    role="menuitem"
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); action(); }}
                                    className={cn(
                                        'w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-left transition-colors font-medium',
                                        'outline-none focus-visible:bg-neutral-50',
                                        danger ? 'text-red-600 hover:bg-red-50' : 'text-neutral-700 hover:bg-neutral-50'
                                    )}
                                >
                                    <Icon style={{ width: 14, height: 14, strokeWidth: 2 }} /> {label}
                                </button>
                            ))}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── Grid Card ─────────────────────────────────────────────────────────────────

interface GridCardProps {
    app: Application;
    index: number;
    isSelected: boolean;
    onToggleSelection: (id: string) => void;
    onDelete: (id: string) => void;
    onView: (id: string) => void;
    onEdit: (id: string) => void;
    onStatusChange: (id: string, s: ApplicationStatus) => void;
}

const GridCard = memo(function GridCard({
    app, index, isSelected, onToggleSelection, onDelete, onView, onEdit, onStatusChange
}: GridCardProps) {
    const palette = avatarPalette(app.company);
    const initials = getInitials(app.company);
    const timeline = getTimelineText(app);
    const urgency = classifyUrgency(app);
    const attachmentCount = app.attachments?.length ?? 0;

    const handleClick = useCallback(() => onView(app.id), [onView, app.id]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: Math.min(index * 0.04, 0.4) }}
            whileHover={{ y: -4, scale: 1.01, boxShadow: '0 20px 40px -12px rgba(0,0,0,0.12)' }}
            onClick={handleClick}
            onKeyDown={(e) => { if (e.key === 'Enter') handleClick(); }}
            tabIndex={0}
            role="button"
            className={cn(
                'group relative bg-white rounded-3xl border transition-all duration-300',
                'cursor-pointer flex flex-col overflow-hidden min-h-[200px]',
                isSelected
                    ? 'border-blue-500 ring-1 ring-blue-500 shadow-lg shadow-blue-500/10'
                    : 'border-neutral-100 shadow-sm hover:border-neutral-200',
                'outline-none focus-visible:ring-2 focus-visible:ring-blue-400'
            )}
        >
            {/* Selection Overlay */}
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
                    className="w-5 h-5 rounded-lg border-neutral-300 text-neutral-900 focus:ring-neutral-900 cursor-pointer shadow-sm transition-all"
                />
            </div>

            {/* Status accent bar (top edge) */}
            <div className={cn('h-1 w-full shrink-0 opacity-80', STATUS_ACCENT[app.status])} />

            {/* Card body */}
            <div className="p-5 flex flex-col flex-1">
                {/* Top row: avatar + company + actions */}
                <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3.5 min-w-0">
                        <div
                            className={cn('w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 font-bold select-none shadow-sm transition-transform group-hover:scale-105', palette)}
                            style={{ fontSize: 13 }}
                        >
                            {initials || <Building2 style={{ width: 16, height: 16 }} />}
                        </div>
                        <div className="min-w-0">
                            <p className="font-bold text-neutral-900 truncate leading-tight mb-1" style={{ fontSize: 15 }} title={app.roleTitle}>
                                {app.roleTitle}
                            </p>
                            <p className="text-neutral-500 font-medium truncate leading-tight" style={{ fontSize: 12.5 }} title={app.company}>
                                {app.company}
                            </p>
                        </div>
                    </div>
                    <CardMenu appId={app.id} onDelete={onDelete} onView={onView} onEdit={onEdit} />
                </div>

                {/* Badges Row */}
                <div className="flex items-center gap-2 flex-wrap mb-4">
                    <IntentBadge intent={app.recordIntent || 'application'} />
                    {app.source && (
                        <span className="inline-flex items-center h-5 px-2 rounded-lg text-[10px] font-bold uppercase tracking-wide bg-neutral-100 text-neutral-500 ring-1 ring-inset ring-neutral-200 shadow-sm">
                            {app.source}
                        </span>
                    )}
                </div>

                {/* Location */}
                {app.location && (
                    <div className="flex items-center gap-1.5 text-neutral-400 mb-4" style={{ fontSize: 11.5 }}>
                        <MapPin style={{ width: 12, height: 12, strokeWidth: 2 }} />
                        <span className="truncate font-medium">{app.location}</span>
                    </div>
                )}

                {/* Content Separator */}
                <div className="mt-auto pt-4 border-t border-dashed border-neutral-100">
                    {/* Status & Timeline */}
                    <div className="flex items-center justify-between gap-3 mb-3">
                        <QuickStatusPicker current={app.status} onSelect={(s) => onStatusChange(app.id, s)} />
                        <span className="flex items-center gap-1.5 text-neutral-400 font-medium" style={{ fontSize: 11 }}>
                            <CalendarClock style={{ width: 12, height: 12, strokeWidth: 2 }} />
                            {timeline}
                        </span>
                    </div>

                    {/* Metadata: urgency + attachments */}
                    <div className="flex items-center justify-between gap-2 h-6">
                        {urgency !== 'normal' && app.nextFollowUp && (
                            <div className={cn(
                                'inline-flex items-center gap-1.5 px-2 h-6 rounded-lg text-[10px] font-bold shadow-sm',
                                URGENCY_PAD[urgency]
                            )}>
                                <Clock style={{ width: 10, height: 10, strokeWidth: 2.5 }} />
                                {urgency === 'critical' ? 'Urgent Today' : urgency === 'overdue' ? 'Overdue' : 'Follow-up Today'}
                            </div>
                        )}
                        {urgency === 'normal' && app.nextFollowUp && (
                            <div className="flex items-center gap-1.5 text-neutral-400 font-medium" style={{ fontSize: 11 }}>
                                <Clock style={{ width: 12, height: 12, strokeWidth: 2 }} />
                                <span>{app.nextFollowUp}</span>
                            </div>
                        )}

                        <div className="ml-auto flex items-center gap-2.5">
                            {attachmentCount > 0 && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-neutral-400 bg-neutral-50 px-1.5 py-0.5 rounded-md ring-1 ring-neutral-100">
                                    <Paperclip style={{ width: 11, height: 11, strokeWidth: 2.5 }} />
                                    {attachmentCount}
                                </span>
                            )}
                            <p className="text-[10px] text-neutral-300 font-medium uppercase tracking-tighter">
                                Updated {formatRelativeDate(app.updatedAt)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}, (prev, next) =>
    prev.app.id === next.app.id &&
    prev.app.status === next.app.status &&
    prev.app.company === next.app.company &&
    prev.app.roleTitle === next.app.roleTitle &&
    prev.app.nextFollowUp === next.app.nextFollowUp &&
    prev.app.actionDate === next.app.actionDate &&
    prev.app.updatedAt === next.app.updatedAt &&
    prev.app.attachments?.length === next.app.attachments?.length &&
    prev.isSelected === next.isSelected &&
    prev.index === next.index
);

// ─── GridView ──────────────────────────────────────────────────────────────────

const PAGE_SIZES = [12, 24, 48] as const;
type GridPageSize = typeof PAGE_SIZES[number];

interface GridViewProps {
    apps: Application[];
    isFiltered: boolean;
    onClear: () => void;
    onDelete: (id: string) => void;
    onView: (id: string) => void;
    onEdit: (id: string) => void;
    onStatusChange: (id: string, s: ApplicationStatus) => void;
    onCreate: () => void;
    selectedIds: Set<string>;
    toggleSelection: (id: string) => void;
}

export function GridView({
    apps, isFiltered, onClear, onDelete, onView, onEdit, onStatusChange, onCreate,
    selectedIds, toggleSelection
}: GridViewProps) {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState<GridPageSize>(12);

    const totalPages = Math.max(1, Math.ceil(apps.length / pageSize));
    const safePage = Math.min(page, totalPages);
    const paginated = apps.slice((safePage - 1) * pageSize, safePage * pageSize);
    const rangeStart = apps.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
    const rangeEnd = Math.min(safePage * pageSize, apps.length);

    if (apps.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-32 text-center bg-neutral-50/50 rounded-3xl border border-dashed border-neutral-200">
                <div className="w-16 h-16 rounded-3xl bg-white border border-neutral-100 flex items-center justify-center mb-5 shadow-sm">
                    <Briefcase className="text-neutral-300" style={{ width: 28, height: 28, strokeWidth: 1.5 }} />
                </div>
                <h3 className="font-bold text-neutral-900 mb-2" style={{ fontSize: 17 }}>
                    {isFiltered ? 'No matching results' : 'Build your pipeline'}
                </h3>
                <p className="text-neutral-400 max-w-sm px-6 font-medium" style={{ fontSize: 14, lineHeight: 1.6 }}>
                    {isFiltered
                        ? 'We couldn’t find any applications matching your current filters. Try resetting them to see more.'
                        : 'Track your job hunt progress by adding your first application. Every card starts a new opportunity.'}
                </p>
                <div className="mt-8 flex items-center gap-3">
                    {isFiltered ? (
                        <button onClick={onClear} className="inline-flex items-center h-10 px-6 rounded-xl text-[14px] font-bold border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 transition-all shadow-sm active:scale-95">
                            Clear all filters
                        </button>
                    ) : (
                        <button onClick={onCreate} className="inline-flex items-center gap-2 h-10 px-6 rounded-xl text-[14px] font-bold bg-neutral-900 text-white hover:bg-neutral-800 transition-all shadow-lg shadow-neutral-200 active:scale-95">
                            <Plus style={{ width: 14, height: 14, strokeWidth: 3 }} /> New Application
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto custom-scrollbar px-1 pb-24">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-1">
                    <AnimatePresence mode="popLayout">
                        {paginated.map((app, i) => (
                            <GridCard
                                key={app.id}
                                app={app}
                                index={i}
                                isSelected={selectedIds.has(app.id)}
                                onToggleSelection={toggleSelection}
                                onDelete={onDelete}
                                onView={onView}
                                onEdit={onEdit}
                                onStatusChange={onStatusChange}
                            />
                        ))}
                    </AnimatePresence>
                </div>
            </div>

            {/* Pagination footer */}
            <footer className="flex items-center justify-between gap-4 px-6 h-14 border-t border-neutral-100 bg-white/80 backdrop-blur shrink-0 mt-auto rounded-b-2xl">
                <div className="flex items-center gap-5">
                    <span className="text-[13px] text-neutral-400 font-medium whitespace-nowrap">
                        {rangeStart}–{rangeEnd} of {apps.length} records
                    </span>
                    <div className="h-4 w-px bg-neutral-200 hidden sm:block" />
                    <div className="hidden sm:flex items-center gap-2.5">
                        <span className="text-[13px] text-neutral-400 font-medium">Show</span>
                        <select
                            value={pageSize}
                            onChange={(e) => { setPageSize(Number(e.target.value) as GridPageSize); setPage(1); }}
                            className="h-8 px-2 pr-7 rounded-xl border border-neutral-200 bg-white text-[13px] font-bold text-neutral-700 outline-none appearance-none cursor-pointer hover:border-neutral-300 transition-colors shadow-sm"
                            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23a1a1aa' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}
                        >
                            {PAGE_SIZES.map((n) => <option key={n} value={n}>{n} cards</option>)}
                        </select>
                    </div>
                </div>

                <div className="flex items-center gap-1.5">
                    <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage <= 1}
                        className="w-9 h-9 flex items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm active:scale-90"
                    >
                        <ChevronLeft style={{ width: 16, height: 16, strokeWidth: 2.5 }} />
                    </button>
                    <div className="flex items-center gap-1 px-1">
                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                            const pg = totalPages <= 5 ? i + 1 : safePage <= 3 ? i + 1 : safePage >= totalPages - 2 ? totalPages - 4 + i : safePage - 2 + i;
                            return (
                                <button
                                    key={pg} type="button" onClick={() => setPage(pg)}
                                    className={cn('min-w-[36px] h-9 flex items-center justify-center rounded-xl text-[13px] font-bold transition-all active:scale-90',
                                        safePage === pg ? 'bg-neutral-900 text-white shadow-md' : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900')}
                                >
                                    {pg}
                                </button>
                            );
                        })}
                    </div>
                    <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage >= totalPages}
                        className="w-9 h-9 flex items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm active:scale-90"
                    >
                        <ChevronRight style={{ width: 16, height: 16, strokeWidth: 2.5 }} />
                    </button>
                </div>
            </footer>
        </div>
    );
}
