// Re-export all types from a single barrel
export type { Application, ApplicationFormData, ApplicationDraft, ApplicationStatus, EmailType, UrgencyLevel, Attachment, FileAttachment, DriveLinkAttachment, ExecutionLog } from './application';
export { normalizeAttachment } from './application';
export type { User, Session, AuthState, RegisterPayload, LoginPayload, AuthError } from './auth';
export type { Contact, ContactFormData, ContactDraft } from './contact';
export type { Notification, NotificationType, Reminder } from './notification';
export type { UserSettings, AppSettings, StatusColorMap, ThemeAccent } from './settings';
export { DEFAULT_STATUS_COLORS, DEFAULT_SETTINGS } from './settings';
