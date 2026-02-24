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
            initial={{ opacity: 0, scale: 0.98, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className={cn(
                'flex flex-col items-center justify-center text-center py-20 px-8',
                className
            )}
        >
            {icon && (
                <div className="mb-6 text-[#D1D1D6] [&_svg]:w-16 [&_svg]:h-16 [&_svg]:stroke-[1.5]">
                    {icon}
                </div>
            )}
            <h3 className="text-[17px] font-semibold text-[#1D1D1F] tracking-tight mb-2">{title}</h3>
            {description && (
                <p className="text-[15px] font-medium text-[#86868B] max-w-[280px] leading-relaxed mb-8">
                    {description}
                </p>
            )}
            {action && <div className="animate-fade-in">{action}</div>}
        </motion.div>
    );
}
