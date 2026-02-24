'use client';

import { memo, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, X, Briefcase, ChevronLeft, ChevronRight,
    MapPin, CalendarClock, Paperclip, Building2
} from 'lucide-react';
import { cn, formatRelativeDate, avatarPalette, getInitials } from '@/lib/utils';
import type { Application, ApplicationStatus } from '@/types';
import type { SortField, SortConfig } from '@/hooks/usePipelineView';
import { StatusPill } from '@/components/ui/StatusPill';
import { IntentBadge } from '@/components/ui/IntentBadge';
import {
    Highlight,
    NextStepCell,
    RowActions
} from './PipelineComponents';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTimelineText(app: Application) {
    if (app.status === 'interviewing') return `Interview · ${formatRelativeDate(app.actionDate)}`;
    if (app.status === 'offer') return `Offer · ${formatRelativeDate(app.actionDate)}`;
    if (app.status === 'rejected') return `Rejected · ${formatRelativeDate(app.actionDate)}`;
    if (app.status === 'applied') return `Applied · ${formatRelativeDate(app.actionDate)}`;
    return `Drafted · ${formatRelativeDate(app.actionDate)}`;
}

// ─── Table Row ────────────────────────────────────────────────────────────────

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
    app, index, isSelected, isMenuOpen, onToggleMenu,
    onDelete, onEdit, onView, onToggleSelection,
    isFocused, searchQuery = ''
}: TableRowProps) {
    const initials = getInitials(app.company);
    const palette = avatarPalette(app.company);
    const timeline = getTimelineText(app);
    const attachmentCount = app.attachments?.length ?? 0;

    // Union-safe property access
    const roleTitle = 'roleTitle' in app ? app.roleTitle : '';
    const location = 'location' in app ? app.location : '';
    const source = 'source' in app ? app.source : '';

    return (
        <motion.tr
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            onClick={() => onView(app.id)}
            className={cn(
                'group relative cursor-pointer transition-colors duration-150 outline-none',
                isSelected ? 'bg-blue-50/60' : 'hover:bg-neutral-50/80',
                isMenuOpen && 'bg-neutral-50/80 z-[50]',
                isFocused && 'bg-blue-50/40 ring-1 ring-inset ring-blue-500/30'
            )}
        >
            <td className="pl-5 pr-0 w-10">
                <div className="flex items-center justify-center w-4 h-4" onClick={(e) => e.stopPropagation()}>
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                            onToggleSelection(app.id);
                            e.stopPropagation();
                        }}
                        className="w-4 h-4 rounded border-neutral-300"
                    />
                </div>
            </td>
            <td className="pl-3 pr-4 py-3.5">
                <div className="flex items-center gap-4 min-w-0">
                    <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold', palette)}>
                        {initials || <Building2 style={{ width: 14, height: 14 }} />}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="font-bold text-neutral-900 truncate leading-tight">
                            <Highlight text={roleTitle || app.company} query={searchQuery} />
                        </p>
                        <div className="flex items-center gap-2 text-neutral-400 truncate mt-1" style={{ fontSize: 12 }}>
                            <span className="font-medium text-neutral-500 truncate">
                                <Highlight text={app.company} query={searchQuery} />
                            </span>
                            {source && (
                                <span className="inline-flex items-center h-4 px-1.5 rounded-md bg-neutral-100/80 text-neutral-500 text-[10px] font-bold uppercase">
                                    {source}
                                </span>
                            )}
                            {location && (
                                <>
                                    <span className="text-neutral-200">·</span>
                                    <MapPin style={{ width: 10, height: 10 }} />
                                    <span className="truncate">{location}</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </td>
            <td className="px-4 py-3.5"><IntentBadge intent={app.recordIntent || 'application'} /></td>
            <td className="px-4 py-3.5"><StatusPill status={app.status} className="h-5.5" /></td>
            <td className="px-4 py-3.5 hidden md:table-cell">
                <div className="flex items-center gap-1.5 text-neutral-400 font-medium" style={{ fontSize: 12 }}>
                    <CalendarClock style={{ width: 14, height: 14 }} /> {timeline}
                </div>
            </td>
            <td className="px-4 py-3.5 hidden lg:table-cell"><NextStepCell app={app} /></td>
            <td className="px-5 py-3.5 w-12" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-end gap-3">
                    {attachmentCount > 0 && (
                        <div className="flex items-center gap-1 text-neutral-400 opacity-60">
                            <Paperclip style={{ width: 12, height: 12 }} />
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
});

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
    const roleTitle = 'roleTitle' in app ? app.roleTitle : '';

    return (
        <div
            className={cn(
                'flex items-start gap-3 px-4 py-4 cursor-pointer relative',
                isSelected ? 'bg-blue-50/60' : 'hover:bg-neutral-50/80 active:bg-neutral-100'
            )}
            onClick={() => onView(app.id)}
        >
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs', avatarPalette(app.company))}>
                {getInitials(app.company)}
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <p className="font-bold text-neutral-900 truncate leading-tight">{roleTitle || app.company}</p>
                        <p className="text-neutral-500 font-medium truncate mt-0.5">{app.company}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 mt-2">
                    <StatusPill status={app.status} className="h-5 shrink-0" />
                    <IntentBadge intent={app.recordIntent || 'application'} />
                </div>

                <div className="flex items-center gap-3 mt-3">
                    <NextStepCell app={app} />
                    <span className="text-neutral-300 font-medium ml-auto" style={{ fontSize: 9.5 }}>
                        {formatRelativeDate(app.actionDate)}
                    </span>
                </div>
            </div>

            <div className="flex flex-col items-end gap-2 ml-2" onClick={(e) => e.stopPropagation()}>
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSelection(app.id)}
                    className="w-4 h-4 rounded-md border-neutral-300"
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

// ─── List View ────────────────────────────────────────────────────────────────

interface ListViewProps {
    apps: Application[];
    paginated: Application[];
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
    page: number;
    setPage: (p: number) => void;
    pageSize: number;
    setPageSize: (s: number) => void;
    totalPages: number;
    rangeStart: number;
    rangeEnd: number;
    onSort: (field: SortField) => void;
    sortConfig: SortConfig;
}

export function ListView({
    apps, paginated, isFiltered, onClear, onDelete, onEdit, onView, onCreate,
    search, debouncedSearch, selectedIds, toggleSelection, toggleAll,
    openMenuId, setOpenMenuId, page, setPage, pageSize, setPageSize,
    totalPages, rangeStart, rangeEnd, onSort, sortConfig
}: ListViewProps) {
    const [selectedIndex, setSelectedIndex] = useState(-1);

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

    useEffect(() => { setSelectedIndex(-1); }, [page, apps]);

    if (apps.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
                <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                    <div className="w-14 h-14 rounded-2xl bg-neutral-100 flex items-center justify-center mb-4">
                        <Briefcase className="text-neutral-400" />
                    </div>
                    <h3 className="font-semibold text-neutral-800 mb-1">
                        {isFiltered ? `No results for "${search}"` : 'Your pipeline is empty'}
                    </h3>
                    <p className="text-neutral-400 max-w-xs text-sm">
                        {isFiltered ? 'Try adjusting your search or status filter.' : 'Add your first job application to start tracking.'}
                    </p>
                    <div className="mt-5">
                        {isFiltered ? (
                            <button onClick={onClear} className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg text-sm border hover:bg-neutral-50">
                                <X className="w-4 h-4" /> Clear filters
                            </button>
                        ) : (
                            <button onClick={onCreate} className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg text-sm bg-blue-600 text-white hover:bg-blue-700">
                                <Plus className="w-4 h-4" /> New Entry
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
            <div className="hidden md:block overflow-x-auto flex-1 custom-scrollbar">
                <table className="w-full border-separate border-spacing-0">
                    <thead className="sticky top-0 z-20">
                        <tr className="border-b border-neutral-100">
                            <th className="pl-5 pr-0 w-10 bg-neutral-50/60 backdrop-blur-sm">
                                <input
                                    type="checkbox"
                                    checked={paginated.length > 0 && selectedIds.size === paginated.length}
                                    onChange={handleToggleAll}
                                    className="w-4 h-4 rounded border-neutral-300"
                                />
                            </th>
                            {[
                                { label: 'Company & Role', className: 'pl-3 pr-4', sort: 'company' as SortField },
                                { label: 'Intent', className: 'px-4 w-32' },
                                { label: 'Status', className: 'px-4 w-40', sort: 'status' as SortField },
                                { label: 'Timeline', className: 'px-4 w-44 hidden md:table-cell', sort: 'actionDate' as SortField },
                                { label: 'Next Step', className: 'px-4 w-40 hidden lg:table-cell' },
                                { label: '', className: 'px-4 w-12 text-right' },
                            ].map(({ label, className, sort }) => (
                                <th
                                    key={label}
                                    className={cn(
                                        'py-3 text-left text-[11px] font-semibold text-neutral-400 uppercase tracking-wider bg-neutral-50/60 backdrop-blur-sm transition-colors',
                                        sort && 'cursor-pointer hover:text-neutral-600',
                                        className
                                    )}
                                    onClick={() => sort && onSort(sort)}
                                >
                                    <div className="flex items-center gap-1">
                                        {label}
                                        {sort && sortConfig.field === sort && (
                                            <span className="text-[10px] text-blue-500">
                                                {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                            </span>
                                        )}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-50">
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

            <footer className="flex items-center justify-between px-5 h-12 border-t bg-white/80 backdrop-blur shrink-0">
                <div className="flex items-center gap-4 text-xs text-neutral-400">
                    <span>{rangeStart}–{rangeEnd} of {apps.length}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1} className="w-8 h-8 flex items-center justify-center rounded-lg border hover:bg-neutral-50 disabled:opacity-30">
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <div className="flex gap-1">
                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                            const pg = i + 1; // Simplification for now
                            return (
                                <button key={pg} onClick={() => setPage(pg)} className={cn('w-8 h-8 rounded-lg text-xs transition-all', page === pg ? 'bg-neutral-900 text-white shadow-sm' : 'text-neutral-500 hover:bg-neutral-100')}>
                                    {pg}
                                </button>
                            );
                        })}
                    </div>
                    <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages} className="w-8 h-8 flex items-center justify-center rounded-lg border hover:bg-neutral-50 disabled:opacity-30">
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </footer>
        </div>
    );
}
