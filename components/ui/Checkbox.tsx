'use client';

import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import { motion } from 'framer-motion';

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
    label?: string;
    description?: string;
    error?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
    ({ label, description, error, className, id, checked, ...props }, ref) => {
        const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

        return (
            <div className="flex items-start gap-3">
                <div className="relative mt-1 flex-shrink-0">
                    <input
                        ref={ref}
                        type="checkbox"
                        id={inputId}
                        checked={checked}
                        className="sr-only"
                        {...props}
                    />
                    <motion.div
                        initial={false}
                        animate={checked ? { scale: 1 } : { scale: 1 }}
                        className={cn(
                            'w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-150 cursor-pointer',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-apple focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-900',
                            checked
                                ? 'bg-blue-apple border-blue-apple dark:bg-blue-apple'
                                : 'bg-surface border-border-default hover:border-border-strong dark:bg-surface',
                            error && 'border-danger dark:border-danger',
                            className
                        )}
                        onClick={() => {
                            const el = document.getElementById(inputId ?? '') as HTMLInputElement;
                            el?.click();
                        }}
                        onKeyDown={(e: React.KeyboardEvent) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                const el = document.getElementById(inputId ?? '') as HTMLInputElement;
                                el?.click();
                            }
                        }}
                        role="button"
                        tabIndex={-1}
                    >
                        {checked && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ duration: 0.15 }}
                            >
                                <Check className="w-3 h-3 text-white dark:text-neutral-900" strokeWidth={3} />
                            </motion.div>
                        )}
                    </motion.div>
                </div>
                {(label || description) && (
                    <div className="flex-1">
                        {label && (
                            <label htmlFor={inputId} className="text-sm font-medium text-text-primary dark:text-text-primary cursor-pointer">
                                {label}
                            </label>
                        )}
                        {description && (
                            <p className="text-xs text-text-tertiary mt-1 dark:text-text-tertiary">{description}</p>
                        )}
                        {error && <p role="alert" className="text-xs text-danger font-medium mt-1 dark:text-danger">{error}</p>}
                    </div>
                )}
            </div>
        );
    }
);

Checkbox.displayName = 'Checkbox';
