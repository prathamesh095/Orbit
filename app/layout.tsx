import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/lib/providers';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

export const metadata: Metadata = {
    title: {
        template: '%s | JobTrack CRM',
        default: 'JobTrack CRM — Strategic Job Application Tracker',
    },
    description:
        'A professional CRM to manage your job applications, track interviews, and stay on top of follow-ups.',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <meta name="theme-color" content="#007AFF" />
            </head>
            <body style={{ margin: 0, padding: 0, width: '100%', minHeight: '100vh' }}>
                <ErrorBoundary>
                    <Providers>{children}</Providers>
                </ErrorBoundary>
            </body>
        </html>
    );
}
