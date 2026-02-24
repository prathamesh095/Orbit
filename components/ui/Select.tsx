'use client';

import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

interface SelectOption {
    value: string;
    label: string;
    disabled?: boolean;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    hint?: string;
    options: SelectOption[];
    placeholder?: string;
    containerClassName?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
    (
        { label, error, hint, options, placeholder, containerClassName, className, id, ...props },
        ref
    ) => {
        const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

        return (
            <div className={cn('flex flex-col gap-2', containerClassName)}>
                {label && (
                    <label htmlFor={inputId} className="text-sm font-medium text-text-primary dark:text-text-primary">
                        {label}
                        {props.required && <span className="text-danger ml-1">*</span>}
                    </label>
                )}
                <div className="relative">
                    <select
                        ref={ref}
                        id={inputId}
                        aria-invalid={!!error}
                        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
                        className={cn(
                            'w-full appearance-none rounded-base border bg-surface px-3 py-2 pr-10 text-sm text-text-primary placeholder:text-text-tertiary transition-all duration-150',
                            'focus:outline-none focus:ring-2 focus:ring-blue-apple focus:ring-offset-2 focus:border-transparent',
                            'dark:focus:ring-offset-neutral-900 dark:bg-surface',
                            'disabled:bg-neutral-50 disabled:text-text-disabled disabled:cursor-not-allowed dark:disabled:bg-neutral-800',
                            'hover:border-border-strong',
                            error
                                ? 'border-danger focus:ring-danger'
                                : 'border-border-default',
                            className
                        )}
                        {...props}
                    >
                        {placeholder && (
                            <option value="" disabled>
                                {placeholder}
                            </option>
                        )}
                        {options.map((opt) => (
                            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none dark:text-text-tertiary" />
                </div>
                {error && <p id={`${inputId}-error`} role="alert" className="text-xs text-danger font-medium dark:text-danger">{error}</p>}
                {hint && !error && <p id={`${inputId}-hint`} className="text-xs text-text-tertiary dark:text-text-tertiary">{hint}</p>}
            </div>
        );
    }
);

Select.displayName = 'Select';
