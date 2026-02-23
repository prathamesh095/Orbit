'use client';

import {
    useState, useMemo, useCallback, memo, useRef,
    useEffect,
} from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/authContext';
import { useApplications } from '@/hooks/useApplications';
import { useToast } from '@/lib/toastContext';
import { useDebounce } from '@/hooks/useDebounce';
import {
    formatDate,
    formatRelativeDate,
    classifyUrgency,
    cn,
    generateId,
} from '@/lib/utils';
import type { Application, ApplicationStatus, UrgencyLevel } from '@/types';
import type { ApplicationFormValues } from '@/lib/validations';
import type { Attachment } from '@/types';
import {
    Plus, Search, X, LayoutList, LayoutGrid, Trello,
    Download, Upload, MoreHorizontal, Eye, Pencil,
    Trash2, ChevronLeft, ChevronRight,
    CalendarClock, Clock, Briefcase,
    Building2, MapPin, Paperclip,
} from 'lucide-react';
import { GridView } from '@/components/pipeline/GridView';
import { KanbanView } from '@/components/pipeline/KanbanView';
import { AppFormModal } from '@/components/pipeline/AppFormModal';
import { AppDetailDrawer } from '@/components/pipeline/AppDetailDrawer';
import { ListSkeleton, GridSkeleton, KanbanSkeleton } from '@/components/ui/WorkspaceSkeletons';

// ─── Constants & Types ────────────────────────────────────────────────────────

type ViewMode = 'list' | 'grid' | 'kanban';
const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;
type PageSize = typeof PAGE_SIZE_OPTIONS[number];

const STORAGE_VIEW = 'job_crm:v1:pref:view';
const STORAGE_PAGE_SIZE = 'job_crm:v1:pref:pageSize';

const STATUS_CONFIG: Record<ApplicationStatus, { label: string; dot: string; pill: string }> = {
    draft: { label: 'Draft', dot: 'bg-neutral-400', pill: 'bg-neutral-100 text-neutral-600 ring-neutral-200' },
    applied: { label: 'Applied', dot: 'bg-blue-500', pill: 'bg-blue-50 text-blue-700 ring-blue-200' },
    interviewing: { label: 'Interviewing', dot: 'bg-amber-500', pill: 'bg-amber-50 text-amber-700 ring-amber-200' },
    offer: { label: 'Offer', dot: 'bg-emerald-500', pill: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
    rejected: { label: 'Rejected', dot: 'bg-red-400', pill: 'bg-red-50 text-red-600 ring-red-200' },
};

const URGENCY_CFG: Record<UrgencyLevel, { label: string; cls: string }> = {
    critical: { label: 'Interview today', cls: 'text-amber-600 bg-amber-50 ring-1 ring-amber-200' },
    overdue: { label: 'Overdue', cls: 'text-red-600 bg-red-50 ring-1 ring-red-200' },
    due_today: { label: 'Due today', cls: 'text-blue-600 bg-blue-50 ring-1 ring-blue-200' },
    normal: { label: '', cls: 'text-neutral-400' },
};

// ─── Safe localStorage ────────────────────────────────────────────────────────

function readStorage(key: string, fallback: string): string {
    if (typeof window === 'undefined') return fallback;
    try { return window.localStorage.getItem(key) ?? fallback; } catch { return fallback; }
}
function writeStorage(key: string, val: string): void {
    if (typeof window === 'undefined') return;
    try { window.localStorage.setItem(key, val); } catch { /* quota */ }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
function getTimelineText(app: Application) {
    if (app.status === 'interviewing') return `Interview · ${formatRelativeDate(app.actionDate)}`;
    if (app.status === 'offer') return `Offer · ${formatRelativeDate(app.actionDate)}`;
    if (app.status === 'rejected') return `Rejected · ${formatRelativeDate(app.actionDate)}`;
    if (app.status === 'applied') return `Applied · ${formatRelativeDate(app.actionDate)}`;
    return `Drafted · ${formatRelativeDate(app.actionDate)}`;
}
function exportToCSV(apps: Application[]) {
    const header = ['Company', 'Role', 'Status', 'Location', 'Date Applied', 'Next Follow-up', 'Reply Received'];
    const rows = apps.map((a) => [
        a.company, a.roleTitle, a.status, a.location,
        a.actionDate, a.nextFollowUp, String(a.replyReceived),
    ]);
    const csv = [header, ...rows]
        .map((r) => r.map((v) => `"${(v ?? '').replace(/"/g, '""')}"`).join(','))
        .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = 'pipeline-export.csv'; link.click();
    URL.revokeObjectURL(url);
}

// ─── Status Pill ──────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: ApplicationStatus }) {
    const cfg = STATUS_CONFIG[status];
    return (
        <span className={cn('inline-flex items-center gap-1.5 px-2.5 h-6 rounded-full text-[11px] font-semibold uppercase tracking-wide ring-1 select-none', cfg.pill)}>
            <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', cfg.dot)} />
            {cfg.label}
        </span>
    );
}

// ─── Next Step Cell ───────────────────────────────────────────────────────────

function NextStepCell({ app }: { app: Application }) {
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

// ─── Highlight (Premium Search Touch) ─────────────────────────────────────────

function Highlight({ text, query }: { text: string; query: string }) {
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

// ─── Row Actions ──────────────────────────────────────────────────────────────

interface RowActionsProps {
    appId: string;
    onDelete: (id: string) => void;
    onEdit: (id: string) => void;
    onView: (id: string) => void;
}

function RowActions({ appId, onDelete, onEdit, onView }: RowActionsProps) {
    const [open, setOpen] = useState(false);
    const btnRef = useRef<HTMLButtonElement>(null);
    const items = [
        { label: 'View details', Icon: Eye, action: () => { onView(appId); setOpen(false); } },
        { label: 'Edit', Icon: Pencil, action: () => { onEdit(appId); setOpen(false); } },
        { label: 'Delete', Icon: Trash2, action: () => { onDelete(appId); setOpen(false); }, danger: true },
    ];
    return (
        <div className="relative flex justify-end">
            <button
                ref={btnRef}
                type="button"
                onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
                aria-label="Row actions" aria-haspopup="menu" aria-expanded={open}
                className={cn(
                    'w-7 h-7 rounded-lg flex items-center justify-center transition-colors',
                    'text-neutral-400 outline-none focus-visible:ring-2 focus-visible:ring-blue-400',
                    open ? 'bg-neutral-100 text-neutral-700 opacity-100' : 'opacity-0 group-hover:opacity-100 hover:bg-neutral-100 hover:text-neutral-700'
                )}
            >
                <MoreHorizontal style={{ width: 15, height: 15 }} />
            </button>
            <AnimatePresence>
                {open && (
                    <>
                        <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
                        <motion.div
                            role="menu"
                            initial={{ opacity: 0, scale: 0.95, y: -4 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -4 }}
                            transition={{ duration: 0.1 }}
                            className="absolute right-0 top-9 z-30 w-44 bg-white rounded-xl border border-neutral-100 shadow-lg shadow-neutral-200/60 overflow-hidden py-1"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {items.map(({ label, Icon, action, danger }) => (
                                <button
                                    key={label}
                                    type="button"
                                    role="menuitem"
                                    onClick={() => { action(); }}
                                    className={cn(
                                        'w-full flex items-center gap-2.5 px-3 py-2 text-left text-[13px] transition-colors',
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

// ─── Table Row (memoized) ─────────────────────────────────────────────────────

interface TableRowProps {
    app: Application;
    index: number;
    onDelete: (id: string) => void;
    onEdit: (id: string) => void;
    onView: (id: string) => void;
}

const TableRow = memo(function TableRow({
    app,
    index,
    isSelected,
    onDelete,
    onEdit,
    onView,
    searchQuery = ''
}: TableRowProps & { isSelected?: boolean; searchQuery?: string }) {
    const initials = getInitials(app.company);
    const palette = avatarPalette(app.company);
    const timeline = getTimelineText(app);
    const attachmentCount = app.attachments?.length ?? 0;

    return (
        <motion.tr
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15, delay: Math.min(index * 0.025, 0.3) }}
            onClick={() => onView(app.id)}
            className={cn(
                'group relative cursor-pointer transition-colors duration-100 outline-none',
                isSelected ? 'bg-blue-50/50' : 'hover:bg-neutral-50/80'
            )}
        >
            {/* Col 1: Company & Role */}
            <td className="px-5 py-4">
                <div className="flex items-center gap-3 min-w-0">
                    <div
                        className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-semibold select-none shadow-sm', palette)}
                        style={{ fontSize: 12 }} aria-hidden="true"
                    >
                        {initials || <Building2 style={{ width: 14, height: 14 }} />}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="font-semibold text-neutral-900 truncate leading-tight" style={{ fontSize: 13.5 }} title={app.roleTitle}>
                            <Highlight text={app.roleTitle} query={searchQuery} />
                        </p>
                        <div className="flex items-center gap-1.5 text-neutral-400 truncate mt-1" style={{ fontSize: 11.5 }}>
                            <span className="truncate" title={app.company}><Highlight text={app.company} query={searchQuery} /></span>
                            {app.source && (
                                <span className="inline-flex items-center h-4 px-1.5 rounded-full bg-neutral-100 text-neutral-500 ring-1 ring-neutral-200 text-[10px]">
                                    {app.source}
                                </span>
                            )}
                            {app.location && (
                                <>
                                    <span className="text-neutral-200 mx-0.5">·</span>
                                    <MapPin style={{ width: 10, height: 10 }} />
                                    <span className="truncate">{app.location}</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </td>
            {/* Col 2: Status */}
            <td className="px-4 py-4"><StatusPill status={app.status} /></td>
            {/* Col 3: Timeline */}
            <td className="px-4 py-4 hidden md:table-cell">
                <div className="flex items-center gap-1.5 text-neutral-400" style={{ fontSize: 12 }}>
                    <CalendarClock style={{ width: 13, height: 13, strokeWidth: 1.75 }} /> {timeline}
                </div>
            </td>
            {/* Col 4: Next Step */}
            <td className="px-4 py-4 hidden lg:table-cell"><NextStepCell app={app} /></td>
            {/* Col 5: Actions */}
            <td className="px-4 py-4 w-12" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-end gap-2">
                    {attachmentCount > 0 && (
                        <div className="flex items-center gap-0.5 text-neutral-400 mr-1" title={`${attachmentCount} attachments`}>
                            <Paperclip style={{ width: 11, height: 11 }} />
                            <span className="text-[10px] font-medium">{attachmentCount}</span>
                        </div>
                    )}
                    <RowActions appId={app.id} onDelete={onDelete} onEdit={onEdit} onView={onView} />
                </div>
            </td>
        </motion.tr>
    );
}, (prev, next) =>
    prev.app.id === next.app.id &&
    prev.app.status === next.app.status &&
    prev.app.company === next.app.company &&
    prev.app.roleTitle === next.app.roleTitle &&
    prev.app.nextFollowUp === next.app.nextFollowUp &&
    prev.app.actionDate === next.app.actionDate &&
    prev.app.replyReceived === next.app.replyReceived &&
    prev.index === next.index &&
    prev.searchQuery === next.searchQuery
);

// ─── Mobile Card ──────────────────────────────────────────────────────────────

const MobileCard = memo(function MobileCard({ app, onDelete, onEdit, onView }: { app: Application; onDelete: (id: string) => void; onEdit: (id: string) => void; onView: (id: string) => void }) {
    return (
        <div
            className="flex items-start gap-3 px-4 py-3.5 hover:bg-neutral-50 transition-colors cursor-pointer relative group"
            onClick={() => onView(app.id)}
            role="button" tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') onView(app.id); }}
        >
            <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-semibold text-xs', avatarPalette(app.company))}>
                {getInitials(app.company)}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <p className="font-semibold text-neutral-900 truncate" style={{ fontSize: 13 }}>{app.roleTitle}</p>
                        <p className="text-neutral-400 truncate" style={{ fontSize: 11.5 }}>{app.company}</p>
                    </div>
                    <StatusPill status={app.status} />
                </div>
                <div className="flex items-center gap-3 mt-1.5">
                    <NextStepCell app={app} />
                    <span className="text-neutral-300 ml-auto" style={{ fontSize: 11 }}>{formatRelativeDate(app.actionDate)}</span>
                </div>
            </div>
            <div className="absolute right-3 top-2" onClick={(e) => e.stopPropagation()}>
                <RowActions appId={app.id} onDelete={onDelete} onEdit={onEdit} onView={onView} />
            </div>
        </div>
    );
});

// ─── List (Table) View ────────────────────────────────────────────────────────

interface ListViewProps {
    apps: Application[];
    isFiltered: boolean;
    onClear: () => void;
    onDelete: (id: string) => void;
    onEdit: (id: string) => void;
    onView: (id: string) => void;
    onCreate: () => void;
    search: string;
    debouncedSearch: string;
}

function ListView({ apps, isFiltered, onClear, onDelete, onEdit, onView, onCreate, search, debouncedSearch }: ListViewProps) {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState<PageSize>(() =>
        Number(readStorage(STORAGE_PAGE_SIZE, '10')) as PageSize
    );
    const [selectedIndex, setSelectedIndex] = useState(-1);

    const totalPages = Math.max(1, Math.ceil(apps.length / pageSize));
    const safePage = Math.min(page, totalPages);
    const paginated = apps.slice((safePage - 1) * pageSize, safePage * pageSize);
    const rangeStart = apps.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
    const rangeEnd = Math.min(safePage * pageSize, apps.length);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (paginated.length === 0) return;
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex((prev) => (prev < paginated.length - 1 ? prev + 1 : prev));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
            } else if (e.key === 'Enter' && selectedIndex >= 0) {
                onView(paginated[selectedIndex].id);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [paginated, selectedIndex, onView]);

    // Reset selection on page change or filter
    useEffect(() => {
        setSelectedIndex(-1);
    }, [page, apps]);

    if (apps.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
                <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                    <div className="w-14 h-14 rounded-2xl bg-neutral-100 flex items-center justify-center mb-4">
                        <Briefcase className="text-neutral-400" style={{ width: 24, height: 24, strokeWidth: 1.5 }} />
                    </div>
                    <h3 className="font-semibold text-neutral-800 mb-1" style={{ fontSize: 15 }}>
                        {isFiltered ? `No results for "${search}"` : 'Your pipeline is empty'}
                    </h3>
                    <p className="text-neutral-400 max-w-xs" style={{ fontSize: 13 }}>
                        {isFiltered ? 'Try adjusting your search or status filter to find what you’re looking for.' : 'Add your first job application to start tracking.'}
                    </p>
                    <div className="mt-5">
                        {isFiltered ? (
                            <button onClick={onClear} className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg text-[13px] font-medium border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition-colors">
                                <X style={{ width: 13, height: 13 }} /> Clear filters
                            </button>
                        ) : (
                            <button onClick={onCreate} className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg text-[13px] font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors">
                                <Plus style={{ width: 13, height: 13, strokeWidth: 2.5 }} /> New Entry
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto max-h-[calc(100vh-280px)] custom-scrollbar">
                <table className="w-full border-separate border-spacing-0" role="grid" aria-label="Job applications pipeline">
                    <thead className="sticky top-0 z-20">
                        <tr className="border-b border-neutral-100">
                            {[
                                { label: 'Company & Role', className: 'pl-5 pr-4 w-auto' },
                                { label: 'Status', className: 'px-4 w-40' },
                                { label: 'Timeline', className: 'px-4 w-44 hidden md:table-cell' },
                                { label: 'Next Step', className: 'px-4 w-40 hidden lg:table-cell' },
                                { label: '', className: 'px-4 w-12' },
                            ].map(({ label, className }) => (
                                <th
                                    key={label || 'actions'}
                                    scope="col"
                                    className={cn('py-3 text-left text-[11px] font-semibold text-neutral-400 uppercase tracking-wider bg-neutral-50/60', className)}
                                >
                                    {label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-50 bg-white">
                        {paginated.map((app, i) => (
                            <TableRow
                                key={app.id}
                                app={app}
                                index={i}
                                isSelected={i === selectedIndex}
                                onDelete={onDelete}
                                onEdit={onEdit}
                                onView={onView}
                                searchQuery={debouncedSearch}
                            />
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-neutral-100">
                {paginated.map((app) => (
                    <MobileCard key={app.id} app={app} onDelete={onDelete} onEdit={onEdit} onView={onView} />
                ))}
            </div>

            {/* Pagination footer */}
            <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-t border-neutral-100 bg-neutral-50/40 flex-wrap">
                <div className="flex items-center gap-3">
                    <span className="text-[12px] text-neutral-400 whitespace-nowrap">
                        {apps.length === 0 ? '0 results' : `${rangeStart}–${rangeEnd} of ${apps.length}`}
                    </span>
                    <div className="flex items-center gap-1.5">
                        <span className="text-[12px] text-neutral-400">Rows</span>
                        <select
                            value={pageSize}
                            onChange={(e) => { setPageSize(Number(e.target.value) as PageSize); writeStorage(STORAGE_PAGE_SIZE, e.target.value); setPage(1); }}
                            aria-label="Rows per page"
                            className="h-6 px-1.5 pr-5 rounded-md border border-neutral-200 bg-white text-[12px] text-neutral-600 outline-none appearance-none cursor-pointer"
                            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23a1a1aa' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 6px center' }}
                        >
                            {PAGE_SIZE_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
                        </select>
                    </div>
                </div>
                <div className="flex items-center gap-1.5">
                    <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage <= 1}
                        aria-label="Previous page"
                        className="w-7 h-7 flex items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronLeft style={{ width: 14, height: 14 }} />
                    </button>
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        const pg = totalPages <= 5 ? i + 1 : safePage <= 3 ? i + 1 : safePage >= totalPages - 2 ? totalPages - 4 + i : safePage - 2 + i;
                        return (
                            <button
                                key={pg} type="button" onClick={() => setPage(pg)}
                                aria-label={`Page ${pg}`} aria-current={safePage === pg ? 'page' : undefined}
                                className={cn('w-7 h-7 flex items-center justify-center rounded-lg text-[12px] font-medium transition-colors',
                                    safePage === pg ? 'bg-blue-600 text-white shadow-sm' : 'text-neutral-500 hover:bg-neutral-100')}
                            >
                                {pg}
                            </button>
                        );
                    })}
                    <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage >= totalPages}
                        aria-label="Next page"
                        className="w-7 h-7 flex items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronRight style={{ width: 14, height: 14 }} />
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Skeleton (Removed local logic in favor of WorkspaceSkeletons) ───────────

// ─── View Switcher ────────────────────────────────────────────────────────────

const VIEW_OPTIONS: { mode: ViewMode; Icon: React.ComponentType<{ style?: React.CSSProperties }>; label: string; shortLabel: string }[] = [
    { mode: 'list', Icon: LayoutList, label: 'List view', shortLabel: 'List' },
    { mode: 'grid', Icon: LayoutGrid, label: 'Grid view', shortLabel: 'Grid' },
    { mode: 'kanban', Icon: Trello, label: 'Kanban view', shortLabel: 'Board' },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PipelinePage() {
    const { user, isLoading } = useAuth();
    const { applications, createApplication, updateApplication, updateStatus, deleteApplication } = useApplications(user?.id ?? '');
    const { success, error: toastError } = useToast();
    const router = useRouter();

    // ── View preference (persisted) ───────────────────────────────────────────
    const [view, setView] = useState<ViewMode>(() =>
        (readStorage(STORAGE_VIEW, 'list') as ViewMode)
    );
    const setViewAndPersist = useCallback((v: ViewMode) => {
        setView(v); writeStorage(STORAGE_VIEW, v);
    }, []);

    // ── Search / Filter state ─────────────────────────────────────────────────
    const [statusFilter, setStatusFilter] = useState<ApplicationStatus | ''>('');
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search, 220);

    const clearFilters = useCallback(() => { setSearch(''); setStatusFilter(''); }, []);
    const isFiltered = Boolean(search || statusFilter);

    // ── Form modal state ──────────────────────────────────────────────────────
    const [modal, setModal] = useState<{ open: boolean; editId?: string }>({ open: false });

    const openCreate = useCallback(() => setModal({ open: true }), []);
    const openEdit = useCallback((id: string) => { setViewTarget(null); setModal({ open: true, editId: id }); }, []);
    const closeModal = useCallback(() => setModal({ open: false }), []);

    // ── Detail drawer state ───────────────────────────────────────────────────
    const [viewTarget, setViewTarget] = useState<Application | null>(null);
    const openView = useCallback((id: string) => {
        const app = applications.find((a) => a.id === id);
        if (app) setViewTarget(app);
    }, [applications]);
    const closeView = useCallback(() => setViewTarget(null), []);

    const editingApp = modal.editId ? applications.find((a) => a.id === modal.editId) : undefined;

    // ── Filtered dataset (shared across all views) ────────────────────────────
    const filtered = useMemo(() => {
        return applications.filter((a) => {
            if (statusFilter && a.status !== statusFilter) return false;
            if (!debouncedSearch) return true;
            const q = debouncedSearch.toLowerCase();
            return (
                a.company.toLowerCase().includes(q) ||
                a.roleTitle.toLowerCase().includes(q) ||
                a.location.toLowerCase().includes(q) ||
                a.strategicNotes.toLowerCase().includes(q) ||
                a.status.toLowerCase().includes(q) ||
                a.source?.toLowerCase().includes(q)
            );
        });
    }, [applications, debouncedSearch, statusFilter]);

    // ── Handlers ──────────────────────────────────────────────────────────────
    const handleDelete = useCallback((id: string) => {
        try { deleteApplication(id); success('Removed', 'Application deleted'); }
        catch { toastError?.('Error', 'Could not delete'); }
    }, [deleteApplication, success, toastError]);

    const handleStatusChange = useCallback((id: string, newStatus: ApplicationStatus) => {
        updateStatus(id, newStatus);
        success('Moved', `Application moved to ${newStatus}`);
    }, [updateStatus, success]);

    const handleCreate = useCallback(async (data: ApplicationFormValues, attachments: Attachment[]) => {
        const now = new Date().toISOString();
        const app = createApplication({
            ...data, attachments,
            replyReceived: data.replyReceived ?? false,
            followUpSent: data.followUpSent ?? false,
            linkedContactIds: data.linkedContactIds ?? [],
        });
        success('Created', `"${data.roleTitle}" added to pipeline`);
        return app;
    }, [createApplication, success]);

    const handleUpdate = useCallback((id: string, data: Partial<ApplicationFormValues>) => {
        updateApplication(id, data);
        success('Updated', 'Application saved');
    }, [updateApplication, success]);

    const handleExport = useCallback(() => {
        exportToCSV(filtered);
        success('Exported', `${filtered.length} applications downloaded`);
    }, [filtered, success]);

    const handleImport = useCallback(() => {
        success('Coming soon', 'CSV import will be available soon');
    }, [success]);

    // ─────────────────────────────────────────────────────────────────────────

    const SkeletonLoader = useMemo(() => {
        if (view === 'grid') return <GridSkeleton />;
        if (view === 'kanban') return <KanbanSkeleton />;
        return <ListSkeleton />;
    }, [view]);

    return (
        <div className="max-w-7xl mx-auto">

            {/* ── Header: Title + View Switcher + Command cluster ──── */}
            <div className="flex flex-col gap-3 mb-6">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                    {/* Left: title */}
                    <div>
                        <h1 className="font-bold text-neutral-900 leading-none" style={{ fontSize: 20 }}>Pipeline</h1>
                        <p className="text-neutral-400 mt-0.5" style={{ fontSize: 13 }}>
                            {isLoading ? 'Loading…' : `${applications.length} application${applications.length !== 1 ? 's' : ''}`}
                        </p>
                    </div>

                    {/* Center: view switcher */}
                    <div
                        role="group"
                        aria-label="View mode"
                        className="flex items-center bg-neutral-100 rounded-xl p-1 gap-0.5"
                    >
                        {VIEW_OPTIONS.map(({ mode, Icon, label, shortLabel }) => (
                            <button
                                key={mode}
                                type="button"
                                onClick={() => setViewAndPersist(mode)}
                                title={label}
                                aria-label={label}
                                aria-pressed={view === mode}
                                className={cn(
                                    'flex items-center gap-1.5 h-8 px-3 rounded-lg text-[13px] font-medium transition-all duration-150',
                                    'outline-none focus-visible:ring-2 focus-visible:ring-blue-400',
                                    view === mode
                                        ? 'bg-white text-neutral-900 shadow-sm'
                                        : 'text-neutral-500 hover:text-neutral-700'
                                )}
                            >
                                <Icon style={{ width: 14, height: 14 }} />
                                <span className="hidden sm:inline">{shortLabel}</span>
                            </button>
                        ))}
                    </div>

                    {/* Right: command cluster */}
                    <div className="flex items-center gap-2">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" style={{ width: 14, height: 14 }} />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search…"
                                aria-label="Search applications"
                                className="h-8 w-44 rounded-lg border border-neutral-200 bg-white pl-7 pr-7 text-[13px] text-neutral-800 placeholder:text-neutral-400 outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400 transition-shadow"
                            />
                            <AnimatePresence>
                                {search && (
                                    <motion.button
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                        type="button"
                                        onClick={() => setSearch('')}
                                        aria-label="Clear search"
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                                    >
                                        <X style={{ width: 12, height: 12 }} />
                                    </motion.button>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Status filter */}
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as ApplicationStatus | '')}
                            aria-label="Filter by status"
                            className="h-8 px-2.5 pr-7 rounded-lg border border-neutral-200 bg-white text-[13px] text-neutral-700 outline-none focus:ring-2 focus:ring-blue-400/40 transition-shadow appearance-none cursor-pointer"
                            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23a1a1aa' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center' }}
                        >
                            <option value="">All status</option>
                            {(Object.keys(STATUS_CONFIG) as ApplicationStatus[]).map((s) => (
                                <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                            ))}
                        </select>

                        {/* Divider */}
                        <div className="w-px h-6 bg-neutral-200" />

                        {/* Import */}
                        <button
                            type="button" onClick={handleImport} title="Import CSV" aria-label="Import from CSV"
                            className="w-8 h-8 flex items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-500 hover:text-neutral-800 hover:border-neutral-300 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                        >
                            <Upload style={{ width: 14, height: 14 }} />
                        </button>

                        {/* Export */}
                        <button
                            type="button" onClick={handleExport} title="Export to CSV" aria-label="Export to CSV"
                            className="w-8 h-8 flex items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-500 hover:text-neutral-800 hover:border-neutral-300 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                        >
                            <Download style={{ width: 14, height: 14 }} />
                        </button>

                        {/* New Entry CTA */}
                        <button
                            type="button"
                            onClick={openCreate}
                            aria-label="Add new application"
                            className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-lg text-[13px] font-semibold bg-blue-600 text-white shadow-sm hover:bg-blue-700 active:bg-blue-800 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-1"
                        >
                            <Plus style={{ width: 14, height: 14, strokeWidth: 2.5 }} /> New Entry
                        </button>
                    </div>
                </div>

                {/* Active filter chip strip */}
                <AnimatePresence>
                    {isFiltered && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex items-center gap-2 flex-wrap overflow-hidden"
                        >
                            <span className="text-[12px] text-neutral-400">Filters:</span>
                            {search && (
                                <span className="inline-flex items-center gap-1 h-6 px-2.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-medium ring-1 ring-blue-200">
                                    &ldquo;{search}&rdquo;
                                    <button onClick={() => setSearch('')} className="ml-0.5 hover:text-blue-900" aria-label="Remove search filter">
                                        <X style={{ width: 10, height: 10 }} />
                                    </button>
                                </span>
                            )}
                            {statusFilter && (
                                <span className={cn('inline-flex items-center gap-1 h-6 px-2.5 rounded-full text-[11px] font-medium ring-1', STATUS_CONFIG[statusFilter as ApplicationStatus].pill)}>
                                    {STATUS_CONFIG[statusFilter as ApplicationStatus].label}
                                    <button onClick={() => setStatusFilter('')} className="ml-0.5" aria-label="Remove status filter">
                                        <X style={{ width: 10, height: 10 }} />
                                    </button>
                                </span>
                            )}
                            <button onClick={clearFilters} className="text-[11px] text-neutral-400 hover:text-neutral-600 underline ml-1">Clear all</button>
                            <span className="text-[11px] text-neutral-400 ml-auto">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ── Active View Container ───────────────────────────── */}
            {isLoading ? SkeletonLoader : (
                <AnimatePresence mode="wait" initial={false}>
                    {view === 'list' && (
                        <motion.div
                            key="list"
                            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.14 }}
                        >
                            <ListView
                                apps={filtered}
                                isFiltered={isFiltered}
                                onClear={clearFilters}
                                onDelete={handleDelete}
                                onEdit={openEdit}
                                onView={openView}
                                onCreate={openCreate}
                                search={search}
                                debouncedSearch={debouncedSearch}
                            />
                        </motion.div>
                    )}
                    {view === 'grid' && (
                        <motion.div
                            key="grid"
                            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.14 }}
                        >
                            <GridView
                                apps={filtered}
                                isFiltered={isFiltered}
                                onClear={clearFilters}
                                onDelete={handleDelete}
                                onView={openView}
                                onEdit={openEdit}
                                onStatusChange={handleStatusChange}
                                onCreate={openCreate}
                            />
                        </motion.div>
                    )}
                    {view === 'kanban' && (
                        <motion.div
                            key="kanban"
                            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.14 }}
                        >
                            <KanbanView
                                apps={filtered}
                                isFiltered={isFiltered}
                                onStatusChange={handleStatusChange}
                                onDelete={handleDelete}
                                onView={openView}
                                onEdit={openEdit}
                                onCreate={openCreate}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            )}

            {/* ── App Form Modal ───────────────────────────────────── */}
            <AppFormModal
                open={modal.open}
                mode={modal.editId ? 'edit' : 'create'}
                userId={user?.id ?? ''}
                application={editingApp}
                onCreate={handleCreate}
                onUpdate={handleUpdate}
                onClose={closeModal}
            />

            {/* ── App Detail Drawer ─────────────────────────────────── */}
            <AppDetailDrawer
                app={viewTarget}
                onClose={closeView}
                onEdit={(app) => openEdit(app.id)}
                onDelete={(id) => { handleDelete(id); closeView(); }}
                onStatusChange={handleStatusChange}
            />
        </div>
    );
}
