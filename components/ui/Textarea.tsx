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
            <div className={cn('flex flex-col gap-1', containerClassName)}>
                {label && (
                    <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
                        {label}
                        {props.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                )}
                <textarea
                    ref={handleRef}
                    id={inputId}
                    value={value}
                    onChange={onChange}
                    aria-invalid={!!error}
                    aria-describedby={error ? `${inputId}-error` : undefined}
                    className={cn(
                        'w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 transition-colors resize-none',
                        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                        'disabled:bg-gray-50 disabled:cursor-not-allowed',
                        error
                            ? 'border-red-400 focus:ring-red-400'
                            : 'border-gray-300 hover:border-gray-400',
                        className
                    )}
                    {...props}
                />
                <div className="flex justify-between">
                    {error ? (
                        <p id={`${inputId}-error`} role="alert" className="text-xs text-red-600">
                            {error}
                        </p>
                    ) : hint ? (
                        <p className="text-xs text-gray-500">{hint}</p>
                    ) : (
                        <span />
                    )}
                    {maxChars && (
                        <p className={cn('text-xs', charCount > maxChars ? 'text-red-500' : 'text-gray-400')}>
                            {charCount}/{maxChars}
                        </p>
                    )}
                </div>
            </div>
        );
    }
);

Textarea.displayName = 'Textarea';
