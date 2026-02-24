import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

/**
 * DashboardErrorBoundary.
 * 
 * Provides domain-isolated error handling to prevent 
 * computation errors from crashing the entire workspace.
 */

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class DashboardErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // In production, send to Telemetry (Sentry/NewRelic)
        console.error('Dashboard Error:', error, errorInfo);
    }

    private handleReset = () => {
        this.setState({ hasError: false });
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            return this.props.fallback || (
                <div className="min-h-[400px] flex flex-col items-center justify-center p-8 bg-white rounded-2xl border border-red-100 shadow-sm text-center">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6">
                        <AlertCircle className="w-8 h-8 text-red-500" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
                    <p className="text-sm text-gray-500 max-w-xs mb-8">
                        We encountered an error while computing your dashboard analytics. This might be due to corrupted local data.
                    </p>
                    <Button
                        variant="primary"
                        onClick={this.handleReset}
                        leftIcon={<RefreshCcw className="w-4 h-4" />}
                    >
                        Refresh Dashboard
                    </Button>
                </div>
            );
        }

        return this.props.children;
    }
}
