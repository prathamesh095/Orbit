/**
 * @file domain.ts
 * FAANG-tier Branded Types and Domain Objects.
 * Prevents "Any-ID" confusion and enforces strict data boundaries.
 */

export type Branded<T, K> = T & { __brand: K };

export type ApplicationId = Branded<string, 'ApplicationId'>;
export type UserId = Branded<string, 'UserId'>;
export type ContactId = Branded<string, 'ContactId'>;

export type ApplicationStatus =
    | 'draft'
    | 'applied'
    | 'interviewing'
    | 'offer'
    | 'rejected';

export type UrgencyLevel = 'critical' | 'overdue' | 'due_today' | 'normal';

/**
 * Domain DTO for Analytics
 * Optimized for O(n) reduction.
 */
export interface PipelineMetrics {
    totalApplications: number;
    statusDistribution: Record<ApplicationStatus, number>;
    urgencyCounts: Record<UrgencyLevel, number>;
    conversionRates: {
        applicationToInterview: number;
        interviewToOffer: number;
    };
}

export interface ActivityEvent {
    id: string;
    type: 'STATUS_CHANGE' | 'NOTE_ADDED' | 'FOLLOW_UP_SCHEDULED';
    timestamp: string;
    metadata: Record<string, any>;
}
