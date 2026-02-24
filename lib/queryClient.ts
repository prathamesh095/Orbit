import { QueryClient } from '@tanstack/react-query';

/**
 * FAANG-tier Query Client Configuration.
 * 
 * RATIONALE:
 * - staleTime (60s): Prevents unnecessary network thrashing on tab switches/component re-mounts.
 * - retry (2): Standard balance between resilience and UX (avoiding endless loading loops).
 * - structuralSharing: Enabled by default, ensures reference stability for memoized components.
 */

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60, // 60 seconds
            gcTime: 1000 * 60 * 5, // 5 minutes
            retry: 2,
            refetchOnWindowFocus: true,
            refetchOnReconnect: 'always',
        },
    },
});

// Cache Keys for strict domain separation
export const CACHE_KEYS = {
    applications: ['applications'] as const,
    application: (id: string) => ['applications', id] as const,
    contacts: ['contacts'] as const,
    notifications: ['notifications'] as const,
} as const;
