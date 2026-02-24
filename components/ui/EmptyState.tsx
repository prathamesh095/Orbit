'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { SPRING } from '@/lib/motionTokens';

interface EmptyStateProps {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    action?: React.ReactNode;
    className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={SPRING.smooth}
            className={cn(
                'flex flex-col items-center justify-center text-center py-20 px-8 rounded-lg',
                'bg-surface dark:bg-surface',
                className
            )}
        >
            {icon && (
                <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={SPRING.snappy}
                    className="mb-6 text-text-tertiary dark:text-text-tertiary [&_svg]:w-16 [&_svg]:h-16 [&_svg]:stroke-[1.5]"
                >
                    {icon}
                </motion.div>
            )}
            <h3 className="text-lg font-semibold text-text-primary dark:text-text-primary tracking-tight mb-2">
                {title}
            </h3>
            {description && (
                <p className="text-base font-medium text-text-secondary dark:text-text-secondary max-w-sm leading-relaxed mb-8">
                    {description}
                </p>
            )}
            {action && (
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, ...SPRING.smooth, duration: undefined }}
                >
                    {action}
                </motion.div>
            )}
        </motion.div>
    );
}
