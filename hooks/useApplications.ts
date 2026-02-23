'use client';

import { useState, useCallback } from 'react';
import type { Application, ApplicationFormData } from '@/types';
import * as storageService from '@/services/storage/storageService';
import { classifyUrgency, generateId } from '@/lib/utils';
import { appendExecutionLog } from '@/services/storage/storageService';

function enrichApplication(app: Application): Application {
    return { ...app, urgency: classifyUrgency(app) };
}

export function useApplications(userId: string) {
    const [applications, setApplications] = useState<Application[]>(() => {
        if (!userId) return [];
        return storageService.getApplications(userId).map(enrichApplication);
    });

    const refresh = useCallback(() => {
        if (!userId) return;
        setApplications(storageService.getApplications(userId).map(enrichApplication));
    }, [userId]);

    const createApplication = useCallback(
        (data: ApplicationFormData): Application => {
            const now = new Date().toISOString();
            const app: Application = {
                ...data,
                id: generateId(),
                userId,
                attachments: data.attachments ?? [],
                createdAt: now,
                updatedAt: now,
                urgency: 'normal',
            };
            app.urgency = classifyUrgency(app);
            storageService.upsertApplication(userId, app);
            appendExecutionLog(userId, {
                id: generateId(),
                applicationId: app.id,
                action: 'created',
                newValue: app.status,
                timestamp: now,
            });
            setApplications((prev) => [app, ...prev]);
            return app;
        },
        [userId]
    );

    const updateApplication = useCallback(
        (id: string, data: Partial<ApplicationFormData>): Application | null => {
            const existing = storageService.getApplicationById(userId, id);
            if (!existing) return null;
            const now = new Date().toISOString();
            const updated: Application = {
                ...existing,
                ...data,
                attachments: data.attachments ?? existing.attachments,
                id,
                userId,
                updatedAt: now,
                urgency: 'normal',
            };
            updated.urgency = classifyUrgency(updated);
            storageService.upsertApplication(userId, updated);
            if (data.status && data.status !== existing.status) {
                appendExecutionLog(userId, {
                    id: generateId(),
                    applicationId: id,
                    action: 'status_changed',
                    previousValue: existing.status,
                    newValue: data.status,
                    timestamp: now,
                });
            }
            setApplications((prev) =>
                prev.map((a) => (a.id === id ? updated : a))
            );
            return updated;
        },
        [userId]
    );

    const deleteApplication = useCallback(
        (id: string) => {
            storageService.deleteApplication(userId, id);
            appendExecutionLog(userId, {
                id: generateId(),
                applicationId: id,
                action: 'deleted',
                timestamp: new Date().toISOString(),
            });
            setApplications((prev) => prev.filter((a) => a.id !== id));
        },
        [userId]
    );

    const updateStatus = useCallback(
        (id: string, status: Application['status']) => {
            return updateApplication(id, { status });
        },
        [updateApplication]
    );

    return {
        applications,
        refresh,
        createApplication,
        updateApplication,
        deleteApplication,
        updateStatus,
    };
}
