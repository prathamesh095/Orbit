import type {
    Application,
    Contact,
    Notification,
    Reminder,
    UserSettings,
    ExecutionLog,
    ApplicationDraft,
    ContactDraft,
} from '@/types';
import type { Template } from '@/types/template';
import { DEFAULT_SETTINGS } from '@/types';

// Versioned storage keys to enable future migrations
const STORAGE_VERSION = 'v1';

function makeKey(userId: string, entity: string): string {
    return `job_crm:${STORAGE_VERSION}:${userId}:${entity}`;
}

// Safe JSON parsing with corruption recovery
function safeGet<T>(key: string, fallback: T): T {
    if (typeof window === 'undefined') return fallback;
    try {
        const raw = window.localStorage.getItem(key);
        if (!raw) return fallback;
        const parsed = JSON.parse(raw) as T;
        return parsed ?? fallback;
    } catch {
        // Corrupted data - remove and return fallback
        try { window.localStorage.removeItem(key); } catch { /* ignore */ }
        return fallback;
    }
}

function safeSet<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
        // Storage quota exceeded — silently fail
    }
}

function safeRemove(key: string): void {
    if (typeof window === 'undefined') return;
    try { window.localStorage.removeItem(key); } catch { /* ignore */ }
}

// ─── Applications ─────────────────────────────────────────────────────────────

export function getApplications(userId: string): Application[] {
    return safeGet<Application[]>(makeKey(userId, 'applications'), []);
}

export function saveApplications(userId: string, apps: Application[]): void {
    safeSet(makeKey(userId, 'applications'), apps);
}

export function getApplicationById(userId: string, id: string): Application | null {
    const apps = getApplications(userId);
    return apps.find((a) => a.id === id) ?? null;
}

export function upsertApplication(userId: string, app: Application): void {
    const apps = getApplications(userId);
    const idx = apps.findIndex((a) => a.id === app.id);
    if (idx >= 0) {
        apps[idx] = app;
    } else {
        apps.unshift(app);
    }
    saveApplications(userId, apps);
}

export function deleteApplication(userId: string, id: string): void {
    const apps = getApplications(userId).filter((a) => a.id !== id);
    saveApplications(userId, apps);
}

// ─── Application Drafts ───────────────────────────────────────────────────────

export function getApplicationDraft(userId: string, draftId: string): ApplicationDraft | null {
    return safeGet<ApplicationDraft | null>(makeKey(userId, `draft:app:${draftId}`), null);
}

export function saveApplicationDraft(userId: string, draftId: string, draft: ApplicationDraft): void {
    safeSet(makeKey(userId, `draft:app:${draftId}`), draft);
}

export function clearApplicationDraft(userId: string, draftId: string): void {
    safeRemove(makeKey(userId, `draft:app:${draftId}`));
}

// ─── Contacts ─────────────────────────────────────────────────────────────────

export function getContacts(userId: string): Contact[] {
    return safeGet<Contact[]>(makeKey(userId, 'contacts'), []);
}

export function saveContacts(userId: string, contacts: Contact[]): void {
    safeSet(makeKey(userId, 'contacts'), contacts);
}

export function upsertContact(userId: string, contact: Contact): void {
    const contacts = getContacts(userId);
    const idx = contacts.findIndex((c) => c.id === contact.id);
    if (idx >= 0) {
        contacts[idx] = contact;
    } else {
        contacts.unshift(contact);
    }
    saveContacts(userId, contacts);
}

export function deleteContact(userId: string, id: string): void {
    const contacts = getContacts(userId).filter((c) => c.id !== id);
    saveContacts(userId, contacts);
}

export function getContactDraft(userId: string): ContactDraft | null {
    return safeGet<ContactDraft | null>(makeKey(userId, 'draft:contact'), null);
}

export function saveContactDraft(userId: string, draft: ContactDraft): void {
    safeSet(makeKey(userId, 'draft:contact'), draft);
}

export function clearContactDraft(userId: string): void {
    safeRemove(makeKey(userId, 'draft:contact'));
}

// ─── Notifications ─────────────────────────────────────────────────────────────

export function getNotifications(userId: string): Notification[] {
    return safeGet<Notification[]>(makeKey(userId, 'notifications'), []);
}

export function saveNotifications(userId: string, notifications: Notification[]): void {
    safeSet(makeKey(userId, 'notifications'), notifications);
}

// ─── Reminders ────────────────────────────────────────────────────────────────

export function getReminders(userId: string): Reminder[] {
    return safeGet<Reminder[]>(makeKey(userId, 'reminders'), []);
}

export function saveReminders(userId: string, reminders: Reminder[]): void {
    safeSet(makeKey(userId, 'reminders'), reminders);
}

// ─── Execution Logs ───────────────────────────────────────────────────────────

export function getExecutionLogs(userId: string): ExecutionLog[] {
    return safeGet<ExecutionLog[]>(makeKey(userId, 'logs'), []);
}

export function appendExecutionLog(userId: string, log: ExecutionLog): void {
    const logs = getExecutionLogs(userId);
    logs.unshift(log);
    // Keep last 500 entries per user
    safeSet(makeKey(userId, 'logs'), logs.slice(0, 500));
}

// ─── User Settings ────────────────────────────────────────────────────────────

export function getUserSettings(userId: string): UserSettings {
    const key = makeKey(userId, 'settings');
    const stored = safeGet<Partial<UserSettings> | null>(key, null);
    return {
        ...DEFAULT_SETTINGS,
        ...stored,
        userId,
        updatedAt: stored?.updatedAt ?? new Date().toISOString(),
    };
}

export function saveUserSettings(userId: string, settings: UserSettings): void {
    safeSet(makeKey(userId, 'settings'), settings);
}

// ─── Auth Store (global, not user-scoped) ─────────────────────────────────────

const AUTH_KEY = 'job_crm:v1:auth:session';
const USERS_KEY = 'job_crm:v1:auth:users';

export interface StoredUser {
    id: string;
    email: string;
    name: string;
    passwordHash: string;
    createdAt: string;
    resetToken?: string;
    resetTokenExpiry?: number;
}

export function getStoredUsers(): StoredUser[] {
    return safeGet<StoredUser[]>(USERS_KEY, []);
}

export function saveStoredUsers(users: StoredUser[]): void {
    safeSet(USERS_KEY, users);
}

export function getSession(): { user: { id: string; email: string; name: string; createdAt: string }; expiresAt: number } | null {
    return safeGet(AUTH_KEY, null);
}

export function saveSession(session: { user: { id: string; email: string; name: string; createdAt: string }; expiresAt: number }): void {
    safeSet(AUTH_KEY, session);
}

export function clearSession(): void {
    safeRemove(AUTH_KEY);
}

// ─── Templates ────────────────────────────────────────────────────────────────

export function getTemplates(userId: string): Template[] {
    return safeGet<Template[]>(makeKey(userId, 'templates'), []);
}

export function saveTemplates(userId: string, templates: Template[]): void {
    safeSet(makeKey(userId, 'templates'), templates);
}

export function upsertTemplate(userId: string, template: Template): void {
    const templates = getTemplates(userId);
    const idx = templates.findIndex((t) => t.id === template.id);
    if (idx >= 0) {
        templates[idx] = template;
    } else {
        templates.unshift(template);
    }
    saveTemplates(userId, templates);
}

export function deleteTemplate(userId: string, id: string): void {
    const templates = getTemplates(userId).filter((t) => t.id !== id);
    saveTemplates(userId, templates);
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export function getStorageStats(userId: string): { applications: number; contacts: number; attachments: number } {
    const apps = getApplications(userId);
    const contacts = getContacts(userId);
    const attachments = apps.reduce((acc, app) => acc + (app.attachments?.length ?? 0), 0);

    return {
        applications: apps.length,
        contacts: contacts.length,
        attachments: attachments,
    };
}


