export type NotificationType =
    | 'follow_up'
    | 'overdue'
    | 'reminder'
    | 'system'
    | 'offer'
    | 'interview';

export interface Notification {
    id: string;
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    applicationId?: string;
    read: boolean;
    dismissed: boolean;
    createdAt: string;
    dismissedAt?: string;
}

export interface Reminder {
    id: string;
    userId: string;
    applicationId: string;
    dueAt: string;
    message: string;
    triggered: boolean;
    triggeredAt?: string;
    createdAt: string;
}
