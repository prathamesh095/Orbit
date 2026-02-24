'use client';

import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    hint?: string;
    leftAddon?: React.ReactNode;
    rightAddon?: React.ReactNode;
    containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    (
        { label, error, hint, leftAddon, rightAddon, containerClassName, className, id, ...props },
        ref
    ) => {
        const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

        return (
            <div className={cn('flex flex-col gap-2', containerClassName)}>
                {label && (
                    <label
                        htmlFor={inputId}
                        className="text-sm font-medium text-text-primary dark:text-text-primary"
                    >
                        {label}
                        {props.required && <span className="text-danger ml-1">*</span>}
                    </label>
                )}
                <div className="relative flex items-center">
                    {leftAddon && (
                        <div className="absolute left-3 text-text-tertiary">{leftAddon}</div>
                    )}
                    <input
                        ref={ref}
                        id={inputId}
                        aria-invalid={!!error}
                        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
                        className={cn(
                            'w-full rounded-base border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary',
                            'transition-all duration-150',
                            'focus:outline-none focus:ring-2 focus:ring-blue-apple focus:ring-offset-2 focus:border-transparent',
                            'dark:focus:ring-offset-neutral-900',
                            'disabled:bg-neutral-50 disabled:text-text-disabled disabled:cursor-not-allowed dark:disabled:bg-neutral-800',
                            'hover:border-border-strong',
                            error
                                ? 'border-danger focus:ring-danger'
                                : 'border-border-default',
                            leftAddon ? 'pl-10' : '',
                            rightAddon ? 'pr-10' : '',
                            className
                        )}
                        {...props}
                    />
                    {rightAddon && (
                        <div className="absolute right-3 text-text-tertiary">{rightAddon}</div>
                    )}
                </div>
                {error && (
                    <p id={`${inputId}-error`} role="alert" className="text-xs text-danger font-medium">
                        {error}
                    </p>
                )}
                {hint && !error && (
                    <p id={`${inputId}-hint`} className="text-xs text-text-tertiary">
                        {hint}
                    </p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';
