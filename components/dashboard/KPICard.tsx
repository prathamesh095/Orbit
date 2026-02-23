'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface KPICardProps {
    title: string;
    value: number | string;
    icon: ReactNode;
    iconBg?: string;
    trend?: string;
    trendPositive?: boolean;
    delay?: number;
}

export function KPICard({
    title,
    value,
    icon,
    iconBg = 'bg-blue-100',
    trend,
    trendPositive,
    delay = 0,
}: KPICardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay }}
            whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
            className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm"
        >
            <div className="flex items-start justify-between mb-4">
                <p className="text-sm font-medium text-gray-500">{title}</p>
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', iconBg)}>
                    {icon}
                </div>
            </div>
            <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3, delay: delay + 0.1, type: 'spring', stiffness: 200 }}
            >
                <p className="text-3xl font-bold text-gray-900">{value}</p>
            </motion.div>
            {trend && (
                <p className={cn('text-xs mt-2', trendPositive ? 'text-emerald-600' : 'text-gray-400')}>
                    {trend}
                </p>
            )}
        </motion.div>
    );
}
