'use client';

import {
    useState, useMemo, useCallback, memo, useRef,
    useEffect,
} from 'react';
import { useRouter } from 'next/navigation';
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
import type { Application, ApplicationStatus, AppSettings, UrgencyLevel } from '@/types';
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

const STIFF_SPRING = { type: 'spring', stiffness: 400, damping: 30 };
const SMOOTH_SPRING = { type: 'spring', stiffness: 300, damping: 30 };

const STATUS_CONFIG: Record<ApplicationStatus, { label: string; dot: string; pill: string }> = {
    draft: { label: 'Draft', dot: 'bg-neutral-400', pill: 'bg-neutral-100 text-neutral-600 ring-neutral-200 shadow-[0_1px_2px_rgba(0,0,0,0.03)]' },
    applied: { label: 'Applied', dot: 'bg-blue-500', pill: 'bg-blue-50/80 text-blue-700 ring-blue-200/60 shadow-[0_2px_8px_-2px_rgba(59,130,246,0.12)]' },
    interviewing: { label: 'Interviewing', dot: 'bg-amber-500', pill: 'bg-amber-50/80 text-amber-700 ring-amber-200/60 shadow-[0_2px_8px_-2px_rgba(245,158,11,0.12)]' },
    offer: { label: 'Offer', dot: 'bg-emerald-500', pill: 'bg-emerald-50/80 text-emerald-700 ring-emerald-200/60 shadow-[0_2px_8px_-2px_rgba(16,185,129,0.12)]' },
    rejected: { label: 'Rejected', dot: 'bg-red-400', pill: 'bg-red-50/80 text-red-600 ring-red-200/60 shadow-[0_2px_8px_-2px_rgba(239,68,68,0.12)]' },
};

const URGENCY_CFG: Record<UrgencyLevel, { label: string; cls: string }> = {
    critical: { label: 'Interview today', cls: 'text-amber-700 bg-amber-50/80 ring-1 ring-amber-200/60 shadow-sm' },
    overdue: { label: 'Overdue', cls: 'text-red-700 bg-red-50/80 ring-1 ring-red-200/60 shadow-sm' },
    due_today: { label: 'Due today', cls: 'text-blue-700 bg-blue-50/80 ring-1 ring-blue-200/60 shadow-sm' },
    normal: { label: '', cls: 'text-neutral-400' },
};

import { StatusPill } from '@/components/ui/StatusPill';
import { IntentBadge } from '@/components/ui/IntentBadge';
import { BatchStatusBar } from '@/components/pipeline/BatchStatusBar';
import { useSettings } from '@/lib/settingsContext';

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

// StatusPill moved to shared UI primitive


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
    isOpen: boolean;
    onToggle: (open: boolean) => void;
    onDelete: (id: string) => void;
    onEdit: (id: string) => void;
    onView: (id: string) => void;
}

function RowActions({ appId, isOpen, onToggle, onDelete, onEdit, onView }: RowActionsProps) {
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
                aria-label="Row actions" aria-haspopup="menu" aria-expanded={isOpen}
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
                            style={{
                                top: 'auto',
                                right: 'auto',
                                transform: 'translate(-100%, 8px)' // This logic needs to be robust or simple enough
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {items.map(({ label, Icon, action, danger }) => (
                                <button
                                    key={label}
                                    type="button"
                                    role="menuitem"
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


// ─── Table Row (memoized) ─────────────────────────────────────────────────────

interface TableRowProps {
    app: Application;
    index: number;
    isSelected: boolean;
    isMenuOpen: boolean;
    onToggleMenu: (open: boolean) => void;
    onDelete: (id: string) => void;
    onEdit: (id: string) => void;
    onView: (id: string) => void;
    onToggleSelection: (id: string) => void;
    isFocused?: boolean;
    searchQuery?: string;
}

const TableRow = memo(function TableRow({
    app,
    index,
    isSelected,
    isMenuOpen,
    onToggleMenu,
    onDelete,
    onEdit,
    onView,
    onToggleSelection,
    isFocused,
    searchQuery = ''
}: TableRowProps) {
    const initials = getInitials(app.company);
    const palette = avatarPalette(app.company);
    const timeline = getTimelineText(app);
    const attachmentCount = app.attachments?.length ?? 0;

    return (
        <motion.tr
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ ...SMOOTH_SPRING, delay: Math.min(index * 0.02, 0.2) }}
            onClick={() => onView(app.id)}
            className={cn(
                'group relative cursor-pointer transition-colors duration-150 outline-none',
                isSelected ? 'bg-blue-50/60' : 'hover:bg-neutral-50/80',
                isMenuOpen && 'bg-neutral-50/80 z-[50]',
                isFocused && 'bg-blue-50/40 ring-1 ring-inset ring-blue-500/30'
            )}
            style={{ zIndex: isMenuOpen ? 50 : 1 }}
        >
            {/* Col 0: Checkbox */}
            <td className="pl-5 pr-0 w-10">
                <div className="flex items-center justify-center w-4 h-4" onClick={(e) => e.stopPropagation()}>
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                            onToggleSelection(app.id);
                            e.stopPropagation();
                        }}
                        className="w-4 h-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900 transition-all cursor-pointer opacity-0 group-hover:opacity-100 checked:opacity-100"
                    />
                </div>
            </td>
            {/* Col 1: Company & Role */}
            <td className="pl-3 pr-4 py-3.5">
                <div className="flex items-center gap-4 min-w-0">
                    <div
                        className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold select-none shadow-sm transition-transform group-hover:scale-105', palette)}
                        style={{ fontSize: 13 }} aria-hidden="true"
                    >
                        {initials || <Building2 style={{ width: 14, height: 14 }} />}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="font-bold text-neutral-900 truncate leading-tight" style={{ fontSize: 14 }} title={app.roleTitle}>
                            <Highlight text={app.roleTitle} query={searchQuery} />
                        </p>
                        <div className="flex items-center gap-2 text-neutral-400 truncate mt-1" style={{ fontSize: 12 }}>
                            <span className="font-medium text-neutral-500 truncate" title={app.company}>
                                <Highlight text={app.company} query={searchQuery} />
                            </span>
                            {app.source && (
                                <span className="inline-flex items-center h-4 px-1.5 rounded-md bg-neutral-100/80 text-neutral-500 text-[10px] font-bold uppercase tracking-tight">
                                    {app.source}
                                </span>
                            )}
                            {app.location && (
                                <>
                                    <span className="text-neutral-200">·</span>
                                    <MapPin style={{ width: 10, height: 10 }} />
                                    <span className="truncate">{app.location}</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </td>
            {/* Col 2: Intent */}
            <td className="px-4 py-3.5">
                <IntentBadge intent={app.recordIntent || 'application'} />
            </td>
            {/* Col 3: Status */}
            <td className="px-4 py-3.5"><StatusPill status={app.status} className="h-5.5" /></td>
            {/* Col 4: Timeline */}
            <td className="px-4 py-3.5 hidden md:table-cell">
                <div className="flex items-center gap-1.5 text-neutral-400 font-medium" style={{ fontSize: 12 }}>
                    <CalendarClock style={{ width: 14, height: 14, strokeWidth: 2 }} className="opacity-60" /> {timeline}
                </div>
            </td>
            {/* Col 5: Next Step */}
            <td className="px-4 py-3.5 hidden lg:table-cell"><NextStepCell app={app} /></td>
            {/* Col 6: Actions */}
            <td className="px-5 py-3.5 w-12 !overflow-visible" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-end gap-3 overflow-visible">
                    {attachmentCount > 0 && (
                        <div className="flex items-center gap-1 text-neutral-400 opacity-60 group-hover:opacity-100 transition-opacity" title={`${attachmentCount} attachments`}>
                            <Paperclip style={{ width: 12, height: 12, strokeWidth: 2 }} />
                            <span className="text-[10px] font-bold">{attachmentCount}</span>
                        </div>
                    )}
                    <RowActions
                        appId={app.id}
                        isOpen={isMenuOpen}
                        onToggle={onToggleMenu}
                        onDelete={onDelete}
                        onEdit={onEdit}
                        onView={onView}
                    />
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
    prev.app.recordIntent === next.app.recordIntent &&
    prev.isSelected === next.isSelected &&
    prev.isFocused === next.isFocused &&
    prev.isMenuOpen === next.isMenuOpen &&
    prev.index === next.index &&
    prev.searchQuery === next.searchQuery
);


// ─── Mobile Card ──────────────────────────────────────────────────────────────

const MobileCard = memo(function MobileCard({
    app, isSelected, onToggleSelection, onDelete, onEdit, onView
}: {
    app: Application;
    isSelected: boolean;
    onToggleSelection: (id: string) => void;
    onDelete: (id: string) => void;
    onEdit: (id: string) => void;
    onView: (id: string) => void;
}) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    return (
        <div
            className={cn(
                'flex items-start gap-3 px-4 py-4 transition-all duration-200 cursor-pointer relative group border-b border-neutral-100/60 last:border-0',
                isSelected ? 'bg-blue-50/60' : 'hover:bg-neutral-50/80 active:bg-neutral-100'
            )}
            onClick={() => onView(app.id)}
            role="button" tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') onView(app.id); }}
        >
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs shadow-sm', avatarPalette(app.company))}>
                {getInitials(app.company)}
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <p className="font-bold text-neutral-900 truncate leading-tight" style={{ fontSize: 13.5 }}>{app.roleTitle}</p>
                        <p className="text-neutral-500 font-medium truncate mt-0.5" style={{ fontSize: 11.5 }}>{app.company}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 mt-2">
                    <StatusPill status={app.status} className="h-5 shrink-0" />
                    <IntentBadge intent={app.recordIntent || 'application'} />
                </div>

                <div className="flex items-center gap-3 mt-3">
                    <NextStepCell app={app} />
                    <span className="text-neutral-300 font-medium uppercase tracking-tighter ml-auto" style={{ fontSize: 9.5 }}>
                        {formatRelativeDate(app.actionDate)}
                    </span>
                </div>
            </div>

            <div className="flex flex-col items-end gap-2 ml-2" onClick={(e) => e.stopPropagation()}>
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSelection(app.id)}
                    className={cn(
                        'w-4 h-4 rounded-md border-neutral-300 text-neutral-900 focus:ring-neutral-900 transition-all mb-1',
                        isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    )}
                />
                <RowActions
                    appId={app.id}
                    isOpen={isMenuOpen}
                    onToggle={setIsMenuOpen}
                    onDelete={onDelete}
                    onEdit={onEdit}
                    onView={onView}
                />
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
    selectedIds: Set<string>;
    toggleSelection: (id: string) => void;
    toggleAll: (ids: string[]) => void;
    openMenuId: string | null;
    setOpenMenuId: (id: string | null) => void;
}

function ListView({
    apps, isFiltered, onClear, onDelete, onEdit, onView, onCreate, search, debouncedSearch,
    selectedIds, toggleSelection, toggleAll, openMenuId, setOpenMenuId, pageSize, saveGlobalSetting
}: ListViewProps & { pageSize: number; saveGlobalSetting: (partial: Partial<AppSettings>) => void }) {
    const [page, setPage] = useState(1);
    const [selectedIndex, setSelectedIndex] = useState(-1);

    const totalPages = Math.max(1, Math.ceil(apps.length / pageSize));
    const safePage = Math.min(page, totalPages);
    const paginated = apps.slice((safePage - 1) * pageSize, safePage * pageSize);
    const rangeStart = apps.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
    const rangeEnd = Math.min(safePage * pageSize, apps.length);

    const handleToggleAll = useCallback(() => {
        toggleAll(paginated.map((a) => a.id));
    }, [paginated, toggleAll]);

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
        <div className="flex flex-col h-full bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto flex-1 min-h-0 custom-scrollbar">
                <table className="w-full border-separate border-spacing-0" role="grid" aria-label="Job applications pipeline">
                    <thead className="sticky top-0 z-20">
                        <tr className="border-b border-neutral-100">
                            <th scope="col" className="pl-5 pr-0 w-10 bg-neutral-50/60 backdrop-blur-sm">
                                <div className="flex items-center justify-center">
                                    <input
                                        type="checkbox"
                                        checked={paginated.length > 0 && selectedIds.size === paginated.length}
                                        onChange={handleToggleAll}
                                        className="w-4 h-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900 cursor-pointer"
                                    />
                                </div>
                            </th>
                            {[
                                { label: 'Company & Role', className: 'pl-3 pr-4 w-auto' },
                                { label: 'Intent', className: 'px-4 w-32' },
                                { label: 'Status', className: 'px-4 w-40' },
                                { label: 'Timeline', className: 'px-4 w-44 hidden md:table-cell' },
                                { label: 'Next Step', className: 'px-4 w-40 hidden lg:table-cell' },
                                { label: '', className: 'px-4 w-12 text-right' },
                            ].map(({ label, className }) => (
                                <th
                                    key={label || 'actions'}
                                    scope="col"
                                    className={cn('py-3 text-left text-[11px] font-semibold text-neutral-400 uppercase tracking-wider bg-neutral-50/60 backdrop-blur-sm', className)}
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
                                isSelected={selectedIds.has(app.id)}
                                isFocused={i === selectedIndex}
                                isMenuOpen={openMenuId === app.id}
                                onToggleMenu={(open) => setOpenMenuId(open ? app.id : null)}
                                onToggleSelection={toggleSelection}
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
            <div className="md:hidden divide-y divide-neutral-100 overflow-y-auto flex-1">
                {paginated.map((app) => (
                    <MobileCard
                        key={app.id}
                        app={app}
                        isSelected={selectedIds.has(app.id)}
                        onToggleSelection={toggleSelection}
                        onDelete={onDelete}
                        onEdit={onEdit}
                        onView={onView}
                    />
                ))}
            </div>

            {/* Pagination footer (Compact SaaS Style) */}
            <footer className="flex items-center justify-between gap-3 px-5 h-12 border-t border-neutral-100 bg-white/80 backdrop-blur shrink-0">
                <div className="flex items-center gap-4">
                    <span className="text-[12px] text-neutral-400 whitespace-nowrap">
                        {apps.length === 0 ? '0 results' : `${rangeStart}–${rangeEnd} of ${apps.length}`}
                    </span>
                    <div className="h-4 w-px bg-neutral-200 hidden sm:block" />
                    <div className="hidden sm:flex items-center gap-2">
                        <span className="text-[12px] text-neutral-400">Rows</span>
                        <select
                            value={pageSize}
                            onChange={(e) => {
                                saveGlobalSetting({ pageSize: Number(e.target.value) });
                                setPage(1);
                            }}
                            aria-label="Rows per page"
                            className="h-7 px-2 pr-6 rounded-lg border border-neutral-200 bg-white text-[12px] text-neutral-600 outline-none appearance-none cursor-pointer hover:border-neutral-300 transition-colors"
                            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23a1a1aa' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center' }}
                        >
                            {PAGE_SIZE_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
                        </select>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 font-medium">
                    <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage <= 1}
                        aria-label="Previous page"
                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
                    >
                        <ChevronLeft style={{ width: 14, height: 14 }} />
                    </button>
                    <div className="flex items-center gap-1 px-1">
                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                            const pg = totalPages <= 5 ? i + 1 : safePage <= 3 ? i + 1 : safePage >= totalPages - 2 ? totalPages - 4 + i : safePage - 2 + i;
                            return (
                                <button
                                    key={pg} type="button" onClick={() => setPage(pg)}
                                    aria-label={`Page ${pg}`} aria-current={safePage === pg ? 'page' : undefined}
                                    className={cn('min-w-[32px] h-8 flex items-center justify-center rounded-lg text-[12px] transition-all',
                                        safePage === pg ? 'bg-neutral-900 text-white shadow-sm' : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900')}
                                >
                                    {pg}
                                </button>
                            );
                        })}
                    </div>
                    <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage >= totalPages}
                        aria-label="Next page"
                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
                    >
                        <ChevronRight style={{ width: 14, height: 14 }} />
                    </button>
                </div>
            </footer>
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
    const { settings, updateSettings: saveGlobalSetting } = useSettings();
    const router = useRouter();

    const view = settings.defaultView;
    const setViewAndPersist = useCallback((v: ViewMode) => {
        saveGlobalSetting({ defaultView: v });
    }, [saveGlobalSetting]);

    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search, 300);
    const [statusFilter, setStatusFilter] = useState<ApplicationStatus | ''>('');

    const [modal, setModal] = useState<{ open: boolean; editId: string | null }>({ open: false, editId: null });
    const [viewTarget, setViewTarget] = useState<Application | null>(null);

    // Shared Selection & Menu State
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    const clearFilters = useCallback(() => { setSearch(''); setStatusFilter(''); }, []);
    const isFiltered = Boolean(search || statusFilter);

    // ── Handlers & Derived State ───────────────────────────────────────────
    const openCreate = useCallback(() => setModal({ open: true, editId: null }), []);
    const openEdit = useCallback((id: string) => { setViewTarget(null); setModal({ open: true, editId: id }); }, []);
    const closeModal = useCallback(() => setModal({ open: false, editId: null }), []);

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

    const toggleSelection = useCallback((id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, []);

    const toggleAll = useCallback((ids: string[]) => {
        if (selectedIds.size === ids.length) setSelectedIds(new Set());
        else setSelectedIds(new Set(ids));
    }, [selectedIds.size]);

    const handleBatchDelete = useCallback(() => {
        if (window.confirm(`Delete ${selectedIds.size} applications?`)) {
            selectedIds.forEach((id) => deleteApplication(id));
            setSelectedIds(new Set());
            success('Deleted', `${selectedIds.size} applications removed`);
        }
    }, [selectedIds, deleteApplication, success]);

    const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

    // ─────────────────────────────────────────────────────────────────────────

    const SkeletonLoader = useMemo(() => {
        if (view === 'grid') return <GridSkeleton />;
        if (view === 'kanban') return <KanbanSkeleton />;
        return <ListSkeleton />;
    }, [view]);

    return (
        <div className="h-screen flex flex-col overflow-hidden max-w-7xl mx-auto px-4">

            {/* ── Header: Title + View Switcher + Command cluster (Shrinkable) ──── */}
            <header className="flex flex-col gap-4 py-6 shrink-0">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                    {/* Left: title */}
                    <div className="flex items-baseline gap-3">
                        <h1 className="font-bold text-neutral-900 leading-none tracking-tight" style={{ fontSize: 24 }}>Pipeline</h1>
                        <span className="text-neutral-400 font-medium" style={{ fontSize: 13 }}>
                            {isLoading ? 'Loading…' : `${applications.length} total`}
                        </span>
                    </div>

                    {/* Center: view switcher */}
                    <nav
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
                                    'flex items-center gap-1.5 h-8 px-3.5 rounded-lg text-[13px] font-semibold transition-all duration-200 select-none',
                                    'outline-none focus-visible:ring-2 focus-visible:ring-blue-400',
                                    view === mode
                                        ? 'bg-white text-neutral-900 shadow-sm border border-neutral-200/50'
                                        : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-200/50'
                                )}
                            >
                                <Icon style={{ width: 14, height: 14, strokeWidth: 2.25 }} />
                                <span className="hidden sm:inline">{shortLabel}</span>
                            </button>
                        ))}
                    </nav>

                    {/* Right: command cluster */}
                    <div className="flex items-center gap-2">
                        {/* Search */}
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-blue-500 transition-colors pointer-events-none" style={{ width: 14, height: 14 }} />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search pipeline…"
                                aria-label="Search applications"
                                className="h-9 w-48 rounded-xl border border-neutral-200 bg-white/50 backdrop-blur-sm pl-9 pr-8 text-[13px] text-neutral-800 placeholder:text-neutral-400 outline-none focus:ring-2 focus:ring-blue-400/20 focus:border-blue-400 focus:bg-white transition-all shadow-sm"
                            />
                            <AnimatePresence>
                                {search && (
                                    <motion.button
                                        initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                                        type="button"
                                        onClick={() => setSearch('')}
                                        aria-label="Clear search"
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full bg-neutral-100 text-neutral-400 hover:bg-neutral-200 hover:text-neutral-600 transition-colors"
                                    >
                                        <X style={{ width: 10, height: 10, strokeWidth: 3 }} />
                                    </motion.button>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Status filter */}
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as ApplicationStatus | '')}
                            aria-label="Filter by status"
                            className="h-9 px-3 pr-8 rounded-xl border border-neutral-200 bg-white/50 backdrop-blur-sm text-[13px] font-medium text-neutral-700 outline-none focus:ring-2 focus:ring-blue-400/20 focus:border-blue-400 focus:bg-white transition-all appearance-none cursor-pointer shadow-sm"
                            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23a1a1aa' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}
                        >
                            <option value="">All Statuses</option>
                            {(Object.keys(STATUS_CONFIG) as ApplicationStatus[]).map((s) => (
                                <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                            ))}
                        </select>

                        {/* Divider */}
                        <div className="w-px h-6 bg-neutral-200 mx-1" />

                        {/* New Entry CTA (Premium Style) */}
                        <button
                            type="button"
                            onClick={openCreate}
                            aria-label="Add new application"
                            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl text-[13px] font-bold bg-neutral-900 text-white shadow-lg shadow-neutral-200 active:scale-[0.98] transition-all hover:bg-neutral-800 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-neutral-900"
                        >
                            <Plus style={{ width: 14, height: 14, strokeWidth: 3 }} /> New Entry
                        </button>
                    </div>
                </div>

                {/* Active filter chip strip */}
                <AnimatePresence>
                    {isFiltered && (
                        <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            className="flex items-center gap-2 overflow-hidden"
                        >
                            <span className="text-[12px] text-neutral-400 font-medium">Filtered by:</span>
                            <div className="flex items-center gap-1.5 flex-wrap">
                                {search && (
                                    <span className="inline-flex items-center gap-1.5 h-7 px-3 rounded-xl bg-blue-50 text-blue-700 text-[11px] font-bold ring-1 ring-blue-200/50 shadow-sm">
                                        &ldquo;{search}&rdquo;
                                        <button onClick={() => setSearch('')} className="ml-0.5 hover:text-blue-900 p-0.5" aria-label="Remove search filter">
                                            <X style={{ width: 10, height: 10, strokeWidth: 3 }} />
                                        </button>
                                    </span>
                                )}
                                {statusFilter && (
                                    <span className={cn('inline-flex items-center gap-1.5 h-7 px-3 rounded-xl text-[11px] font-bold ring-1 shadow-sm', STATUS_CONFIG[statusFilter as ApplicationStatus].pill)}>
                                        {STATUS_CONFIG[statusFilter as ApplicationStatus].label}
                                        <button onClick={() => setStatusFilter('')} className="ml-0.5 p-0.5" aria-label="Remove status filter">
                                            <X style={{ width: 10, height: 10, strokeWidth: 3 }} />
                                        </button>
                                    </span>
                                )}
                                <button onClick={clearFilters} className="text-xs text-neutral-400 hover:text-neutral-900 font-semibold transition-colors px-2">Reset</button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </header>

            {/* ── Main Viewport (Scrollable container) ────────────────────────── */}
            <main className="flex-1 min-h-0 relative">
                <AnimatePresence mode="wait">
                    {isLoading ? (
                        <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0">
                            {SkeletonLoader}
                        </motion.div>
                    ) : (
                        <motion.div
                            key={view}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="h-full"
                        >
                            {view === 'list' && (
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
                                    selectedIds={selectedIds}
                                    toggleSelection={toggleSelection}
                                    toggleAll={toggleAll}
                                    openMenuId={openMenuId}
                                    setOpenMenuId={setOpenMenuId}
                                    pageSize={settings.pageSize}
                                    saveGlobalSetting={saveGlobalSetting}
                                />
                            )}
                            {view === 'grid' && (
                                <GridView
                                    apps={filtered}
                                    isFiltered={isFiltered}
                                    onClear={clearFilters}
                                    onDelete={handleDelete}
                                    onView={openView}
                                    onEdit={openEdit}
                                    onStatusChange={handleStatusChange}
                                    onCreate={openCreate}
                                    selectedIds={selectedIds}
                                    toggleSelection={toggleSelection}
                                />
                            )}
                            {view === 'kanban' && (
                                <KanbanView
                                    apps={filtered}
                                    isFiltered={isFiltered}
                                    selectedIds={selectedIds}
                                    toggleSelection={toggleSelection}
                                    onStatusChange={handleStatusChange}
                                    onDelete={handleDelete}
                                    onView={openView}
                                    onEdit={openEdit}
                                    onCreate={openCreate}
                                />
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                <BatchStatusBar
                    selectedCount={selectedIds.size}
                    onClear={clearSelection}
                    onDelete={handleBatchDelete}
                />
            </main>

            {/* ── Modals & Drawers ─────────────────────────────────────────── */}
            <AppFormModal
                open={modal.open}
                mode={modal.editId ? 'edit' : 'create'}
                userId={user?.id ?? ''}
                application={editingApp}
                onCreate={handleCreate}
                onUpdate={handleUpdate}
                onClose={closeModal}
            />

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
