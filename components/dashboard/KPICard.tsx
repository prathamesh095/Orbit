'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { SPRING, DURATION } from '@/lib/motionTokens';
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
    iconBg = 'bg-blue-apple/10',
    trend,
    trendPositive,
    delay = 0,
}: KPICardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...SPRING.smooth, delay }}
            whileHover={{ y: -4, transition: { duration: DURATION.fast } }}
            className={cn(
                'bg-surface dark:bg-surface rounded-lg border border-border-subtle dark:border-border-subtle',
                'p-6 shadow-elevation-2 hover:shadow-elevation-3 dark:hover:shadow-elevation-4',
                'transition-all duration-200'
            )}
        >
            <div className="flex items-start justify-between mb-4">
                <p className="text-xs font-medium text-text-tertiary dark:text-text-tertiary uppercase tracking-wider">
                    {title}
                </p>
                <motion.div
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: DURATION.fast }}
                    className={cn('w-10 h-10 rounded-md flex items-center justify-center', iconBg)}
                >
                    {icon}
                </motion.div>
            </div>
            <motion.div
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...SPRING.smooth, delay: delay + DURATION.fast }}
            >
                <p className="text-4xl font-semibold text-text-primary dark:text-text-primary tracking-tight tabular-nums">
                    {value}
                </p>
            </motion.div>
            {trend && (
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: DURATION.normal, delay: delay + DURATION.normal }}
                    className={cn(
                        'text-sm mt-3 font-medium',
                        trendPositive ? 'text-success dark:text-success' : 'text-text-tertiary dark:text-text-tertiary'
                    )}
                >
                    {trend}
                </motion.p>
            )}
        </motion.div>
    );
}
