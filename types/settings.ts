import type { ApplicationStatus } from './application';

export type ThemeAccent =
    | 'blue'
    | 'violet'
    | 'emerald'
    | 'rose'
    | 'amber'
    | 'cyan';

export type StatusColorMap = Record<ApplicationStatus, string>;

/** The runtime settings object used throughout the app */
export interface AppSettings {
    userId: string;
    theme: 'light' | 'dark' | 'system';
    density: 'compact' | 'normal' | 'comfortable';
    themeAccent: ThemeAccent;
    statusColors: StatusColorMap;
    notifyFollowUp: boolean;
    notifyOverdue: boolean;
    notifyInterviewing: boolean;
    defaultView: 'list' | 'grid' | 'kanban';
    pageSize: number;
    defaultFollowUpDays: number;
    updatedAt: string;
}

export interface StorageStats {
    applications: number;
    contacts: number;
    attachments: number;
    lastGenerated: string;
}

/** @deprecated Use AppSettings */
export interface UserSettings {
    userId: string;
    themeAccent: ThemeAccent;
    statusColors: StatusColorMap;
    enableNotifications: boolean;
    enableFollowUpReminders: boolean;
    followUpReminderDays: number;
    updatedAt: string;
}

export const DEFAULT_STATUS_COLORS: StatusColorMap = {
    draft: '#6b7280',
    applied: '#3b82f6',
    interviewing: '#f59e0b',
    offer: '#10b981',
    rejected: '#ef4444',
};

export const DEFAULT_SETTINGS: Omit<UserSettings, 'userId' | 'updatedAt'> = {
    themeAccent: 'blue',
    statusColors: DEFAULT_STATUS_COLORS,
    enableNotifications: true,
    enableFollowUpReminders: true,
    followUpReminderDays: 3,
};
