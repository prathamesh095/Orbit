'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Trello, LayoutList, LayoutGrid, Download, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/authContext';
import {
    useApplicationsQuery,
    useUpdateStatusMutation,
    useCreateApplicationMutation,
    useUpdateApplicationMutation,
    useDeleteApplicationMutation,
    useBatchDeleteMutation,
    useBatchUpdateStatusMutation,
} from '@/features/shared/api/applicationsApi';
import { usePipelineView } from '@/hooks/usePipelineView';
import { useToast } from '@/lib/toastContext';

// Components
import { ListView } from '@/components/pipeline/ListView';
import { GridView } from '@/components/pipeline/GridView';
import { KanbanView } from '@/components/pipeline/KanbanView';
import { AppFormModal } from '@/components/pipeline/AppFormModal';
import { AppDetailDrawer } from '@/components/pipeline/AppDetailDrawer';
import { ListSkeleton, GridSkeleton, KanbanSkeleton } from '@/components/ui/WorkspaceSkeletons';
import { BatchStatusBar } from '@/components/pipeline/BatchStatusBar';
import type { Application, ApplicationStatus, Attachment } from '@/types';
import type { ApplicationFormValues } from '@/lib/validations';

type ViewMode = 'list' | 'grid' | 'kanban';

export default function ApplicationsPage() {
    const { user } = useAuth();
    const toast = useToast();
    const userId = user?.id || 'demo-user';

    // ─── Data Layer (TanStack Query) ─────────────────────────────────────────────
    const { data: applications = [], isLoading, error } = useApplicationsQuery(userId);

    const updateStatusMutation = useUpdateStatusMutation();
    const createMutation = useCreateApplicationMutation();
    const updateMutation = useUpdateApplicationMutation();
    const deleteMutation = useDeleteApplicationMutation();
    const batchDeleteMutation = useBatchDeleteMutation();
    const batchUpdateStatusMutation = useBatchUpdateStatusMutation();

    // ─── View Strategy ──────────────────────────────────────────────────────────
    const [viewMode, setViewMode] = useState<ViewMode>(() => {
        if (typeof window !== 'undefined') {
            return (localStorage.getItem('job_crm_view_mode') as ViewMode) || 'list';
        }
        return 'list';
    });

    const {
        search, setSearch, debouncedSearch,
        statusFilter, setStatusFilter,
        sortConfig, setSortConfig,
        page, setPage,
        pageSize, setPageSize,
        paginated, totalPages, totalResults,
        rangeStart, rangeEnd,
        isFiltered, clearFilters,
        statusCounts, handleSort
    } = usePipelineView(applications);

    // ─── Selection Layer ────────────────────────────────────────────────────────
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const toggleSelection = useCallback((id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, []);

    const toggleAll = useCallback(() => {
        if (selectedIds.size === paginated.length) setSelectedIds(new Set());
        else setSelectedIds(new Set(paginated.map((a: Application) => a.id)));
    }, [paginated, selectedIds.size]);

    // ─── UI State ───────────────────────────────────────────────────────────────
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingApp, setEditingApp] = useState<Application | null>(null);
    const [viewingApp, setViewingApp] = useState<Application | null>(null);

    // Persist view mode
    useEffect(() => {
        localStorage.setItem('job_crm_view_mode', viewMode);
    }, [viewMode]);

    // ─── Handlers ───────────────────────────────────────────────────────────────
    const handleCreate = () => {
        setEditingApp(null);
        setIsFormOpen(true);
    };

    const handleEdit = (id: string) => {
        const app = applications.find((a: Application) => a.id === id);
        if (app) {
            setEditingApp(app);
            setIsFormOpen(true);
        }
    };

    const handleView = (id: string) => {
        const app = applications.find((a: Application) => a.id === id);
        if (app) setViewingApp(app);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this application?')) {
            await deleteMutation.mutateAsync({ id, userId });
            toast.success('Application deleted');
            if (viewingApp?.id === id) setViewingApp(null);
        }
    };

    const handleBatchDelete = async () => {
        if (confirm(`Delete ${selectedIds.size} applications?`)) {
            await batchDeleteMutation.mutateAsync({ ids: Array.from(selectedIds), userId });
            setSelectedIds(new Set());
            toast.success('Applications deleted');
        }
    };

    const handleExport = () => {
        toast.info('Exporting data...');
    };

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 mb-4">
                    <p className="font-bold">Error loading pipeline</p>
                    <p className="text-sm opacity-80">{error.message}</p>
                </div>
                <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-neutral-900 text-white rounded-lg font-bold"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full overflow-hidden bg-neutral-50/30">
            {/* Header / Toolbar */}
            <header className="px-6 py-4 flex flex-col gap-4 bg-white border-b border-neutral-100 shadow-sm z-20">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-neutral-900">Job Pipeline</h1>
                        <p className="text-xs text-neutral-400 font-medium">Manage and track your career opportunities</p>
                    </div>
                    <div className="flex items-center gap-4">
                        {/* Stats mini-dashboard */}
                        <div className="hidden lg:flex items-center gap-3">
                            {(['applied', 'interviewing', 'offer'] as ApplicationStatus[]).map((s) => (
                                <div key={s} className="flex items-center gap-2 px-3 py-1 rounded-lg bg-neutral-50 border border-neutral-100">
                                    <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-tight">{s}</span>
                                    <span className="text-xs font-bold text-neutral-900">{statusCounts[s]}</span>
                                </div>
                            ))}
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={handleExport} className="hidden sm:flex items-center gap-2 h-9 px-3.5 rounded-xl text-[13px] font-bold text-neutral-500 hover:bg-neutral-50 transition-colors">
                                <Download size={15} /> Export
                            </button>
                            <button
                                onClick={handleCreate}
                                className="flex items-center gap-2 h-9 px-4 rounded-xl text-[13px] font-bold bg-neutral-900 text-white hover:bg-neutral-800 transition-all shadow-md active:scale-95"
                            >
                                <Plus size={16} strokeWidth={3} /> <span className="hidden sm:inline">New Application</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                    {/* Search Input */}
                    <div className="relative flex-1 w-full sm:max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search company, position, status..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full h-10 pl-10 pr-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                        {search && (
                            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    {/* View Switcher */}
                    <div className="flex items-center p-1 bg-white border border-neutral-100 rounded-xl shadow-sm self-stretch sm:self-auto ml-auto">
                        <button
                            onClick={() => setViewMode('list')}
                            className={cn('flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all', viewMode === 'list' ? 'bg-neutral-900 text-white shadow-md' : 'text-neutral-500 hover:bg-neutral-50')}
                        >
                            <LayoutList size={14} /> <span className="hidden lg:inline">List</span>
                        </button>
                        <button
                            onClick={() => setViewMode('grid')}
                            className={cn('flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all', viewMode === 'grid' ? 'bg-neutral-900 text-white shadow-md' : 'text-neutral-500 hover:bg-neutral-50')}
                        >
                            <LayoutGrid size={14} /> <span className="hidden lg:inline">Grid</span>
                        </button>
                        <button
                            onClick={() => setViewMode('kanban')}
                            className={cn('flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all', viewMode === 'kanban' ? 'bg-neutral-900 text-white shadow-md' : 'text-neutral-500 hover:bg-neutral-50')}
                        >
                            <Trello size={14} /> <span className="hidden lg:inline">Board</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Viewport */}
            <main className="flex-1 overflow-hidden relative">
                {isLoading ? (
                    <div className="h-full p-6">
                        {viewMode === 'list' && <ListSkeleton />}
                        {viewMode === 'grid' && <GridSkeleton />}
                        {viewMode === 'kanban' && <KanbanSkeleton />}
                    </div>
                ) : (
                    <div className="h-full">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={viewMode}
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.15 }}
                                className="h-full p-6"
                            >
                                {viewMode === 'list' && (
                                    <ListView
                                        apps={applications}
                                        paginated={paginated}
                                        isFiltered={isFiltered}
                                        onClear={clearFilters}
                                        onDelete={handleDelete}
                                        onEdit={handleEdit}
                                        onView={handleView}
                                        onCreate={handleCreate}
                                        search={search}
                                        debouncedSearch={debouncedSearch}
                                        selectedIds={selectedIds}
                                        toggleSelection={toggleSelection}
                                        toggleAll={toggleAll}
                                        page={page}
                                        setPage={setPage}
                                        pageSize={pageSize}
                                        setPageSize={setPageSize}
                                        totalPages={totalPages}
                                        rangeStart={rangeStart}
                                        rangeEnd={rangeEnd}
                                        openMenuId={null}
                                        setOpenMenuId={() => { }}
                                        onSort={handleSort}
                                        sortConfig={sortConfig}
                                    />
                                )}
                                {viewMode === 'grid' && (
                                    <GridView
                                        apps={paginated}
                                        isFiltered={isFiltered}
                                        onClear={clearFilters}
                                        onDelete={handleDelete}
                                        onEdit={handleEdit}
                                        onView={handleView}
                                        onStatusChange={(id, status) => updateStatusMutation.mutate({ id, userId, status })}
                                        onCreate={handleCreate}
                                        selectedIds={selectedIds}
                                        toggleSelection={toggleSelection}
                                    />
                                )}
                                {viewMode === 'kanban' && (
                                    <KanbanView
                                        apps={isFiltered ? paginated : applications}
                                        onStatusChange={(id, status) => updateStatusMutation.mutate({ id, userId, status })}
                                        onDelete={handleDelete}
                                        onView={handleView}
                                        onEdit={handleEdit}
                                        selectedIds={selectedIds}
                                        toggleSelection={toggleSelection}
                                    />
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                )}

                {/* Batch Actions Bar */}
                <BatchStatusBar
                    selectedCount={selectedIds.size}
                    onClear={() => setSelectedIds(new Set())}
                    onDelete={handleBatchDelete}
                    onStatusUpdate={(status) => {
                        batchUpdateStatusMutation.mutate({ ids: Array.from(selectedIds), status, userId });
                        setSelectedIds(new Set());
                    }}
                />
            </main>

            {/* Modals & Overlays */}
            <AppFormModal
                open={isFormOpen}
                initialData={editingApp}
                onClose={() => setIsFormOpen(false)}
                onSave={async (data: ApplicationFormValues, attachments: Attachment[]) => {
                    if (editingApp) {
                        updateMutation.mutate({ id: editingApp.id, userId, data });
                        toast.success('Application updated');
                    } else {
                        createMutation.mutate({ userId, data });
                        toast.success('Application created');
                    }
                    setIsFormOpen(false);
                }}
                userId={userId}
            />

            <AppDetailDrawer
                app={viewingApp}
                onClose={() => setViewingApp(null)}
                onEdit={(app) => { setViewingApp(null); handleEdit(app.id); }}
                onDelete={(id) => { setViewingApp(null); handleDelete(id); }}
                onStatusChange={(id, status) => updateStatusMutation.mutate({ id, userId, status })}
            />
        </div>
    );
}
