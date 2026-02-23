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
            <div className={cn('flex flex-col gap-1', containerClassName)}>
                {label && (
                    <label
                        htmlFor={inputId}
                        className="text-sm font-medium text-gray-700"
                    >
                        {label}
                        {props.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                )}
                <div className="relative flex items-center">
                    {leftAddon && (
                        <div className="absolute left-3 text-gray-400">{leftAddon}</div>
                    )}
                    <input
                        ref={ref}
                        id={inputId}
                        aria-invalid={!!error}
                        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
                        className={cn(
                            'w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 transition-colors',
                            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                            'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
                            error
                                ? 'border-red-400 focus:ring-red-400 focus:border-red-400'
                                : 'border-gray-300 hover:border-gray-400',
                            leftAddon ? 'pl-10' : '',
                            rightAddon ? 'pr-10' : '',
                            className
                        )}
                        {...props}
                    />
                    {rightAddon && (
                        <div className="absolute right-3 text-gray-400">{rightAddon}</div>
                    )}
                </div>
                {error && (
                    <p id={`${inputId}-error`} role="alert" className="text-xs text-red-600">
                        {error}
                    </p>
                )}
                {hint && !error && (
                    <p id={`${inputId}-hint`} className="text-xs text-gray-500">
                        {hint}
                    </p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';
