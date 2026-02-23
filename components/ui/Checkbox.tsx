'use client';

import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

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
                <div className="relative mt-0.5">
                    <input
                        ref={ref}
                        type="checkbox"
                        id={inputId}
                        checked={checked}
                        className="sr-only"
                        {...props}
                    />
                    <div
                        className={cn(
                            'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors cursor-pointer',
                            checked
                                ? 'bg-blue-600 border-blue-600'
                                : 'bg-white border-gray-300 hover:border-gray-400',
                            error && 'border-red-400',
                            className
                        )}
                        onClick={() => {
                            const el = document.getElementById(inputId ?? '') as HTMLInputElement;
                            el?.click();
                        }}
                        aria-hidden="true"
                    >
                        {checked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                    </div>
                </div>
                {(label || description) && (
                    <div className="flex-1">
                        {label && (
                            <label htmlFor={inputId} className="text-sm font-medium text-gray-700 cursor-pointer">
                                {label}
                            </label>
                        )}
                        {description && (
                            <p className="text-xs text-gray-500 mt-0.5">{description}</p>
                        )}
                        {error && <p role="alert" className="text-xs text-red-600 mt-0.5">{error}</p>}
                    </div>
                )}
            </div>
        );
    }
);

Checkbox.displayName = 'Checkbox';
