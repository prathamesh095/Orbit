export type ApplicationStatus =
    | 'draft'
    | 'applied'
    | 'interviewing'
    | 'offer'
    | 'rejected';

export type EmailType =
    | 'cold_outreach'
    | 'follow_up'
    | 'thank_you'
    | 'referral'
    | 'application_confirmation';

export type RecordIntent =
    | 'application'
    | 'outreach'
    | 'recruiter'
    | 'networking'
    | 'followup';

export type UrgencyLevel = 'critical' | 'overdue' | 'due_today' | 'normal';

// ─── Attachment (discriminated union) ─────────────────────────────────────────

export interface FileAttachment {
    id: string;
    kind: 'file';
    name: string;
    size: number;
    type: string;
    dataUrl?: string;   // undefined when stored as metadata-only (>400KB)
    uploadedAt: string;
}

export interface DriveLinkAttachment {
    id: string;
    kind: 'drive';
    name: string;
    url: string;
    uploadedAt: string;
}

/** Union type — use `kind` discriminator to differentiate at runtime. */
export type Attachment = FileAttachment | DriveLinkAttachment;

/**
 * Backward-compat guard: old attachments stored without `kind` are treated as files.
 * Call this once when loading from storage.
 */
export function normalizeAttachment(raw: Record<string, unknown>): Attachment {
    if (!raw.kind) {
        return { ...(raw as unknown as FileAttachment), kind: 'file' };
    }
    return raw as unknown as Attachment;
}

// ─── Execution Log ────────────────────────────────────────────────────────────

export interface ExecutionLog {
    id: string;
    applicationId: string;
    action: string;
    previousValue?: string;
    newValue?: string;
    timestamp: string;
    metadata?: Record<string, string>;
}

// ─── Application (Discriminated Union) ─────────────────────────────────────────

export interface BaseApplication {
    id: string;
    userId: string;
    company: string;
    actionDate: string;
    status: ApplicationStatus;
    nextFollowUp: string;
    strategicNotes: string;
    attachments: Attachment[];
    linkedContactIds: string[];
    createdAt: string;
    updatedAt: string;
    urgency: UrgencyLevel;
}

export interface JobApplication extends BaseApplication {
    recordIntent: 'application';
    roleTitle: string;
    source: string;
    jobPostingUrl: string;
    jobId: string;
    location: string;
    resumeVersion: string;
}

export interface OutreachApplication extends BaseApplication {
    recordIntent: 'outreach' | 'networking';
    contactName: string;
    contactEmail?: string;
    subjectLineUsed: string;
    valuePitchSummary: string;
    personalizationNotes: string;
    replyReceived: boolean;
    followUpSent: boolean;
    emailType: EmailType | '';
    roleTitle?: string; // Optional for networking
}

export interface RecruiterApplication extends BaseApplication {
    recordIntent: 'recruiter';
    recruiterName: string;
    roleTitle?: string;
    location?: string;
}

export interface FollowUpApplication extends BaseApplication {
    recordIntent: 'followup';
    nextFollowUp: string; // Required for this intent
    strategicNotes: string;
}

export type Application =
    | JobApplication
    | OutreachApplication
    | RecruiterApplication
    | FollowUpApplication;

export type ApplicationFormData =
    | Omit<JobApplication, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'urgency' | 'attachments'> & { attachments?: Attachment[] }
    | Omit<OutreachApplication, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'urgency' | 'attachments'> & { attachments?: Attachment[] }
    | Omit<RecruiterApplication, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'urgency' | 'attachments'> & { attachments?: Attachment[] }
    | Omit<FollowUpApplication, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'urgency' | 'attachments'> & { attachments?: Attachment[] };

export type ApplicationDraft = {
    data: Partial<ApplicationFormData>;
    savedAt: string;
    version: number;
};
