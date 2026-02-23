'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

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
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={cn(
                'flex flex-col items-center justify-center text-center py-16 px-6',
                className
            )}
        >
            {icon && (
                <div className="mb-4 text-gray-300 [&_svg]:w-16 [&_svg]:h-16">{icon}</div>
            )}
            <h3 className="text-lg font-semibold text-gray-700 mb-1">{title}</h3>
            {description && (
                <p className="text-sm text-gray-500 max-w-xs mb-6">{description}</p>
            )}
            {action && <div>{action}</div>}
        </motion.div>
    );
}
