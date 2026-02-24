'use client';

import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const SMOOTH_SPRING = { type: 'spring', stiffness: 500, damping: 30 };

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
        'bg-[#007AFF] text-white shadow-apple-sm hover:bg-[#0062CC]',
    secondary:
        'bg-[#F2F2F7] text-[#1D1D1F] hover:bg-[#E5E5EA]',
    ghost:
        'bg-transparent text-[#007AFF] hover:bg-[#007AFF]/5',
    danger:
        'bg-[#FF3B30] text-white shadow-apple-sm hover:bg-[#D70015]',
    outline:
        'border border-[#D1D1D6] bg-white text-[#1D1D1F] shadow-apple-sm hover:bg-[#F2F2F7]',
};

const sizeClasses: Record<ButtonSize, string> = {
    sm: 'h-8 px-3 text-[13px] gap-1.5',
    md: 'h-10 px-4 text-[14px] gap-2',
    lg: 'h-11 px-6 text-[16px] gap-2.5',
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
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                transition={SMOOTH_SPRING}
                className={cn(
                    'inline-flex items-center justify-center font-medium rounded-[14px] transition-all duration-150 active:duration-75',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF]/40 focus-visible:ring-offset-1',
                    'disabled:opacity-40 disabled:cursor-not-allowed',
                    'tap-active',
                    variantClasses[variant],
                    sizeClasses[size],
                    className
                )}
                {...props as any}
            >
                {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                ) : (
                    leftIcon && <span className="shrink-0">{leftIcon}</span>
                )}
                <span className="relative z-10">{children}</span>
                {!isLoading && rightIcon && (
                    <span className="shrink-0">{rightIcon}</span>
                )}
            </motion.button>
        );
    }
);

Button.displayName = 'Button';
