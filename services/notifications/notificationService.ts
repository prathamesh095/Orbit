'use client';

import type { Notification, Application } from '@/types';
import {
    getNotifications,
    saveNotifications,
    getApplications,
} from '@/services/storage/storageService';

function generateId(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Scans all applications and generates relevant notifications:
 * - Overdue follow-ups
 * - Due-today follow-ups
 * - Currently interviewing
 */
export function syncNotifications(userId: string): void {
    if (typeof window === 'undefined') return;

    const apps = getApplications(userId);
    const existing = getNotifications(userId);
    const existingIds = new Set(existing.map((n) => n.applicationId + ':' + n.type));

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const newNotifications: Notification[] = [];

    for (const app of apps) {
        if (app.status === 'rejected' || app.status === 'offer') continue;

        // Overdue follow-up
        if (app.nextFollowUp && app.nextFollowUp < todayStr && !app.followUpSent) {
            const key = `${app.id}:overdue`;
            if (!existingIds.has(key)) {
                newNotifications.push({
                    id: generateId(),
                    userId,
                    type: 'overdue',
                    title: 'Overdue Follow-up',
                    message: `Follow-up for ${app.company} — ${app.roleTitle} is overdue since ${app.nextFollowUp}.`,
                    applicationId: app.id,
                    read: false,
                    dismissed: false,
                    createdAt: new Date().toISOString(),
                });
                existingIds.add(key);
            }
        }

        // Due today
        if (app.nextFollowUp === todayStr && !app.followUpSent) {
            const key = `${app.id}:follow_up`;
            if (!existingIds.has(key)) {
                newNotifications.push({
                    id: generateId(),
                    userId,
                    type: 'follow_up',
                    title: 'Follow-up Due Today',
                    message: `Time to follow up with ${app.company} for ${app.roleTitle}.`,
                    applicationId: app.id,
                    read: false,
                    dismissed: false,
                    createdAt: new Date().toISOString(),
                });
                existingIds.add(key);
            }
        }

        // Interviewing reminder
        if (app.status === 'interviewing') {
            const key = `${app.id}:interview`;
            if (!existingIds.has(key)) {
                newNotifications.push({
                    id: generateId(),
                    userId,
                    type: 'interview',
                    title: 'Active Interview',
                    message: `You're in the interview stage with ${app.company} for ${app.roleTitle}.`,
                    applicationId: app.id,
                    read: false,
                    dismissed: false,
                    createdAt: new Date().toISOString(),
                });
                existingIds.add(key);
            }
        }
    }

    if (newNotifications.length > 0) {
        // Prepend new notifications, most recent first
        saveNotifications(userId, [...newNotifications, ...existing]);
    }
}

export function markNotificationRead(userId: string, notificationId: string): void {
    const notifications = getNotifications(userId).map((n) =>
        n.id === notificationId ? { ...n, read: true } : n
    );
    saveNotifications(userId, notifications);
}

export function markAllRead(userId: string): void {
    const notifications = getNotifications(userId).map((n) => ({ ...n, read: true }));
    saveNotifications(userId, notifications);
}

export function dismissNotification(userId: string, notificationId: string): void {
    const notifications = getNotifications(userId).map((n) =>
        n.id === notificationId
            ? { ...n, dismissed: true, dismissedAt: new Date().toISOString() }
            : n
    );
    saveNotifications(userId, notifications);
}

export function getUnreadCount(userId: string): number {
    return getNotifications(userId).filter((n) => !n.read && !n.dismissed).length;
}

export function getVisibleNotifications(userId: string): Notification[] {
    return getNotifications(userId).filter((n) => !n.dismissed);
}
