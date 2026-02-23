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

// ─── Application ──────────────────────────────────────────────────────────────

export interface Application {
    id: string;
    userId: string;

    // Core fields
    company: string;
    roleTitle: string;
    source: string;
    jobPostingUrl: string;
    jobId: string;
    location: string;
    resumeVersion: string;
    actionDate: string;
    status: ApplicationStatus;
    nextFollowUp: string;
    strategicNotes: string;

    // Advanced fields
    subjectLineUsed: string;
    valuePitchSummary: string;
    personalizationNotes: string;
    replyReceived: boolean;
    followUpSent: boolean;
    emailType: EmailType | '';
    attachments: Attachment[];

    // Source-contextual fields (Phase 3)
    referralContact?: string;
    recruiterName?: string;

    // Linked data
    linkedContactIds: string[];

    // Metadata
    createdAt: string;
    updatedAt: string;
    urgency: UrgencyLevel;
}

export type ApplicationFormData = Omit<
    Application,
    'id' | 'userId' | 'createdAt' | 'updatedAt' | 'urgency' | 'attachments'
> & {
    attachments?: Attachment[];
};

export type ApplicationDraft = Partial<ApplicationFormData> & {
    savedAt: string;
};
