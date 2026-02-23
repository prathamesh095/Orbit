'use client';

import { useState } from 'react';
import { Menu, Search } from 'lucide-react';
import { NotificationBell } from '@/components/ui/NotificationBell';
import { useAuth } from '@/lib/authContext';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationPanel } from '@/components/notifications/NotificationPanel';

interface HeaderProps {
    onMenuClick: () => void;
    title?: string;
}

export function Header({ onMenuClick, title = 'Dashboard' }: HeaderProps) {
    const { user } = useAuth();
    const { unreadCount, notifications, markRead, markAllRead, dismiss } = useNotifications(
        user?.id ?? ''
    );
    const [notifOpen, setNotifOpen] = useState(false);

    return (
        <>
            <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-20">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onMenuClick}
                        className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100"
                        aria-label="Toggle menu"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                    <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
                </div>

                <div className="flex items-center gap-2">
                    <NotificationBell
                        unreadCount={unreadCount}
                        onClick={() => setNotifOpen((v) => !v)}
                        active={notifOpen}
                    />
                    {user && (
                        <div className="flex items-center gap-2 ml-2">
                            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                                <span className="text-xs font-bold text-white">
                                    {user.name.charAt(0).toUpperCase()}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </header>

            <NotificationPanel
                isOpen={notifOpen}
                onClose={() => setNotifOpen(false)}
                notifications={notifications}
                onMarkRead={markRead}
                onMarkAllRead={markAllRead}
                onDismiss={dismiss}
            />
        </>
    );
}
