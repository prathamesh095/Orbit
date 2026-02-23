'use client';

import React, {
    createContext,
    useContext,
    useState,
    useCallback,
    type ReactNode,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
    id: string;
    variant: ToastVariant;
    title: string;
    message?: string;
}

interface ToastContextValue {
    toasts: Toast[];
    addToast: (toast: Omit<Toast, 'id'>) => void;
    removeToast: (id: string) => void;
    success: (title: string, message?: string) => void;
    error: (title: string, message?: string) => void;
    warning: (title: string, message?: string) => void;
    info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_ICONS: Record<ToastVariant, React.ReactNode> = {
    success: <CheckCircle className="w-5 h-5 text-emerald-500" />,
    error: <XCircle className="w-5 h-5 text-red-500" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
};

const TOAST_STYLES: Record<ToastVariant, string> = {
    success: 'border-emerald-200 bg-emerald-50',
    error: 'border-red-200 bg-red-50',
    warning: 'border-amber-200 bg-amber-50',
    info: 'border-blue-200 bg-blue-50',
};

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const addToast = useCallback(
        (toast: Omit<Toast, 'id'>) => {
            const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
            setToasts((prev) => [...prev.slice(-4), { ...toast, id }]);
            setTimeout(() => removeToast(id), 5000);
        },
        [removeToast]
    );

    const success = useCallback(
        (title: string, message?: string) => addToast({ variant: 'success', title, message }),
        [addToast]
    );
    const error = useCallback(
        (title: string, message?: string) => addToast({ variant: 'error', title, message }),
        [addToast]
    );
    const warning = useCallback(
        (title: string, message?: string) => addToast({ variant: 'warning', title, message }),
        [addToast]
    );
    const info = useCallback(
        (title: string, message?: string) => addToast({ variant: 'info', title, message }),
        [addToast]
    );

    return (
        <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, warning, info }}>
            {children}
            <div
                aria-live="polite"
                aria-label="Notifications"
                className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)]"
            >
                <AnimatePresence>
                    {toasts.map((toast) => (
                        <motion.div
                            key={toast.id}
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className={`flex items-start gap-3 p-4 rounded-lg border shadow-lg ${TOAST_STYLES[toast.variant]}`}
                            role="alert"
                        >
                            <span className="mt-0.5 shrink-0">{TOAST_ICONS[toast.variant]}</span>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900">{toast.title}</p>
                                {toast.message && (
                                    <p className="text-sm text-gray-600 mt-0.5">{toast.message}</p>
                                )}
                            </div>
                            <button
                                onClick={() => removeToast(toast.id)}
                                className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                                aria-label="Dismiss notification"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
}

export function useToast(): ToastContextValue {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within ToastProvider');
    return ctx;
}
