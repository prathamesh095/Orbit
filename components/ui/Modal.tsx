'use client';

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SPRING } from '@/lib/motionTokens';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    description?: string;
    children: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
}

const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
};

export function Modal({
    isOpen,
    onClose,
    title,
    description,
    children,
    size = 'md',
    className,
}: ModalProps) {
    const dialogRef = useRef<HTMLDivElement>(null);

    // ESC to close
    useEffect(() => {
        if (!isOpen) return;
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [isOpen, onClose]);

    // Focus trap
    useEffect(() => {
        if (isOpen && dialogRef.current) {
            const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            focusable[0]?.focus();
        }
    }, [isOpen]);

    // Prevent body scroll
    useEffect(() => {
        document.body.style.overflow = isOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    return (
        <AnimatePresence mode="wait">
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="fixed inset-0 z-overlay bg-black/40 backdrop-blur-sm"
                        onClick={onClose}
                        aria-hidden="true"
                    />
                    <div className="fixed inset-0 z-modal flex items-center justify-center p-4">
                        <motion.div
                            ref={dialogRef}
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby={title ? 'modal-title' : undefined}
                            aria-describedby={description ? 'modal-description' : undefined}
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={SPRING.smooth}
                            className={cn(
                                'bg-surface rounded-2xl shadow-overlay w-full relative max-h-[90vh] overflow-y-auto',
                                'dark:bg-surface dark:shadow-overlay',
                                sizeClasses[size],
                                className
                            )}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {(title || description) && (
                                <div className="flex items-start justify-between p-6 border-b border-border-subtle dark:border-border-subtle">
                                    <div className="flex-1">
                                        {title && (
                                            <h2 id="modal-title" className="text-xl font-semibold text-text-primary dark:text-text-primary">
                                                {title}
                                            </h2>
                                        )}
                                        {description && (
                                            <p id="modal-description" className="text-sm text-text-secondary mt-2 dark:text-text-secondary">
                                                {description}
                                            </p>
                                        )}
                                    </div>
                                    <motion.button
                                        onClick={onClose}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="ml-4 shrink-0 text-text-tertiary hover:text-text-secondary transition-colors rounded-lg p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-apple focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-900"
                                        aria-label="Close dialog"
                                    >
                                        <X className="w-5 h-5" />
                                    </motion.button>
                                </div>
                            )}
                            <div className="p-6">{children}</div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
