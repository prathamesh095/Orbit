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
    iconBg = 'bg-[#007AFF]/5',
    trend,
    trendPositive,
    delay = 0,
}: KPICardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay, ease: [0.23, 1, 0.32, 1] }}
            whileHover={{ y: -4 }}
            className="bg-white rounded-[22px] border border-[#000000]/05 p-6 shadow-apple-md transition-shadow hover:shadow-apple-lg"
        >
            <div className="flex items-start justify-between mb-4">
                <p className="text-[13px] font-medium text-[#86868B] uppercase tracking-wider">{title}</p>
                <div className={cn('w-10 h-10 rounded-[12px] flex items-center justify-center', iconBg)}>
                    {icon}
                </div>
            </div>
            <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: delay + 0.1, ease: [0.23, 1, 0.32, 1] }}
            >
                <p className="text-[32px] font-semibold text-[#1D1D1F] tracking-tight tabular-nums">{value}</p>
            </motion.div>
            {trend && (
                <p className={cn('text-[13px] mt-2 font-medium', trendPositive ? 'text-[#34C759]' : 'text-[#86868B]')}>
                    {trend}
                </p>
            )}
        </motion.div>
    );
}
