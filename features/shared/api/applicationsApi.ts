import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as storageService from '@/services/storage/storageService';
import { CACHE_KEYS } from '@/lib/queryClient';
import type { Application, ApplicationStatus } from '@/types';
import { classifyUrgency } from '@/lib/utils';

/**
 * Enterprise Application API Hooks.
 * 
 * DESIGN PATTERNS:
 * - Query Deduplication: Automatic via TanStack Query.
 * - Stale-While-Revalidate: Enabled via default staleTime.
 * - Optimistic Updates: Implemented in mutations for zero-latency feel.
 */

function enrichApplication(app: Application): Application {
    return { ...app, urgency: classifyUrgency(app) };
}

export function useApplicationsQuery(userId: string) {
    return useQuery({
        queryKey: [...CACHE_KEYS.applications, userId],
        queryFn: async () => {
            if (!userId) return [];
            // Simulated network latency for production feel
            await new Promise(r => setTimeout(r, 400));
            return storageService.getApplications(userId).map(enrichApplication);
        },
        enabled: !!userId,
    });
}

export function useUpdateStatusMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, userId, status }: { id: string; userId: string; status: ApplicationStatus }) => {
            const existing = storageService.getApplicationById(userId, id);
            if (!existing) throw new Error('Application not found');

            const updated = { ...existing, status, updatedAt: new Date().toISOString() };
            storageService.upsertApplication(userId, updated);
            return enrichApplication(updated as any);
        },
        onMutate: async (variables: { id: string; userId: string; status: ApplicationStatus }) => {
            const queryKey = [...CACHE_KEYS.applications, variables.userId];
            await queryClient.cancelQueries({ queryKey });
            const previousApplications = queryClient.getQueryData<Application[]>(queryKey);

            if (previousApplications) {
                queryClient.setQueryData<Application[]>(queryKey, (old: Application[] | undefined) =>
                    old?.map(app => app.id === variables.id ? { ...app, status: variables.status } : app)
                );
            }

            return { previousApplications, queryKey };
        },
        onError: (err: Error, variables: any, context: any) => {
            if (context?.queryKey && context?.previousApplications) {
                queryClient.setQueryData(context.queryKey, context.previousApplications);
            }
        },
        onSettled: (_data: any, _error: any, variables: { userId: string }) => {
            queryClient.invalidateQueries({ queryKey: [...CACHE_KEYS.applications, variables.userId] });
        },
    });
}

export function useCreateApplicationMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ userId, data }: { userId: string; data: Partial<Application> }) => {
            const now = new Date().toISOString();
            const app = {
                ...data,
                id: data.id || Math.random().toString(36).substr(2, 9),
                userId,
                createdAt: now,
                updatedAt: now,
                urgency: 'normal',
                attachments: data.attachments || [],
            } as Application;
            storageService.upsertApplication(userId, app);
            return enrichApplication(app);
        },
        onSuccess: (_data: Application, variables: { userId: string; data: Partial<Application> }) => {
            queryClient.invalidateQueries({ queryKey: [...CACHE_KEYS.applications, variables.userId] });
        },
    });
}

export function useUpdateApplicationMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, userId, data }: { id: string; userId: string; data: Partial<Application> }) => {
            const existing = storageService.getApplicationById(userId, id);
            if (!existing) throw new Error('Application not found');

            const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };
            storageService.upsertApplication(userId, updated as any);
            return enrichApplication(updated as any);
        },
        onSuccess: (_data: Application, variables: { id: string; userId: string; data: Partial<Application> }) => {
            queryClient.invalidateQueries({ queryKey: [...CACHE_KEYS.applications, variables.userId] });
        },
    });
}

export function useDeleteApplicationMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, userId }: { id: string; userId: string }) => {
            storageService.deleteApplication(userId, id);
            return id;
        },
        onMutate: async (variables: { id: string; userId: string }) => {
            const queryKey = [...CACHE_KEYS.applications, variables.userId];
            await queryClient.cancelQueries({ queryKey });
            const previousApplications = queryClient.getQueryData<Application[]>(queryKey);

            if (previousApplications) {
                queryClient.setQueryData<Application[]>(queryKey, (old: Application[] | undefined) =>
                    old?.filter(app => app.id !== variables.id)
                );
            }

            return { previousApplications, queryKey };
        },
        onError: (err: Error, variables: any, context: any) => {
            if (context?.queryKey && context?.previousApplications) {
                queryClient.setQueryData(context.queryKey, context.previousApplications);
            }
        },
        onSettled: (_data: any, _error: any, variables: { userId: string }) => {
            queryClient.invalidateQueries({ queryKey: [...CACHE_KEYS.applications, variables.userId] });
        },
    });
}

export function useBatchDeleteMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ ids, userId }: { ids: string[]; userId: string }) => {
            ids.forEach(id => storageService.deleteApplication(userId, id));
            return ids;
        },
        onMutate: async (variables: { ids: string[]; userId: string }) => {
            const queryKey = [...CACHE_KEYS.applications, variables.userId];
            await queryClient.cancelQueries({ queryKey });
            const previousApplications = queryClient.getQueryData<Application[]>(queryKey);

            if (previousApplications) {
                queryClient.setQueryData<Application[]>(queryKey, (old: Application[] | undefined) =>
                    old?.filter(app => !variables.ids.includes(app.id))
                );
            }

            return { previousApplications, queryKey };
        },
        onError: (err: Error, variables: any, context: any) => {
            if (context?.queryKey && context?.previousApplications) {
                queryClient.setQueryData(context.queryKey, context.previousApplications);
            }
        },
        onSettled: (_data: any, _error: any, variables: { userId: string }) => {
            queryClient.invalidateQueries({ queryKey: [...CACHE_KEYS.applications, variables.userId] });
        },
    });
} export function useBatchUpdateStatusMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ ids, userId, status }: { ids: string[]; userId: string; status: ApplicationStatus }) => {
            ids.forEach(id => {
                const existing = storageService.getApplicationById(userId, id);
                if (existing) {
                    storageService.upsertApplication(userId, { ...existing, status });
                }
            });
            return { ids, status };
        },
        onMutate: async (variables: { ids: string[]; userId: string; status: ApplicationStatus }) => {
            const queryKey = [...CACHE_KEYS.applications, variables.userId];
            await queryClient.cancelQueries({ queryKey });
            const previousApplications = queryClient.getQueryData<Application[]>(queryKey);

            if (previousApplications) {
                queryClient.setQueryData<Application[]>(queryKey, (old) =>
                    old?.map(app => variables.ids.includes(app.id) ? { ...app, status: variables.status } : app)
                );
            }

            return { previousApplications, queryKey };
        },
        onError: (err: Error, variables: any, context: any) => {
            if (context?.queryKey && context?.previousApplications) {
                queryClient.setQueryData(context.queryKey, context.previousApplications);
            }
        },
        onSettled: (_data: any, _error: any, variables: { userId: string }) => {
            queryClient.invalidateQueries({ queryKey: [...CACHE_KEYS.applications, variables.userId] });
        },
    });
}
