'use client';

import React, { forwardRef, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
    hint?: string;
    autoResize?: boolean;
    maxChars?: number;
    containerClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
    (
        { label, error, hint, autoResize = false, maxChars, containerClassName, className, id, value, onChange, ...props },
        ref
    ) => {
        const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
        const internalRef = useRef<HTMLTextAreaElement | null>(null);

        const handleRef = (el: HTMLTextAreaElement | null) => {
            internalRef.current = el;
            if (typeof ref === 'function') ref(el);
            else if (ref) (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = el;
        };

        useEffect(() => {
            if (autoResize && internalRef.current) {
                internalRef.current.style.height = 'auto';
                internalRef.current.style.height = `${internalRef.current.scrollHeight}px`;
            }
        }, [value, autoResize]);

        const charCount = typeof value === 'string' ? value.length : 0;

        return (
            <div className={cn('flex flex-col gap-2', containerClassName)}>
                {label && (
                    <label htmlFor={inputId} className="text-sm font-medium text-text-primary dark:text-text-primary">
                        {label}
                        {props.required && <span className="text-danger ml-1">*</span>}
                    </label>
                )}
                <textarea
                    ref={handleRef}
                    id={inputId}
                    value={value}
                    onChange={onChange}
                    aria-invalid={!!error}
                    aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
                    className={cn(
                        'w-full rounded-base border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary transition-all duration-150 resize-none',
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
                />
                <div className="flex justify-between items-center gap-2">
                    <div>
                        {error ? (
                            <p id={`${inputId}-error`} role="alert" className="text-xs text-danger font-medium dark:text-danger">
                                {error}
                            </p>
                        ) : hint ? (
                            <p id={`${inputId}-hint`} className="text-xs text-text-tertiary dark:text-text-tertiary">{hint}</p>
                        ) : null}
                    </div>
                    {maxChars && (
                        <p className={cn('text-xs flex-shrink-0', charCount > maxChars ? 'text-danger dark:text-danger font-medium' : 'text-text-tertiary dark:text-text-tertiary')}>
                            {charCount}/{maxChars}
                        </p>
                    )}
                </div>
            </div>
        );
    }
);

Textarea.displayName = 'Textarea';
