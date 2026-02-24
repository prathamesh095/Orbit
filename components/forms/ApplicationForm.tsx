'use client';

import {
    useState, useEffect, useCallback, useRef, memo, useMemo,
} from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Save, Clock, RefreshCw, ChevronDown,
    AlertCircle, CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { applicationSchema, type ApplicationFormValues } from '@/lib/validations';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import { Button } from '@/components/ui/Button';
import { FileUpload } from '@/components/ui/FileUpload';
import { NavigationGuard } from '@/components/ui/NavigationGuard';
import * as storageService from '@/services/storage/storageService';
import type { Attachment } from '@/types';

// ─── Constants ────────────────────────────────────────────────────────────────

type FormPhase =
    | 'idle'
    | 'dirty'
    | 'saving'       // autosave
    | 'submitting'   // manual submit
    | 'saved'
    | 'error';

type SectionKey = 'core' | 'context' | 'outreach' | 'attachments';
interface SectionState { core: boolean; context: boolean; outreach: boolean; attachments: boolean; }

const DEFAULT_SECTIONS: SectionState = { core: true, context: true, outreach: false, attachments: false };
const SECTIONS_KEY = 'form:sections:v1';
const DRAFT_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;
const AUTOSAVE_MS = 900;
const MAXWAIT_MS = 10_000;

// ─── Intent Matrix (Phase 1) ──────────────────────────────────────────────────

interface IntentConfig {
    requiredFields: string[];
    meaningfulFields: string[];
    defaultSections: SectionState;
    defaultStatus: ApplicationFormValues['status'];
}

const INTENT_CONFIG: Record<ApplicationFormValues['recordIntent'], IntentConfig> = {
    application: {
        requiredFields: ['company', 'roleTitle'],
        meaningfulFields: ['company', 'roleTitle', 'strategicNotes'],
        defaultSections: { core: true, context: true, outreach: false, attachments: false },
        defaultStatus: 'applied',
    },
    outreach: {
        requiredFields: [], // Soft-handled in Zod
        meaningfulFields: ['contactName', 'company', 'subjectLineUsed', 'valuePitchSummary'],
        defaultSections: { core: true, context: false, outreach: true, attachments: false },
        defaultStatus: 'draft',
    },
    recruiter: {
        requiredFields: [],
        meaningfulFields: ['recruiterName', 'company', 'strategicNotes'],
        defaultSections: { core: true, context: true, outreach: false, attachments: false },
        defaultStatus: 'draft',
    },
    networking: {
        requiredFields: [],
        meaningfulFields: ['contactName', 'strategicNotes'],
        defaultSections: { core: true, context: false, outreach: true, attachments: false },
        defaultStatus: 'draft',
    },
    followup: {
        requiredFields: ['nextFollowUp'],
        meaningfulFields: ['nextFollowUp', 'strategicNotes'],
        defaultSections: { core: true, context: false, outreach: true, attachments: false },
        defaultStatus: 'interviewing',
    },
};

function hasMeaningfulData(values: ApplicationFormValues, intent: ApplicationFormValues['recordIntent']): boolean {
    const config = INTENT_CONFIG[intent];
    return config.meaningfulFields.some((field) => {
        const val = (values as any)[field];
        if (typeof val === 'string') return !!val.trim();
        if (typeof val === 'boolean') return val;
        return !!val;
    });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function readSections(): SectionState {
    if (typeof window === 'undefined') return DEFAULT_SECTIONS;
    try {
        const raw = window.localStorage.getItem(SECTIONS_KEY);
        return raw ? { ...DEFAULT_SECTIONS, ...(JSON.parse(raw) as Partial<SectionState>) } : DEFAULT_SECTIONS;
    } catch { return DEFAULT_SECTIONS; }
}
function writeSections(s: SectionState) {
    if (typeof window === 'undefined') return;
    try { window.localStorage.setItem(SECTIONS_KEY, JSON.stringify(s)); } catch { }
}

/** Normalize 'YYYY-MM-DD' to local midnight ms (timezone-safe). */
function normDate(dateStr: string): number {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d).getTime();
}
function todayMidnightMs(): number {
    const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime();
}
function addDays(dateStr: string, days: number): string {
    const ms = normDate(dateStr) + days * 86_400_000;
    const d = new Date(ms);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function todayStr(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function elapsedText(ms: number): string {
    const s = Math.round((Date.now() - ms) / 1000);
    if (s < 60) return 'just now';
    const m = Math.round(s / 60); if (m < 60) return `${m}m ago`;
    return `${Math.round(m / 60)}h ago`;
}
function parseDraft(raw: unknown): { data: ApplicationFormValues; savedAt: number } | null {
    if (!raw || typeof raw !== 'object') return null;
    const obj = raw as Record<string, unknown>;
    // New envelope: { data, savedAt: number, ... }
    if ('data' in obj && obj.data && typeof obj.data === 'object') {
        const savedAt = typeof obj.savedAt === 'number' ? obj.savedAt : 0;
        return { data: obj.data as ApplicationFormValues, savedAt };
    }
    // Legacy: { ...formValues, savedAt: ISO string }
    const { savedAt: raw_savedAt, ...legacyData } = obj;
    const savedAt = raw_savedAt
        ? (typeof raw_savedAt === 'number' ? raw_savedAt : new Date(raw_savedAt as string).getTime())
        : 0;
    return { data: legacyData as ApplicationFormValues, savedAt };
}

// ─── Options ──────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
    { value: 'draft', label: 'Draft' },
    { value: 'applied', label: 'Applied' },
    { value: 'interviewing', label: 'Interviewing' },
    { value: 'offer', label: 'Offer' },
    { value: 'rejected', label: 'Rejected' },
];
const SOURCE_OPTIONS = [
    { value: '', label: 'Select source...' },
    { value: 'LinkedIn', label: 'LinkedIn' },
    { value: 'Company Website', label: 'Company Website' },
    { value: 'Referral', label: 'Referral' },
    { value: 'Job Board', label: 'Job Board (Indeed/Glassdoor)' },
    { value: 'AngelList', label: 'AngelList / Wellfound' },
    { value: 'Recruiter', label: 'Recruiter' },
    { value: 'Networking', label: 'Networking' },
    { value: 'Other', label: 'Other' },
];
const EMAIL_TYPE_OPTIONS = [
    { value: '', label: 'Select email type...' },
    { value: 'cold_outreach', label: 'Cold Outreach' },
    { value: 'follow_up', label: 'Follow-up' },
    { value: 'thank_you', label: 'Thank You' },
    { value: 'referral', label: 'Referral' },
    { value: 'application_confirmation', label: 'Application Confirmation' },
];

// ─── Status Strip ─────────────────────────────────────────────────────────────

const StatusStrip = memo(function StatusStrip({
    phase, savedMs, onRetry,
}: { phase: FormPhase; savedMs: number | null; onRetry: () => void; }) {
    const [, setTick] = useState(0);
    useEffect(() => {
        if (phase !== 'saved' || !savedMs) return;
        const id = setInterval(() => {
            if (document.visibilityState === 'visible') {
                setTick((t) => t + 1);
            }
        }, 30_000);
        return () => clearInterval(id);
    }, [phase, savedMs]);

    const content: Record<FormPhase, { text: string; icon: React.ReactNode; cls: string; retry?: boolean } | null> = {
        idle: null,
        dirty: { text: 'Unsaved changes', icon: <Clock className="w-3.5 h-3.5" />, cls: 'text-neutral-400' },
        saving: { text: 'Saving…', icon: <RefreshCw className="w-3.5 h-3.5 animate-spin" />, cls: 'text-neutral-400' },
        submitting: { text: 'Saving…', icon: <RefreshCw className="w-3.5 h-3.5 animate-spin" />, cls: 'text-blue-500' },
        saved: savedMs ? { text: `Saved ${elapsedText(savedMs)}`, icon: <CheckCircle2 className="w-3.5 h-3.5" />, cls: 'text-emerald-600' } : null,
        error: { text: 'Save failed', icon: <AlertCircle className="w-3.5 h-3.5" />, cls: 'text-red-500', retry: true },
    };
    const cfg = content[phase];
    if (!cfg) return null;
    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={phase}
                initial={{ opacity: 0, y: -2 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 2 }}
                transition={{ duration: 0.15 }}
                className={cn('flex items-center gap-1.5 text-xs select-none', cfg.cls)}
            >
                {cfg.icon}
                <span>{cfg.text}</span>
                {cfg.retry && (
                    <button type="button" onClick={onRetry} className="underline underline-offset-2 hover:opacity-80">retry</button>
                )}
            </motion.div>
        </AnimatePresence>
    );
});

// ─── Collapsible Section ──────────────────────────────────────────────────────

const CollapsibleSection = memo(function CollapsibleSection({
    title, open, onToggle, children,
}: { title: string; open: boolean; onToggle: () => void; children: React.ReactNode; }) {
    return (
        <div className="border-t border-gray-100 pt-5">
            <button
                type="button" onClick={onToggle} aria-expanded={open}
                className="w-full flex items-center justify-between text-left outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded mb-0"
            >
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{title}</h3>
                <ChevronDown className={cn('w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200', open && 'rotate-180')} />
            </button>
            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                        <div className="pt-4">{children}</div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
});

// ─── Smart Follow-Up Field ────────────────────────────────────────────────────

const FollowUpField = memo(function FollowUpField({
    value, onChange, error, minDate,
}: { value: string; onChange: (v: string) => void; error?: string; minDate: string; }) {
    const helper = useMemo(() => {
        if (!value) return null;
        const diff = Math.round((normDate(value) - todayMidnightMs()) / 86_400_000);
        if (diff < 0) return { text: `Overdue by ${Math.abs(diff)} day${Math.abs(diff) !== 1 ? 's' : ''}`, cls: 'text-red-600' };
        if (diff === 0) return { text: 'Due today', cls: 'text-amber-600' };
        return { text: `Follow up in ${diff} day${diff !== 1 ? 's' : ''}`, cls: 'text-neutral-400' };
    }, [value]);

    const handleChip = useCallback((days: number) => {
        onChange(addDays(value || todayStr(), days));
    }, [value, onChange]);

    return (
        <div>
            <div className="flex items-end gap-2">
                <div className="flex-1">
                    <Input
                        label="Next Follow-up Date"
                        type="date" min={minDate} value={value}
                        onChange={(e) => onChange(e.target.value)}
                        error={error}
                    />
                </div>
                <div className="flex items-center gap-1 pb-[1px]">
                    {([3, 7, 14] as const).map((d) => (
                        <button
                            key={d} type="button" onClick={() => handleChip(d)}
                            className="h-9 px-2.5 rounded-lg text-[12px] font-medium border border-neutral-200 bg-white text-neutral-600 hover:border-blue-400 hover:text-blue-700 hover:bg-blue-50 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                        >
                            +{d}d
                        </button>
                    ))}
                </div>
            </div>
            {helper && <p className={cn('mt-1 text-xs font-medium', helper.cls)}>{helper.text}</p>}
        </div>
    );
});

// ─── Form Props ───────────────────────────────────────────────────────────────

interface ApplicationFormProps {
    userId: string;
    draftId: string;
    defaultValues?: Partial<ApplicationFormValues>;
    attachments?: Attachment[];
    onSubmit: (data: ApplicationFormValues, attachments: Attachment[]) => Promise<void>;
    onCancel?: () => void;
    isEditing?: boolean;
    /** Called whenever isDirty changes — lets parent modal show unsaved guard */
    onDirtyChange?: (dirty: boolean) => void;
}

// ─── Application Form ─────────────────────────────────────────────────────────

export function ApplicationForm({
    userId, draftId, defaultValues,
    attachments: initialAttachments = [],
    onSubmit, onCancel, isEditing = false, onDirtyChange,
}: ApplicationFormProps) {
    const today = todayStr();

    // ── State ─────────────────────────────────────────────────────────────────
    const [attachments, setAttachments] = useState<Attachment[]>(initialAttachments);
    const [formPhaseState, setFormPhaseState] = useState<FormPhase>('idle');
    const formPhaseRef = useRef<FormPhase>('idle');
    const followUpRef = useRef<HTMLDivElement>(null);
    const [lastSavedMs, setLastSavedMs] = useState<number | null>(null);
    const [draftBanner, setDraftBanner] = useState<{ savedAt: number } | null>(null);
    const [sections, setSections] = useState<SectionState>(readSections);

    // ── Autosave refs ─────────────────────────────────────────────────────────
    const isUnmountedRef = useRef(false);
    const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const maxWaitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastAutosaveScheduledAtRef = useRef<number>(0);
    const lastSubmittedAtRef = useRef<number>(0);

    const setFormPhase = useCallback((phase: FormPhase) => {
        formPhaseRef.current = phase;
        setFormPhaseState(phase);
    }, []);

    // ── React Hook Form ───────────────────────────────────────────────────────
    const {
        register, handleSubmit, watch, setValue, reset, getValues,
        formState: { errors, isSubmitting, isDirty },
        control,
        clearErrors,
    } = useForm<ApplicationFormValues>({
        resolver: zodResolver(applicationSchema) as Resolver<ApplicationFormValues>,
        defaultValues: {
            recordIntent: 'application',
            company: '', roleTitle: '', source: '', jobPostingUrl: '', jobId: '',
            location: '', resumeVersion: '', actionDate: today, status: 'applied',
            nextFollowUp: '', strategicNotes: '', subjectLineUsed: '', valuePitchSummary: '',
            personalizationNotes: '', replyReceived: false, followUpSent: false,
            emailType: '', linkedContactIds: [],
            referralContact: '', recruiterName: '',
            contactName: '', contactEmail: '',
            ...defaultValues,
        } as any,
    });

    const recordIntent = watch('recordIntent');
    const source = watch('source');
    const nextFollowUp = watch('nextFollowUp');
    const strategicNotes = watch('strategicNotes');
    const valuePitchSummary = watch('valuePitchSummary');
    const personalizationNotes = watch('personalizationNotes');
    const replyReceived = watch('replyReceived');
    const followUpSent = watch('followUpSent');

    // ── Dirty → phase + parent notify ────────────────────────────────────────
    useEffect(() => {
        onDirtyChange?.(isDirty);
        if (isDirty && formPhaseRef.current !== 'saving' && formPhaseRef.current !== 'saved' && formPhaseRef.current !== 'submitting') {
            setFormPhase('dirty');
        }
    }, [isDirty, onDirtyChange, setFormPhase]);

    // ── Beforeunload guard (handled by NavigationGuard now) ──────────────────

    // ── Cleanup on unmount ────────────────────────────────────────────────────
    useEffect(() => {
        return () => {
            isUnmountedRef.current = true;
            if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
            if (maxWaitTimerRef.current) clearTimeout(maxWaitTimerRef.current);
        };
    }, []);

    // ── Draft restore (once) ──────────────────────────────────────────────────
    const [draftRestored, setDraftRestored] = useState(false);
    useEffect(() => {
        if (isEditing || draftRestored) return;
        setDraftRestored(true);
        try {
            const raw = storageService.getApplicationDraft(userId, draftId);
            const parsed = parseDraft(raw);
            if (!parsed) return;
            if (parsed.savedAt && Date.now() - parsed.savedAt > DRAFT_EXPIRY_MS) {
                storageService.clearApplicationDraft(userId, draftId);
                return;
            }
            reset({ ...getValues(), ...parsed.data });
            setDraftBanner({ savedAt: parsed.savedAt });
            if (parsed.savedAt) setLastSavedMs(parsed.savedAt);
        } catch { /* corrupted draft — silently ignore */ }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Autosave core ─────────────────────────────────────────────────────────
    const doAutosave = useCallback((scheduledAt: number) => {
        if (isUnmountedRef.current) return;
        if (formPhaseRef.current === 'submitting') return;
        if (lastSubmittedAtRef.current > scheduledAt) return; // monotonic safety
        const values = getValues();
        if (!hasMeaningfulData(values, values.recordIntent)) return;
        setFormPhase('saving');
        try {
            storageService.saveApplicationDraft(userId, draftId, {
                data: values,
                savedAt: Date.now(),
                version: 1,
                schemaVersion: 1,
            } as unknown as Parameters<typeof storageService.saveApplicationDraft>[2]);
            if (!isUnmountedRef.current) {
                setLastSavedMs(Date.now());
                setFormPhase('saved');
            }
        } catch {
            if (!isUnmountedRef.current) setFormPhase('error');
        }
    }, [userId, draftId, getValues, setFormPhase]);

    const scheduleAutosave = useCallback(() => {
        if (isEditing || isUnmountedRef.current || formPhaseRef.current === 'submitting') return;
        const scheduledAt = Date.now();
        lastAutosaveScheduledAtRef.current = scheduledAt;
        if (autosaveTimerRef.current) { clearTimeout(autosaveTimerRef.current); autosaveTimerRef.current = null; }
        if (!maxWaitTimerRef.current) {
            maxWaitTimerRef.current = setTimeout(() => {
                maxWaitTimerRef.current = null;
                doAutosave(lastAutosaveScheduledAtRef.current);
            }, MAXWAIT_MS);
        }
        autosaveTimerRef.current = setTimeout(() => {
            autosaveTimerRef.current = null;
            if (maxWaitTimerRef.current) { clearTimeout(maxWaitTimerRef.current); maxWaitTimerRef.current = null; }
            doAutosave(scheduledAt);
        }, AUTOSAVE_MS);
    }, [isEditing, doAutosave]);

    // Trigger autosave via subscription (Phase 0.3)
    useEffect(() => {
        if (isEditing) return;
        const subscription = watch(() => {
            if (formPhaseRef.current === 'submitting') return;
            scheduleAutosave();
        });
        return () => subscription.unsubscribe();
    }, [watch, isEditing, scheduleAutosave]);

    const retryAutosave = useCallback(() => { setFormPhase('dirty'); scheduleAutosave(); }, [setFormPhase, scheduleAutosave]);

    // ── Section toggle ────────────────────────────────────────────────────────
    const toggleSection = useCallback((key: SectionKey) => {
        setSections((prev) => { const next = { ...prev, [key]: !prev[key] }; writeSections(next); return next; });
    }, []);

    // ── Submit ────────────────────────────────────────────────────────────────
    const handleFormSubmit = useCallback(async (data: ApplicationFormValues) => {
        // Cancel pending autosave
        if (autosaveTimerRef.current) { clearTimeout(autosaveTimerRef.current); autosaveTimerRef.current = null; }
        if (maxWaitTimerRef.current) { clearTimeout(maxWaitTimerRef.current); maxWaitTimerRef.current = null; }
        lastSubmittedAtRef.current = Date.now();
        setFormPhase('submitting');
        try {
            await onSubmit(data, attachments);
            if (!isEditing) storageService.clearApplicationDraft(userId, draftId);
            if (!isUnmountedRef.current) setFormPhase('idle');
        } catch {
            if (!isUnmountedRef.current) setFormPhase('error');
        }
    }, [onSubmit, attachments, isEditing, userId, draftId, setFormPhase]);

    const handleReset = useCallback(() => {
        reset(); setAttachments([]);
        storageService.clearApplicationDraft(userId, draftId);
        setLastSavedMs(null); setDraftBanner(null); setFormPhase('idle');
    }, [reset, userId, draftId, setFormPhase]);

    // ── NextFollowUp field helpers ────────────────────────────────────────────
    const handleFollowUpChange = useCallback((v: string) => {
        setValue('nextFollowUp', v, { shouldDirty: true, shouldValidate: true });
    }, [setValue]);

    const handleIntentChange = useCallback((intent: ApplicationFormValues['recordIntent']) => {
        const config = INTENT_CONFIG[intent];
        setValue('recordIntent', intent, { shouldDirty: true });

        // Phase 4: Adaptive Section Intelligence
        setSections(config.defaultSections);

        // Phase 5: Status Intelligence
        setValue('status', config.defaultStatus);

        // Phase 7: Validation Error Cleanup
        clearErrors();

        // Phase 6: Follow-up Mode Elevation
        if (intent === 'followup') {
            setTimeout(() => {
                followUpRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        }
    }, [setValue, clearErrors]);

    // ─────────────────────────────────────────────────────────────────────────

    return (
        <>
            <NavigationGuard when={isDirty && formPhaseRef.current !== 'submitting'} />
            <form onSubmit={handleSubmit(handleFormSubmit as any)} className="space-y-6" noValidate>

                {/* ── Phase 2: Intent Switcher ───────────────────────────── */}
                <div className="bg-neutral-50 p-1 rounded-xl border border-neutral-200 flex flex-wrap gap-1">
                    {(['application', 'outreach', 'recruiter', 'networking', 'followup'] as const).map((intent) => (
                        <button
                            key={intent}
                            type="button"
                            onClick={() => handleIntentChange(intent)}
                            className={cn(
                                'flex-1 min-w-[100px] px-3 py-2 rounded-lg text-xs font-semibold capitalize transition-all duration-200',
                                recordIntent === intent
                                    ? 'bg-white text-blue-700 shadow-sm border border-neutral-200'
                                    : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 border border-transparent'
                            )}
                        >
                            {intent}
                        </button>
                    ))}
                </div>

                {/* ── Draft restored banner ──────────────────────────────── */}
                {draftBanner && !isEditing && (
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
                        <Clock className="w-4 h-4 shrink-0" />
                        <span>
                            Draft restored
                            {draftBanner.savedAt
                                ? ` · Saved at ${new Date(draftBanner.savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                                : ''}
                        </span>
                        <button
                            type="button" onClick={handleReset}
                            className="ml-auto text-amber-600 hover:text-amber-800 font-medium flex items-center gap-1 text-xs"
                        >
                            Clear draft
                        </button>
                    </div>
                )}

                {/* ── SECTION 1: Core Content (Intent-Aware) ──────────────── */}
                <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                        {recordIntent === 'application' ? 'Core Application' : (recordIntent === 'recruiter' ? 'Recruiter Context' : 'Core Connection')}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Dynamic Field Promotion (Phase 3.3 & 4.1) */}
                        {(recordIntent === 'outreach' || recordIntent === 'networking') && (
                            <>
                                <Input label="Contact Name" placeholder="Who are you talking to?"
                                    {...register('contactName')} error={(errors as any).contactName?.message} />
                                <Input label="Contact Email (optional)" placeholder="email@example.com"
                                    {...register('contactEmail')} error={(errors as any).contactEmail?.message} />
                            </>
                        )}

                        {recordIntent === 'recruiter' && (
                            <>
                                <Input label="Recruiter Name" placeholder="e.g. John Smith"
                                    {...register('recruiterName')} error={(errors as any).recruiterName?.message} />
                                <Input label="Agency / Company" placeholder="e.g. Hired Inc"
                                    {...register('company')} error={errors.company?.message} />
                            </>
                        )}

                        {recordIntent === 'application' && (
                            <>
                                <Input label="Company" placeholder="e.g. Acme Corp" required
                                    {...register('company')} error={errors.company?.message} />
                                <Input label="Role Title" placeholder="e.g. Senior Software Engineer" required
                                    {...register('roleTitle')} error={(errors as any).roleTitle?.message} />
                            </>
                        )}

                        {/* Standard secondary fields */}
                        {recordIntent !== 'recruiter' && recordIntent !== 'application' && (
                            <Input label="Company" placeholder="e.g. Acme Corp"
                                {...register('company')} error={errors.company?.message} />
                        )}

                        <Input label="Action Date" type="date" required
                            {...register('actionDate')} error={errors.actionDate?.message} />
                        <Select label="Current Status" options={STATUS_OPTIONS} required
                            {...register('status')} error={errors.status?.message} />

                        {/* Show Role Title as secondary for connection intents */}
                        {recordIntent !== 'application' && (
                            <Input label="Role Title (optional)" placeholder="e.g. Target Position"
                                {...register('roleTitle' as any)} error={(errors as any).roleTitle?.message} />
                        )}
                    </div>
                    <div className="mt-4" ref={followUpRef}>
                        <FollowUpField
                            value={nextFollowUp || ''}
                            onChange={handleFollowUpChange}
                            error={errors.nextFollowUp?.message}
                            minDate={today}
                        />
                    </div>
                </div>

                {/* ── SECTION 2: Application Context ─────────────────────── */}
                <CollapsibleSection title="Application Context" open={sections.context} onToggle={() => toggleSection('context')}>
                    {/* Source quick-chips */}
                    <div className="mb-4">
                        <p className="text-xs font-medium text-neutral-500 mb-2">Quick Source</p>
                        <div className="flex flex-wrap gap-1.5">
                            {(['LinkedIn', 'Referral', 'Recruiter', 'Job Board', 'Company Website', 'Networking'] as const).map((s) => (
                                <button
                                    key={s} type="button"
                                    onClick={() => setValue('source', s, { shouldDirty: true })}
                                    className={cn(
                                        'h-7 px-2.5 rounded-full text-[12px] font-medium border transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-blue-400',
                                        source === s
                                            ? 'bg-blue-600 border-blue-600 text-white'
                                            : 'border-neutral-200 text-neutral-600 hover:border-blue-400 hover:text-blue-700 bg-white'
                                    )}
                                >{s}</button>
                            ))}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Select label="Application Source" options={SOURCE_OPTIONS}
                            {...register('source' as any)} error={(errors as any).source?.message} />
                        <Input label="Job Posting URL" type="url" placeholder="https://..."
                            {...register('jobPostingUrl' as any)} error={(errors as any).jobPostingUrl?.message} />
                        <Input label="Job ID / Req #" placeholder="e.g. JR-12345"
                            {...register('jobId' as any)} error={(errors as any).jobId?.message} />
                        <Input label="Location" placeholder="e.g. Remote, New York, NY"
                            {...register('location' as any)} error={(errors as any).location?.message} />
                        <Input label="Resume Version" placeholder="e.g. v3-senior-eng"
                            {...register('resumeVersion' as any)} error={(errors as any).resumeVersion?.message} />
                    </div>
                    {/* Source-contextual: Referral contact */}
                    <AnimatePresence initial={false}>
                        {source === 'Referral' && (
                            <motion.div
                                key="referralContact"
                                initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2, ease: 'easeInOut' }}
                                className="overflow-hidden"
                            >
                                <div className="pt-4">
                                    <Input
                                        label="Referral Contact (optional)"
                                        placeholder="Who referred you?"
                                        {...register('referralContact' as any)}
                                        error={(errors as any).referralContact?.message}
                                    />
                                    <p className="mt-1 text-xs text-neutral-400">Name of the person who referred you to this role.</p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    {/* Source-contextual: Recruiter name */}
                    <AnimatePresence initial={false}>
                        {source === 'Recruiter' && (
                            <motion.div
                                key="recruiterName"
                                initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2, ease: 'easeInOut' }}
                                className="overflow-hidden"
                            >
                                <div className="pt-4">
                                    <Input
                                        label="Recruiter Name (optional)"
                                        placeholder="Recruiter or agency name"
                                        {...register('recruiterName' as any)}
                                        error={(errors as any).recruiterName?.message}
                                    />
                                    <p className="mt-1 text-xs text-neutral-400">Name of the recruiter or staffing agency.</p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <div className="mt-4">
                        <Textarea
                            label="Strategic Notes" placeholder="Key context, connections, company insights..."
                            autoResize maxChars={5000}
                            value={strategicNotes || ''}
                            onChange={(e) => setValue('strategicNotes', e.target.value, { shouldDirty: true })}
                            error={errors.strategicNotes?.message}
                        />
                    </div>
                </CollapsibleSection>

                {/* ── SECTION 3: Outreach Intelligence ───────────────────── */}
                <CollapsibleSection title="Outreach Intelligence" open={sections.outreach} onToggle={() => toggleSection('outreach')}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="Subject Line Used" placeholder="Email subject line"
                            {...register('subjectLineUsed' as any)} error={(errors as any).subjectLineUsed?.message} />
                        <Select label="Email Type" options={EMAIL_TYPE_OPTIONS}
                            {...register('emailType' as any)} error={(errors as any).emailType?.message} />
                    </div>
                    <div className="mt-4 space-y-4">
                        <Textarea
                            label="Value Pitch Summary" placeholder="Key value propositions pitched..."
                            autoResize maxChars={2000}
                            value={valuePitchSummary || ''}
                            onChange={(e) => setValue('valuePitchSummary' as any, e.target.value, { shouldDirty: true })}
                            error={(errors as any).valuePitchSummary?.message}
                        />
                        <Textarea
                            label="Personalization Notes" placeholder="How you personalized the outreach..."
                            autoResize maxChars={2000}
                            value={personalizationNotes || ''}
                            onChange={(e) => setValue('personalizationNotes' as any, e.target.value, { shouldDirty: true })}
                            error={(errors as any).personalizationNotes?.message}
                        />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-6">
                        <Checkbox checked={!!replyReceived}
                            onChange={(e) => setValue('replyReceived', e.target.checked, { shouldDirty: true })}
                            label="Reply received" />
                        <Checkbox checked={!!followUpSent}
                            onChange={(e) => setValue('followUpSent', e.target.checked, { shouldDirty: true })}
                            label="Follow-up sent" />
                    </div>
                </CollapsibleSection>

                {/* ── SECTION 4: Attachments ──────────────────────────────── */}
                <CollapsibleSection title="Attachments" open={sections.attachments} onToggle={() => toggleSection('attachments')}>
                    <FileUpload attachments={attachments} onChange={setAttachments} />
                </CollapsibleSection>

                {/* ── Footer: status + actions ────────────────────────────── */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <StatusStrip
                        phase={formPhaseState}
                        savedMs={lastSavedMs}
                        onRetry={retryAutosave}
                    />
                    <div className="flex items-center gap-3">
                        {onCancel && (
                            <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
                        )}
                        {!isEditing && (
                            <Button type="button" variant="outline" onClick={handleReset}>Reset</Button>
                        )}
                        <Button
                            type="submit"
                            isLoading={isSubmitting || formPhaseState === 'submitting'}
                            disabled={isSubmitting || formPhaseState === 'submitting'}
                            leftIcon={<Save className="w-4 h-4" />}
                        >
                            {isEditing ? 'Save Changes' : 'Save Application'}
                        </Button>
                    </div>
                </div>
            </form>
        </>
    );
}
