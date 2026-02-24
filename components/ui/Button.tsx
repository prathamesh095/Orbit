'use client';

import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const SMOOTH_SPRING = { type: 'spring', stiffness: 400, damping: 30 };

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
        'bg-blue-600 text-white shadow-sm shadow-blue-200/50',
    secondary:
        'bg-neutral-100 text-neutral-800',
    ghost:
        'bg-transparent text-neutral-600',
    danger:
        'bg-red-600 text-white shadow-sm shadow-red-200/50',
    outline:
        'border border-neutral-200 bg-white text-neutral-700 shadow-sm shadow-neutral-100/50',
};

const sizeClasses: Record<ButtonSize, string> = {
    sm: 'h-8 px-3 text-sm gap-1.5',
    md: 'h-10 px-4 text-sm gap-2',
    lg: 'h-11 px-6 text-base gap-2',
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
                whileHover={{ scale: 1.015, y: -1 }}
                whileTap={{ scale: 0.985 }}
                transition={SMOOTH_SPRING}
                className={cn(
                    'inline-flex items-center justify-center font-bold rounded-xl transition-colors duration-200',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-1',
                    'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
                    variantClasses[variant],
                    sizeClasses[size],
                    className
                )}
                {...props as any}
            >
                {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                ) : (
                    leftIcon && <span className="shrink-0 transition-transform group-hover:scale-110">{leftIcon}</span>
                )}
                <span className="relative z-10">{children}</span>
                {!isLoading && rightIcon && (
                    <span className="shrink-0 transition-transform group-hover:scale-110">{rightIcon}</span>
                )}
            </motion.button>
        );
    }
);

Button.displayName = 'Button';
