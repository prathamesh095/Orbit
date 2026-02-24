'use client';

import { useMemo, useState, useCallback, useEffect } from 'react';
import type { Application, ApplicationStatus } from '@/types';
import { useDebounce } from './useDebounce';

export type SortField = 'company' | 'roleTitle' | 'status' | 'actionDate' | 'urgency';
export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
    field: SortField;
    direction: SortDirection;
}

export interface PipelineViewOptions {
    initialPageSize?: number;
    initialStatus?: ApplicationStatus | '';
    initialSort?: SortConfig;
}

export function usePipelineView(applications: Application[], options: PipelineViewOptions = {}) {
    const {
        initialPageSize = 10,
        initialStatus = '',
        initialSort = { field: 'actionDate', direction: 'desc' }
    } = options;

    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search, 300);
    const [statusFilter, setStatusFilter] = useState<ApplicationStatus | ''>(initialStatus);
    const [sortConfig, setSortConfig] = useState<SortConfig>(initialSort);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(initialPageSize);

    // Reset page when filters change
    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, statusFilter, pageSize, sortConfig]);

    const filtered = useMemo(() => {
        let result = applications.filter((app) => {
            // Status filter
            if (statusFilter && app.status !== statusFilter) return false;

            // Search filter
            if (!debouncedSearch.trim()) return true;
            const q = debouncedSearch.toLowerCase();

            const searchFields = [
                app.company,
                app.strategicNotes,
                app.status,
                ('roleTitle' in app ? app.roleTitle : ''),
                ('location' in app ? app.location : ''),
            ];

            return searchFields.some(field => field?.toLowerCase().includes(q));
        });

        // Sorting logic
        return [...result].sort((a, b) => {
            const field = sortConfig.field;
            const dir = sortConfig.direction === 'asc' ? 1 : -1;

            let valA: string = '';
            let valB: string = '';

            if (field === 'urgency') {
                const weights: Record<string, number> = { critical: 5, overdue: 4, high: 3, normal: 2, low: 1 };
                const aUrgency = a.urgency || 'normal';
                const bUrgency = b.urgency || 'normal';
                return (weights[aUrgency] - weights[bUrgency]) * dir;
            }

            if (field === 'company') { valA = a.company; valB = b.company; }
            else if (field === 'roleTitle') {
                valA = 'roleTitle' in a ? (a as any).roleTitle : '';
                valB = 'roleTitle' in b ? (b as any).roleTitle : '';
            }
            else if (field === 'status') { valA = a.status; valB = b.status; }
            else if (field === 'actionDate') { valA = a.actionDate; valB = b.actionDate; }

            return valA.localeCompare(valB) * dir;
        });
    }, [applications, debouncedSearch, statusFilter, sortConfig]);

    const paginated = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filtered.slice(start, start + pageSize);
    }, [filtered, page, pageSize]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const rangeStart = filtered.length === 0 ? 0 : (page - 1) * pageSize + 1;
    const rangeEnd = Math.min(page * pageSize, filtered.length);

    const clearFilters = useCallback(() => {
        setSearch('');
        setStatusFilter('');
    }, []);

    const handleSort = useCallback((field: SortField) => {
        setSortConfig(prev => ({
            field,
            direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    }, []);

    const statusCounts = useMemo(() => {
        const counts: Record<ApplicationStatus, number> = {
            draft: 0,
            applied: 0,
            interviewing: 0,
            offer: 0,
            rejected: 0,
        };
        applications.forEach(app => {
            if (counts[app.status] !== undefined) {
                counts[app.status]++;
            }
        });
        return counts;
    }, [applications]);

    return {
        // State
        search,
        setSearch,
        debouncedSearch,
        statusFilter,
        setStatusFilter,
        sortConfig,
        setSortConfig,
        page,
        setPage,
        pageSize,
        setPageSize,

        // Derived
        filtered,
        paginated,
        totalPages,
        totalResults: filtered.length,
        rangeStart,
        rangeEnd,
        isFiltered: Boolean(search || statusFilter),
        statusCounts,

        // Handlers
        clearFilters,
        handleSort,
    };
}
