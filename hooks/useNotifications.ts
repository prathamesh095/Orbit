'use client';

import { useState, useCallback, useEffect } from 'react';
import type { Notification } from '@/types';
import * as notificationService from '@/services/notifications/notificationService';

export function useNotifications(userId: string) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const refresh = useCallback(() => {
        if (!userId) return;
        notificationService.syncNotifications(userId);
        const visible = notificationService.getVisibleNotifications(userId);
        setNotifications(visible);
        setUnreadCount(notificationService.getUnreadCount(userId));
    }, [userId]);

    useEffect(() => {
        refresh();
        // Poll every 2 minutes for new notifications
        const interval = setInterval(refresh, 2 * 60 * 1000);
        return () => clearInterval(interval);
    }, [refresh]);

    const markRead = useCallback(
        (id: string) => {
            notificationService.markNotificationRead(userId, id);
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, read: true } : n))
            );
            setUnreadCount((c) => Math.max(0, c - 1));
        },
        [userId]
    );

    const markAllRead = useCallback(() => {
        notificationService.markAllRead(userId);
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
    }, [userId]);

    const dismiss = useCallback(
        (id: string) => {
            const wasUnread = notifications.find((n) => n.id === id && !n.read);
            notificationService.dismissNotification(userId, id);
            setNotifications((prev) => prev.filter((n) => n.id !== id));
            if (wasUnread) setUnreadCount((c) => Math.max(0, c - 1));
        },
        [userId, notifications]
    );

    return { notifications, unreadCount, refresh, markRead, markAllRead, dismiss };
}
