'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Check, CheckCheck, Clock, AlertTriangle, BarChart, MessageSquare } from 'lucide-react';
import type { Notification, NotificationType } from '@/types';
import { formatRelativeDate, cn } from '@/lib/utils';
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
    follow_up: <Clock className="w-4 h-4 text-[#007AFF]" />,
    overdue: <AlertTriangle className="w-4 h-4 text-[#FF3B30]" />,
    reminder: <Bell className="w-4 h-4 text-[#FFCC00]" />,
    system: <BarChart className="w-4 h-4 text-[#8E8E93]" />,
    offer: <Check className="w-4 h-4 text-[#34C759]" />,
    interview: <MessageSquare className="w-4 h-4 text-[#FF9500]" />,
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
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                        className="fixed top-[72px] right-6 z-40 w-[360px] max-w-[calc(100vw-3rem)] glass-apple rounded-[24px] shadow-apple-lg overflow-hidden border border-[#000000]/05"
                        role="dialog"
                        aria-label="Notification center"
                    >
                        {/* Header */}
                        <div className="px-5 py-4 flex items-center justify-between border-b border-[#000000]/05 bg-white/50">
                            <div className="flex items-center gap-2.5">
                                <h3 className="text-[17px] font-semibold text-[#1D1D1F] tracking-tight">Notifications</h3>
                                {unread > 0 && (
                                    <span className="bg-[#007AFF] text-white text-[11px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                                        {unread}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                {unread > 0 && (
                                    <button
                                        onClick={onMarkAllRead}
                                        className="text-[13px] font-medium text-[#007AFF] hover:bg-[#007AFF]/10 px-2.5 py-1.5 rounded-lg transition-colors"
                                    >
                                        Mark All
                                    </button>
                                )}
                                <button
                                    onClick={onClose}
                                    className="p-1.5 rounded-full hover:bg-black/5 text-[#86868B] transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* List */}
                        <div className="max-h-[min(480px,70vh)] overflow-y-auto custom-scrollbar bg-white/30">
                            {notifications.length === 0 ? (
                                <div className="py-16 text-center">
                                    <div className="w-12 h-12 bg-[#F5F5F7] rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Bell className="w-6 h-6 text-[#D1D1D6]" />
                                    </div>
                                    <p className="text-[15px] font-semibold text-[#1D1D1F]">All caught up</p>
                                    <p className="text-[13px] text-[#86868B] mt-1">No new notifications.</p>
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
                                                <div className="px-5 py-2.5 bg-[#F5F5F7]/50 backdrop-blur-sm border-b border-[#000000]/03">
                                                    <span className="text-[11px] font-bold text-[#86868B] uppercase tracking-[0.05em]">{label}</span>
                                                </div>
                                                <div className="divide-y divide-[#000000]/03">
                                                    {items.map((n) => (
                                                        <div
                                                            key={n.id}
                                                            className={cn(
                                                                "group flex items-start gap-4 px-5 py-4 transition-all hover:bg-white/60 relative",
                                                                !n.read && "after:absolute after:left-1 after:top-1/2 after:-translate-y-1/2 after:w-1.5 after:h-1.5 after:bg-[#007AFF] after:rounded-full"
                                                            )}
                                                        >
                                                            <div className="mt-0.5 shrink-0 w-8 h-8 rounded-[10px] bg-[#F5F5F7] flex items-center justify-center shadow-apple-sm">
                                                                {NOTIF_ICONS[n.type]}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex justify-between items-start gap-2">
                                                                    <p className={cn(
                                                                        "text-[14px] leading-tight",
                                                                        !n.read ? "font-semibold text-[#1D1D1F]" : "font-medium text-[#424245]"
                                                                    )}>
                                                                        {n.title}
                                                                    </p>
                                                                    <span className="text-[11px] font-medium text-[#A1A1A6] tabular-nums shrink-0 mt-0.5">
                                                                        {formatRelativeDate(n.createdAt)}
                                                                    </span>
                                                                </div>
                                                                <p className="text-[13px] text-[#86868B] mt-1 leading-relaxed line-clamp-2">{n.message}</p>
                                                                {!n.read && (
                                                                    <button
                                                                        onClick={() => onMarkRead(n.id)}
                                                                        className="mt-2 text-[12px] font-semibold text-[#007AFF] opacity-0 group-hover:opacity-100 transition-opacity"
                                                                    >
                                                                        Mark as Read
                                                                    </button>
                                                                )}
                                                            </div>
                                                            <button
                                                                onClick={() => onDismiss(n.id)}
                                                                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-full hover:bg-black/5 text-[#86868B] transition-all shrink-0 mt-0.5"
                                                            >
                                                                <X className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
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
