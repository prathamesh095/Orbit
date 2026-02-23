'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-[400px] flex items-center justify-center p-6">
                    <div className="max-w-md w-full bg-white rounded-2xl border border-red-100 shadow-xl p-8 text-center animate-fade-in">
                        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle className="w-8 h-8 text-red-500" />
                        </div>
                        <h2 className="text-xl font-bold text-neutral-900 mb-2">Something went wrong</h2>
                        <p className="text-neutral-500 text-sm mb-8">
                            An unexpected error occurred. We've logged the issue and are looking into it.
                        </p>
                        <div className="flex flex-col gap-3">
                            <Button
                                onClick={() => window.location.reload()}
                                className="w-full"
                                leftIcon={<RefreshCcw size={16} />}
                            >
                                Reload Page
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => window.location.href = '/dashboard'}
                                className="w-full"
                                leftIcon={<Home size={16} />}
                            >
                                Back to Dashboard
                            </Button>
                        </div>
                        {process.env.NODE_ENV === 'development' && (
                            <pre className="mt-8 p-4 bg-neutral-50 rounded-lg text-left text-[10px] text-red-600 overflow-auto max-h-40">
                                {this.state.error?.stack}
                            </pre>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
