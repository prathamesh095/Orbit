'use client';

import { useState, useCallback, useEffect } from 'react';
import type { Application, ApplicationFormData, ApplicationStatus } from '@/types';
import * as storageService from '@/services/storage/storageService';
import { generateId } from '@/lib/utils';

export interface PipelineDataState {
    applications: Application[];
    isLoading: boolean;
    error: Error | null;
}

export function usePipelineData(userId: string) {
    const [state, setState] = useState<PipelineDataState>({
        applications: [],
        isLoading: true,
        error: null,
    });

    const fetchApplications = useCallback(() => {
        if (!userId) {
            setState(prev => ({ ...prev, isLoading: false }));
            return;
        }

        setState(prev => ({ ...prev, isLoading: true }));

        // Simulating async fetching to prepare for future backend
        setTimeout(() => {
            try {
                const apps = storageService.getApplications(userId);
                setState({
                    applications: apps,
                    isLoading: false,
                    error: null,
                });
            } catch (err) {
                setState({
                    applications: [],
                    isLoading: false,
                    error: err instanceof Error ? err : new Error('Failed to fetch applications'),
                });
            }
        }, 100);
    }, [userId]);

    useEffect(() => {
        fetchApplications();
    }, [fetchApplications]);

    const createApplication = useCallback(async (data: ApplicationFormData): Promise<Application> => {
        const now = new Date().toISOString();
        const app = {
            ...data,
            id: generateId(),
            userId,
            createdAt: now,
            updatedAt: now,
            urgency: 'normal', // Initial value, will be updated by service/utils
            attachments: data.attachments ?? [],
        } as Application;

        storageService.upsertApplication(userId, app);
        setState(prev => ({
            ...prev,
            applications: [app, ...prev.applications]
        }));
        return app;
    }, [userId]);

    const updateApplication = useCallback(async (id: string, data: Partial<ApplicationFormData>): Promise<Application | null> => {
        const existing = storageService.getApplicationById(userId, id);
        if (!existing) return null;

        const updated = {
            ...existing,
            ...data,
            updatedAt: new Date().toISOString(),
        } as Application;

        storageService.upsertApplication(userId, updated);
        setState(prev => ({
            ...prev,
            applications: prev.applications.map(a => a.id === id ? updated : a)
        }));
        return updated;
    }, [userId]);

    const deleteApplication = useCallback(async (id: string) => {
        storageService.deleteApplication(userId, id);
        setState(prev => ({
            ...prev,
            applications: prev.applications.filter(a => a.id !== id)
        }));
    }, [userId]);

    const batchDeleteApplications = useCallback(async (ids: string[]) => {
        ids.forEach(id => storageService.deleteApplication(userId, id));
        setState(prev => ({
            ...prev,
            applications: prev.applications.filter(a => !ids.includes(a.id))
        }));
    }, [userId]);

    const updateStatus = useCallback(async (id: string, status: ApplicationStatus) => {
        return updateApplication(id, { status } as any);
    }, [updateApplication]);

    const batchUpdateStatus = useCallback(async (ids: string[], status: ApplicationStatus) => {
        const affected: Application[] = [];
        ids.forEach(id => {
            const existing = storageService.getApplicationById(userId, id);
            if (existing) {
                const updated = { ...existing, status, updatedAt: new Date().toISOString() } as Application;
                storageService.upsertApplication(userId, updated);
                affected.push(updated);
            }
        });

        setState(prev => ({
            ...prev,
            applications: prev.applications.map(a => {
                const match = affected.find(upd => upd.id === a.id);
                return match || a;
            })
        }));
    }, [userId]);

    return {
        ...state,
        refresh: fetchApplications,
        createApplication,
        updateApplication,
        deleteApplication,
        updateStatus,
        batchDeleteApplications,
        batchUpdateStatus,
    };
}
