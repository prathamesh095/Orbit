'use client';

import { useAuth } from '@/lib/authContext';
import { useNotifications } from '@/hooks/useNotifications';
import { formatRelativeDate } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import {
    Bell, Check, X, Clock, AlertTriangle,
    BarChart, CheckCheck, Inbox
} from 'lucide-react';
import type { NotificationType, Notification } from '@/types';
import { motion } from 'framer-motion';

const NOTIF_ICONS: Record<NotificationType, React.ReactNode> = {
    follow_up: <Clock className="w-5 h-5 text-blue-500" />,
    overdue: <AlertTriangle className="w-5 h-5 text-red-500" />,
    reminder: <Bell className="w-5 h-5 text-amber-500" />,
    system: <BarChart className="w-5 h-5 text-gray-500" />,
    offer: <Check className="w-5 h-5 text-emerald-500" />,
    interview: <BarChart className="w-5 h-5 text-amber-500" />,
};

export default function NotificationsPage() {
    const { user } = useAuth();
    const {
        notifications,
        unreadCount,
        markRead,
        markAllRead,
        dismiss
    } = useNotifications(user?.id ?? '');

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

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Notifications</h2>
                    <p className="text-sm text-gray-500">Alerts, follow-ups, and pipeline changes</p>
                </div>
                {unreadCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={markAllRead}>
                        Mark all as read
                    </Button>
                )}
            </div>

            {notifications.length === 0 ? (
                <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm py-20 text-center">
                    <div className="w-16 h-16 bg-neutral-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-neutral-300">
                        <Inbox size={32} />
                    </div>
                    <h3 className="text-gray-900 font-semibold mb-1">All caught up!</h3>
                    <p className="text-gray-500 text-sm">No new notifications at this time.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {Object.entries(groups).map(([label, items]) => {
                        if (items.length === 0) return null;
                        return (
                            <div key={label} className="space-y-3">
                                <h3 className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest px-1">
                                    {label}
                                </h3>
                                <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden divide-y divide-neutral-50">
                                    {items.map((n, i) => (
                                        <motion.div
                                            key={n.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            className={`flex items-start gap-4 p-4 hover:bg-neutral-50/50 transition-colors ${!n.read ? 'bg-blue-50/30' : ''}`}
                                        >
                                            <div className="shrink-0 pt-0.5">
                                                {NOTIF_ICONS[n.type]}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <p className={`text-[14px] ${!n.read ? 'font-bold text-neutral-900' : 'text-neutral-700'}`}>
                                                        {n.title}
                                                    </p>
                                                    <span className="text-[11px] text-neutral-400 font-medium whitespace-nowrap">
                                                        {formatRelativeDate(n.createdAt)}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                                                    {n.message}
                                                </p>
                                                {!n.read && (
                                                    <button
                                                        onClick={() => markRead(n.id)}
                                                        className="mt-2 text-[11px] font-bold text-blue-600 hover:text-blue-700"
                                                    >
                                                        Mark as read
                                                    </button>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => dismiss(n.id)}
                                                className="shrink-0 p-1 rounded-lg text-neutral-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                <X size={16} />
                                            </button>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
