'use client';

import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { SPRING } from '@/lib/motionTokens';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
    primary:
        'bg-blue-apple text-white shadow-elevation-2 hover:bg-blue-hover active:bg-blue-active dark:bg-blue-apple dark:hover:bg-blue-hover',
    secondary:
        'bg-neutral-100 text-text-primary hover:bg-neutral-200 dark:bg-neutral-800 dark:text-text-primary dark:hover:bg-neutral-700',
    ghost:
        'bg-transparent text-blue-apple hover:bg-blue-apple/5 dark:hover:bg-blue-apple/10',
    danger:
        'bg-danger text-white shadow-elevation-2 hover:bg-red-600 active:bg-red-700 dark:hover:bg-red-700',
    outline:
        'border border-border-default bg-surface text-text-primary shadow-elevation-1 hover:bg-neutral-50 dark:border-border-default dark:hover:bg-neutral-900',
};

const sizeClasses: Record<ButtonSize, string> = {
    sm: 'h-8 px-3 text-xs gap-1.5',
    md: 'h-10 px-4 text-sm gap-2',
    lg: 'h-11 px-6 text-base gap-2.5',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            variant = 'primary',
            size = 'md',
            isLoading = false,
            leftIcon,
            rightIcon,
            disabled,
            children,
            className,
            ...props
        },
        ref
    ) => {
        return (
            <motion.button
                ref={ref as any}
                disabled={disabled || isLoading}
                whileHover={!disabled ? { scale: 1.02 } : {}}
                whileTap={!disabled ? { scale: 0.98 } : {}}
                transition={SPRING.snappy}
                className={cn(
                    'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-apple focus-visible:ring-offset-2',
                    'dark:focus-visible:ring-offset-neutral-900',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    'active:duration-75',
                    variantClasses[variant],
                    sizeClasses[size],
                    className
                )}
                {...props as any}
            >
                {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                ) : (
                    leftIcon && <span className="shrink-0">{leftIcon}</span>
                )}
                <span>{children}</span>
                {!isLoading && rightIcon && (
                    <span className="shrink-0">{rightIcon}</span>
                )}
            </motion.button>
        );
    }
);

Button.displayName = 'Button';
