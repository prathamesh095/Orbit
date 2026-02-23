'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn, generateId } from '@/lib/utils';
import { ApplicationForm } from '@/components/forms/ApplicationForm';
import type { ApplicationFormValues } from '@/lib/validations';
import type { Application, Attachment } from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────

export type FormModalMode = 'create' | 'edit';

export interface AppFormModalProps {
    open: boolean;
    mode: FormModalMode;
    userId: string;
    /** Only needed in edit mode */
    application?: Application;
    onCreate: (data: ApplicationFormValues, attachments: Attachment[]) => Promise<Application>;
    onUpdate: (id: string, data: Partial<ApplicationFormValues>) => void;
    onClose: () => void;
    /** Toast/success handler called after save */
    onSaved?: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DRAFT_ID = 'modal-quick-create';
const PANEL_WIDTH = 640;

const DISCARD_MSG = 'You have unsaved changes. Discard?';

// ─── Modal ────────────────────────────────────────────────────────────────────

export function AppFormModal({
    open, mode, userId, application,
    onCreate, onUpdate, onClose, onSaved,
}: AppFormModalProps) {

    // Track dirty state reported by ApplicationForm
    const [formIsDirty, setFormIsDirty] = useState(false);

    // Ref to panel element for focus trap
    const panelRef = useRef<HTMLElement>(null);
    // Save where focus was before modal opened so we can restore it
    const previousFocusRef = useRef<Element | null>(null);

    // ── Reset dirty when modal closes / re-opens ──────────────────────────────
    useEffect(() => {
        if (!open) {
            setFormIsDirty(false);
        } else {
            // Remember where focus was
            previousFocusRef.current = document.activeElement;
        }
    }, [open]);

    // ── Auto-focus first input after mount (rAF to avoid hydration race) ──────
    useEffect(() => {
        if (!open) return;
        const raf = requestAnimationFrame(() => {
            const first = panelRef.current?.querySelector<HTMLElement>(
                'input:not([type="hidden"]):not([disabled]), textarea:not([disabled]), select:not([disabled])'
            );
            first?.focus();
        });
        return () => cancelAnimationFrame(raf);
    }, [open]);

    // ── Restore focus on close ────────────────────────────────────────────────
    useEffect(() => {
        if (open) return;
        const prev = previousFocusRef.current;
        if (prev && (prev as HTMLElement).focus) {
            requestAnimationFrame(() => (prev as HTMLElement).focus());
        }
    }, [open]);

    // ── Focus trap ────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!open) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key !== 'Tab' || !panelRef.current) return;
            const focusables = Array.from(panelRef.current.querySelectorAll<HTMLElement>(
                'button:not([disabled]):not([tabindex="-1"]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
            ));
            if (focusables.length === 0) return;
            const first = focusables[0];
            const last = focusables[focusables.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault(); last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault(); first.focus();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [open]);

    // ── ESC to close (with dirty guard) ──────────────────────────────────────
    useEffect(() => {
        if (!open) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key !== 'Escape') return;
            requestClose();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, formIsDirty]);

    // ── Safe close (checks dirty) ─────────────────────────────────────────────
    const requestClose = useCallback(() => {
        if (formIsDirty) {
            if (!window.confirm(DISCARD_MSG)) return;
        }
        onClose();
    }, [formIsDirty, onClose]);

    // ── Submit ────────────────────────────────────────────────────────────────
    const handleSubmit = useCallback(async (data: ApplicationFormValues, attachments: Attachment[]) => {
        if (mode === 'edit' && application) {
            onUpdate(application.id, data);
        } else {
            await onCreate(data, attachments);
        }
        onSaved?.();
        onClose();
    }, [mode, application, onCreate, onUpdate, onClose, onSaved]);

    // ── Default values ────────────────────────────────────────────────────────
    const defaultValues = application ? {
        company: application.company,
        roleTitle: application.roleTitle,
        source: application.source ?? '',
        jobPostingUrl: application.jobPostingUrl ?? '',
        jobId: application.jobId ?? '',
        location: application.location ?? '',
        resumeVersion: application.resumeVersion ?? '',
        actionDate: application.actionDate,
        status: application.status,
        nextFollowUp: application.nextFollowUp ?? '',
        strategicNotes: application.strategicNotes ?? '',
        subjectLineUsed: application.subjectLineUsed ?? '',
        valuePitchSummary: application.valuePitchSummary ?? '',
        personalizationNotes: application.personalizationNotes ?? '',
        replyReceived: application.replyReceived,
        followUpSent: application.followUpSent,
        emailType: application.emailType ?? '',
        linkedContactIds: application.linkedContactIds ?? [],
    } : undefined;

    // ─────────────────────────────────────────────────────────────────────────

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        key="app-modal-backdrop"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
                        onClick={requestClose}
                        aria-hidden="true"
                    />

                    {/* Slide-over panel */}
                    <motion.aside
                        ref={panelRef}
                        key="app-modal-panel"
                        initial={{ x: PANEL_WIDTH }} animate={{ x: 0 }} exit={{ x: PANEL_WIDTH }}
                        transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
                        className="fixed right-0 top-0 bottom-0 z-50 flex flex-col bg-white border-l border-neutral-100 shadow-2xl"
                        style={{ width: '100%', maxWidth: PANEL_WIDTH }}
                        role="dialog"
                        aria-modal="true"
                        aria-label={mode === 'edit' ? 'Edit application' : 'New application'}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 shrink-0">
                            <div>
                                <h2 className="font-semibold text-neutral-900" style={{ fontSize: 15 }}>
                                    {mode === 'edit' ? 'Edit Application' : 'New Application'}
                                </h2>
                                {mode === 'edit' && application && (
                                    <p className="text-neutral-400 mt-0.5" style={{ fontSize: 12 }}>
                                        {application.roleTitle} · {application.company}
                                    </p>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={requestClose}
                                aria-label="Close"
                                className={cn(
                                    'w-8 h-8 flex items-center justify-center rounded-lg',
                                    'text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700',
                                    'transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-400'
                                )}
                            >
                                <X style={{ width: 16, height: 16 }} />
                            </button>
                        </div>

                        {/* Scrollable form body */}
                        <div
                            className="flex-1 overflow-y-auto px-6 py-6"
                            style={{ scrollbarWidth: 'thin', scrollbarColor: '#e5e7eb transparent' }}
                        >
                            <ApplicationForm
                                userId={userId}
                                draftId={mode === 'edit' && application ? `edit-${application.id}` : DRAFT_ID}
                                defaultValues={defaultValues}
                                attachments={application?.attachments ?? []}
                                onSubmit={handleSubmit}
                                onCancel={requestClose}
                                isEditing={mode === 'edit'}
                                onDirtyChange={setFormIsDirty}
                            />
                        </div>

                        {/* Unsaved changes indicator in header */}
                        {formIsDirty && (
                            <div className="px-6 py-2 border-t border-amber-100 bg-amber-50 text-[11px] text-amber-700 font-medium shrink-0">
                                You have unsaved changes
                            </div>
                        )}
                    </motion.aside>
                </>
            )}
        </AnimatePresence>
    );
}
