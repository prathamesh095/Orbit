'use client';

import { memo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, formatRelativeDate, classifyUrgency } from '@/lib/utils';
import type { Application, ApplicationStatus, UrgencyLevel } from '@/types';
import {
    Building2, MapPin, CalendarClock, Clock,
    ChevronLeft, ChevronRight, Briefcase,
    MoreHorizontal, Eye, Pencil, Trash2,
    Paperclip, ChevronDown, CheckCircle2,
} from 'lucide-react';

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
                    'inline-flex items-center gap-1.5 px-2 h-5 rounded-full text-[10px] font-semibold uppercase tracking-wide ring-1 transition-all cursor-pointer outline-none',
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
                            className="absolute left-0 top-7 z-50 w-40 bg-white rounded-xl border border-neutral-100 shadow-xl py-1 overflow-hidden"
                        >
                            {ALL_STATUSES.map((s) => {
                                const c = STATUS_CONFIG[s];
                                return (
                                    <button
                                        key={s} type="button"
                                        onClick={(e) => { e.stopPropagation(); onSelect(s); setOpen(false); }}
                                        className={cn(
                                            'w-full flex items-center gap-2 px-3 py-1.5 text-[12px] text-left transition-colors',
                                            'outline-none hover:bg-neutral-50',
                                            s === current ? 'font-semibold text-neutral-900' : 'text-neutral-600'
                                        )}
                                    >
                                        <span className={cn('w-2 h-2 rounded-full shrink-0', c.dot)} />
                                        {c.label}
                                        {s === current && <CheckCircle2 className="w-3 h-3 ml-auto text-blue-500" />}
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
        { label: 'Edit', Icon: Pencil, action: () => { onEdit(appId); setOpen(false); } },
        { label: 'Delete', Icon: Trash2, action: () => { onDelete(appId); setOpen(false); }, danger: true },
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
                    'w-7 h-7 flex items-center justify-center rounded-lg transition-colors',
                    'text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600',
                    'outline-none focus-visible:ring-2 focus-visible:ring-blue-400',
                    open ? 'bg-neutral-100 opacity-100' : 'opacity-0 group-hover:opacity-100'
                )}
            >
                <MoreHorizontal style={{ width: 14, height: 14 }} />
            </button>
            <AnimatePresence>
                {open && (
                    <>
                        <div className="fixed inset-0 z-20" onClick={(e) => { e.stopPropagation(); setOpen(false); }} />
                        <motion.div
                            role="menu"
                            initial={{ opacity: 0, scale: 0.95, y: -4 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -4 }}
                            transition={{ duration: 0.1 }}
                            className="absolute right-0 top-9 z-30 w-44 bg-white rounded-xl border border-neutral-100 shadow-lg shadow-neutral-200/60 py-1 overflow-hidden"
                        >
                            {items.map(({ label, Icon, action, danger }) => (
                                <button
                                    key={label}
                                    role="menuitem"
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); action(); }}
                                    className={cn(
                                        'w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-left transition-colors',
                                        'outline-none focus-visible:bg-neutral-50',
                                        danger ? 'text-red-500 hover:bg-red-50' : 'text-neutral-700 hover:bg-neutral-50'
                                    )}
                                >
                                    <Icon style={{ width: 13, height: 13, strokeWidth: 1.75 }} /> {label}
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
    onDelete: (id: string) => void;
    onView: (id: string) => void;
    onEdit: (id: string) => void;
    onStatusChange: (id: string, s: ApplicationStatus) => void;
}

const GridCard = memo(function GridCard({ app, index, onDelete, onView, onEdit, onStatusChange }: GridCardProps) {
    const palette = avatarPalette(app.company);
    const initials = getInitials(app.company);
    const timeline = getTimelineText(app);
    const urgency = classifyUrgency(app);
    const attachmentCount = app.attachments?.length ?? 0;

    const handleClick = useCallback(() => onView(app.id), [onView, app.id]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15, delay: Math.min(index * 0.04, 0.3) }}
            whileHover={{ y: -2, boxShadow: '0 10px 28px rgba(0,0,0,0.09)' }}
            onClick={handleClick}
            onKeyDown={(e) => { if (e.key === 'Enter') handleClick(); }}
            tabIndex={0}
            role="button"
            aria-label={`${app.roleTitle} at ${app.company}`}
            className={cn(
                'group relative bg-white rounded-2xl border border-neutral-100/80 shadow-sm',
                'cursor-pointer flex flex-col overflow-hidden min-h-[180px]',
                'outline-none focus-visible:ring-2 focus-visible:ring-blue-400 transition-shadow duration-200'
            )}
        >
            {/* Status accent bar (top edge) */}
            <div className={cn('h-[3px] w-full shrink-0', STATUS_ACCENT[app.status])} />

            {/* Card body */}
            <div className="p-4 flex flex-col gap-3 flex-1">
                {/* Top row: avatar + company + actions */}
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div
                            className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-semibold select-none', palette)}
                            style={{ fontSize: 12 }}
                            aria-hidden="true"
                        >
                            {initials || <Building2 style={{ width: 14, height: 14 }} />}
                        </div>
                        <div className="min-w-0">
                            <p className="font-semibold text-neutral-900 truncate leading-tight" style={{ fontSize: 13.5 }} title={app.roleTitle}>
                                {app.roleTitle}
                            </p>
                            <p className="text-neutral-400 truncate leading-tight mt-0.5" style={{ fontSize: 11.5 }} title={app.company}>
                                {app.company}
                            </p>
                        </div>
                    </div>
                    <CardMenu appId={app.id} onDelete={onDelete} onView={onView} onEdit={onEdit} />
                </div>

                {/* Location + Source */}
                <div className="flex items-center gap-2 flex-wrap">
                    {app.location && (
                        <div className="flex items-center gap-1 text-neutral-400" style={{ fontSize: 11 }}>
                            <MapPin style={{ width: 10, height: 10 }} />
                            <span className="truncate max-w-[100px]">{app.location}</span>
                        </div>
                    )}
                    {app.source && (
                        <span className="inline-flex items-center h-4 px-1.5 rounded-full text-[10px] bg-neutral-100 text-neutral-500 ring-1 ring-neutral-200 truncate max-w-[80px]">
                            {app.source}
                        </span>
                    )}
                </div>

                {/* Separator */}
                <div className="h-px bg-neutral-100" />

                {/* Status picker + Timeline */}
                <div className="flex items-center justify-between gap-2">
                    <QuickStatusPicker current={app.status} onSelect={(s) => onStatusChange(app.id, s)} />
                    <span className="flex items-center gap-1 text-neutral-400 truncate" style={{ fontSize: 10.5 }}>
                        <CalendarClock style={{ width: 10, height: 10, strokeWidth: 1.75 }} />
                        {timeline}
                    </span>
                </div>

                {/* Footer: follow-up + attachment badge + freshness */}
                <div className="flex items-center gap-1.5 flex-wrap mt-auto">
                    {urgency !== 'normal' && app.nextFollowUp && (
                        <div className={cn(
                            'inline-flex items-center gap-1 px-1.5 h-5 rounded-md text-[10px] font-semibold shrink-0',
                            URGENCY_PAD[urgency]
                        )}>
                            <Clock style={{ width: 9, height: 9, strokeWidth: 2 }} />
                            {urgency === 'critical' ? 'Today' : urgency === 'overdue' ? 'Overdue' : 'Due today'}
                        </div>
                    )}
                    {urgency === 'normal' && app.nextFollowUp && (
                        <div className="flex items-center gap-1 text-neutral-400" style={{ fontSize: 10.5 }}>
                            <Clock style={{ width: 10, height: 10 }} />
                            <span>{app.nextFollowUp}</span>
                        </div>
                    )}

                    {attachmentCount > 0 && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-neutral-400 ml-auto shrink-0">
                            <Paperclip style={{ width: 9, height: 9 }} />
                            {attachmentCount}
                        </span>
                    )}
                </div>

                {/* Activity freshness */}
                <p className="text-[10px] text-neutral-300 -mt-1">{formatRelativeDate(app.updatedAt)}</p>
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
}

export function GridView({ apps, isFiltered, onClear, onDelete, onView, onEdit, onStatusChange, onCreate }: GridViewProps) {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState<GridPageSize>(12);

    const totalPages = Math.max(1, Math.ceil(apps.length / pageSize));
    const safePage = Math.min(page, totalPages);
    const paginated = apps.slice((safePage - 1) * pageSize, safePage * pageSize);
    const rangeStart = apps.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
    const rangeEnd = Math.min(safePage * pageSize, apps.length);

    if (apps.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-14 h-14 rounded-2xl bg-neutral-100 flex items-center justify-center mb-4">
                    <Briefcase className="text-neutral-400" style={{ width: 24, height: 24, strokeWidth: 1.5 }} />
                </div>
                <h3 className="font-semibold text-neutral-800 mb-1" style={{ fontSize: 15 }}>
                    {isFiltered ? 'No matching applications' : 'Your pipeline is empty'}
                </h3>
                <p className="text-neutral-400 max-w-xs" style={{ fontSize: 13 }}>
                    {isFiltered
                        ? 'Try adjusting your search or status filter.'
                        : 'Add your first job application to get started.'}
                </p>
                <div className="mt-5">
                    {isFiltered ? (
                        <button onClick={onClear} className="inline-flex items-center h-9 px-4 rounded-lg text-[13px] font-medium border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition-colors">
                            Clear filters
                        </button>
                    ) : (
                        <button onClick={onCreate} className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg text-[13px] font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors">
                            + New Entry
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <AnimatePresence mode="popLayout">
                    {paginated.map((app, i) => (
                        <GridCard
                            key={app.id}
                            app={app}
                            index={i}
                            onDelete={onDelete}
                            onView={onView}
                            onEdit={onEdit}
                            onStatusChange={onStatusChange}
                        />
                    ))}
                </AnimatePresence>
            </div>

            {/* Pagination footer */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between gap-3 px-1 flex-wrap">
                    <div className="flex items-center gap-3">
                        <span className="text-[12px] text-neutral-400 whitespace-nowrap">
                            {rangeStart}–{rangeEnd} of {apps.length}
                        </span>
                        <div className="flex items-center gap-1.5">
                            <span className="text-[12px] text-neutral-400">Per page</span>
                            <select
                                value={pageSize}
                                onChange={(e) => { setPageSize(Number(e.target.value) as GridPageSize); setPage(1); }}
                                aria-label="Cards per page"
                                className="h-6 px-1.5 pr-5 rounded-md border border-neutral-200 bg-white text-[12px] text-neutral-600 outline-none appearance-none cursor-pointer"
                                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23a1a1aa' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 6px center' }}
                            >
                                {PAGE_SIZES.map((n) => <option key={n} value={n}>{n}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage <= 1}
                            aria-label="Previous page" className="w-7 h-7 flex items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                            <ChevronLeft style={{ width: 14, height: 14 }} />
                        </button>
                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                            const pg = totalPages <= 5 ? i + 1 : safePage <= 3 ? i + 1 : safePage >= totalPages - 2 ? totalPages - 4 + i : safePage - 2 + i;
                            return (
                                <button key={pg} type="button" onClick={() => setPage(pg)}
                                    aria-label={`Page ${pg}`} aria-current={safePage === pg ? 'page' : undefined}
                                    className={cn('w-7 h-7 flex items-center justify-center rounded-lg text-[12px] font-medium transition-colors',
                                        safePage === pg ? 'bg-blue-600 text-white shadow-sm' : 'text-neutral-500 hover:bg-neutral-100')}>
                                    {pg}
                                </button>
                            );
                        })}
                        <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage >= totalPages}
                            aria-label="Next page" className="w-7 h-7 flex items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                            <ChevronRight style={{ width: 14, height: 14 }} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
