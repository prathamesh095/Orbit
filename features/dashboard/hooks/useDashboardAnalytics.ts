import { useMemo } from 'react';
import { useApplicationsQuery } from '../../shared/api/applicationsApi';
import { computePipelineMetrics } from '../utils/analyticsEngine';
import type { PipelineMetrics } from '../../shared/types/domain';

/**
 * useDashboardAnalytics Hook.
 * 
 * Provides stable, memoized analytics derived from the application state.
 * Uses the high-performance analyticsEngine to ensure O(n) scalability.
 * leverages TanStack Query for enterprise-grade server state.
 */
export function useDashboardAnalytics(userId: string) {
    const { data: applications = [], isLoading, error } = useApplicationsQuery(userId);

    const metrics: PipelineMetrics = useMemo(() => {
        return computePipelineMetrics(applications);
    }, [applications]);

    return {
        applications, // For charts/lists
        metrics,
        isLoading,
        error,
        isEmpty: applications.length === 0,
    };
}
