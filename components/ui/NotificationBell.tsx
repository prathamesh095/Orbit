'use client';

import React from 'react';
import { Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface NotificationBellProps {
    unreadCount: number;
    onClick: () => void;
    active?: boolean;
}

export function NotificationBell({ unreadCount, onClick, active = false }: NotificationBellProps) {
    return (
        <button
            onClick={onClick}
            aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
            className={cn(
                'relative p-2 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
                active ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
            )}
        >
            <Bell className="w-5 h-5" />
            <AnimatePresence>
                {unreadCount > 0 && (
                    <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center"
                        aria-hidden="true"
                    >
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </motion.span>
                )}
            </AnimatePresence>
        </button>
    );
}
