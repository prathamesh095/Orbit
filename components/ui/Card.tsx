'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    padding?: 'none' | 'sm' | 'md' | 'lg';
    hover?: boolean;
    onClick?: () => void;
}

const paddingStyles = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
};

export function Card({ children, className, padding = 'md', hover = false, onClick }: CardProps) {
    const Element = onClick ? motion.div : 'div';
    const motionProps = onClick
        ? {
            whileHover: { y: -2, boxShadow: '0 8px 24px rgba(0,0,0,0.1)' },
            transition: { duration: 0.15 },
        }
        : {};

    return (
        <Element
            onClick={onClick}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
            onKeyDown={
                onClick
                    ? (e: React.KeyboardEvent) => {
                        if (e.key === 'Enter' || e.key === ' ') onClick();
                    }
                    : undefined
            }
            className={cn(
                'bg-white rounded-xl border border-gray-200 shadow-sm',
                hover && 'hover:shadow-md transition-shadow duration-200',
                onClick && 'cursor-pointer',
                paddingStyles[padding],
                className
            )}
            {...(motionProps as Record<string, unknown>)}
        >
            {children}
        </Element>
    );
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={cn('border-b border-gray-100 pb-4 mb-4', className)}>
            {children}
        </div>
    );
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <h3 className={cn('text-lg font-semibold text-gray-900', className)}>
            {children}
        </h3>
    );
}
