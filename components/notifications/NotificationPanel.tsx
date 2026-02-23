'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Check, CheckCheck, Clock, AlertTriangle, BarChart } from 'lucide-react';
import type { Notification, NotificationType } from '@/types';
import { formatRelativeDate } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

interface NotificationPanelProps {
    isOpen: boolean;
    onClose: () => void;
    notifications: Notification[];
    onMarkRead: (id: string) => void;
    onMarkAllRead: () => void;
    onDismiss: (id: string) => void;
}

const NOTIF_ICONS: Record<NotificationType, React.ReactNode> = {
    follow_up: <Clock className="w-4 h-4 text-blue-500" />,
    overdue: <AlertTriangle className="w-4 h-4 text-red-500" />,
    reminder: <Bell className="w-4 h-4 text-amber-500" />,
    system: <BarChart className="w-4 h-4 text-gray-500" />,
    offer: <Check className="w-4 h-4 text-emerald-500" />,
    interview: <BarChart className="w-4 h-4 text-amber-500" />,
};

export function NotificationPanel({
    isOpen,
    onClose,
    notifications,
    onMarkRead,
    onMarkAllRead,
    onDismiss,
}: NotificationPanelProps) {
    const unread = notifications.filter((n) => !n.read).length;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-30"
                        onClick={onClose}
                        aria-hidden="true"
                    />
                    {/* Panel */}
                    <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.98 }}
                        transition={{ duration: 0.15 }}
                        className="fixed top-[68px] right-4 z-40 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
                        role="dialog"
                        aria-label="Notification center"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                            <div className="flex items-center gap-2">
                                <Bell className="w-4 h-4 text-gray-600" />
                                <span className="font-semibold text-gray-900 text-sm">Notifications</span>
                                {unread > 0 && (
                                    <span className="w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                        {unread}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-1">
                                {unread > 0 && (
                                    <button
                                        onClick={onMarkAllRead}
                                        className="text-xs text-blue-600 hover:text-blue-700 px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors"
                                    >
                                        Mark all read
                                    </button>
                                )}
                                <button
                                    onClick={onClose}
                                    aria-label="Close notifications"
                                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
// ─── Grouping Logic ─────────────────────────────────────────
                        {/* List */}
                        <div className="max-h-80 overflow-y-auto custom-scrollbar">
                            {notifications.length === 0 ? (
                                <div className="py-10 text-center">
                                    <CheckCheck className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                                    <p className="text-sm text-neutral-500">You&apos;re all caught up!</p>
                                </div>
                            ) : (
                                (() => {
                                    const now = new Date();
                                    const today = now.toISOString().split('T')[0];
                                    const yesterday = new Date(now.setDate(now.getDate() - 1)).toISOString().split('T')[0];

                                    const groups: Record<string, Notification[]> = { Today: [], Yesterday: [], Earlier: [] };

                                    notifications.forEach(n => {
                                        const d = n.createdAt.split('T')[0];
                                        if (d === today) groups.Today.push(n);
                                        else if (d === yesterday) groups.Yesterday.push(n);
                                        else groups.Earlier.push(n);
                                    });

                                    return Object.entries(groups).map(([label, items]) => {
                                        if (items.length === 0) return null;
                                        return (
                                            <div key={label}>
                                                <div className="bg-neutral-50/80 px-4 py-1.5 border-y border-neutral-100/50">
                                                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{label}</span>
                                                </div>
                                                {items.map((n) => (
                                                    <div
                                                        key={n.id}
                                                        className={`flex items-start gap-3 px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${!n.read ? 'bg-blue-50/40' : ''}`}
                                                    >
                                                        <div className="mt-0.5 shrink-0">
                                                            {NOTIF_ICONS[n.type]}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className={`text-sm ${!n.read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                                                                {n.title}
                                                            </p>
                                                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                                                            <p className="text-[10px] text-neutral-400 mt-1 uppercase font-medium">{formatRelativeDate(n.createdAt)}</p>
                                                        </div>
                                                        <div className="flex flex-col gap-1 shrink-0">
                                                            {!n.read && (
                                                                <button
                                                                    onClick={() => onMarkRead(n.id)}
                                                                    title="Mark as read"
                                                                    className="w-6 h-6 flex items-center justify-center rounded-md text-neutral-400 hover:text-blue-500 hover:bg-white transition-all shadow-sm active:scale-95"
                                                                >
                                                                    <Check className="w-3.5 h-3.5" />
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => onDismiss(n.id)}
                                                                title="Dismiss"
                                                                className="w-6 h-6 flex items-center justify-center rounded-md text-neutral-400 hover:text-red-500 hover:bg-white transition-all shadow-sm active:scale-95"
                                                            >
                                                                <X className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    });
                                })()
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
