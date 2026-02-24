'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { SPRING } from '@/lib/motionTokens';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    padding?: 'none' | 'sm' | 'md' | 'lg';
    hover?: boolean;
    onClick?: () => void;
    interactive?: boolean;
}

const paddingStyles = {
    none: '',
    sm: 'p-3',
    md: 'p-6',
    lg: 'p-8',
};

export function Card({ children, className, padding = 'md', hover = false, onClick, interactive = false }: CardProps) {
    const Element = onClick || interactive ? motion.div : 'div';
    const motionProps = (onClick || interactive)
        ? {
            whileHover: { y: -2 },
            transition: SPRING.snappy,
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
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onClick();
                        }
                    }
                    : undefined
            }
            className={cn(
                'bg-surface rounded-lg border border-border-subtle shadow-elevation-2',
                'transition-all duration-150',
                'dark:bg-surface dark:border-border-subtle',
                (hover || interactive) && 'hover:shadow-elevation-3 dark:hover:shadow-elevation-4',
                onClick && 'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-apple focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-900',
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
        <div className={cn('border-b border-border-subtle pb-4 mb-4', className)}>
            {children}
        </div>
    );
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <h3 className={cn('text-lg font-semibold text-text-primary dark:text-text-primary', className)}>
            {children}
        </h3>
    );
}
