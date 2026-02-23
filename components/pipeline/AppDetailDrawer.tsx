'use client';

import { useEffect, useRef, useState, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Edit, Trash2, CalendarClock, Building2, MapPin,
    Globe, Hash, FileText, CheckCircle2, Mail, Link2,
    Copy, Check, ExternalLink, Clock, User, Briefcase,
    ChevronDown, AlertCircle,
} from 'lucide-react';
import { cn, formatDate, formatRelativeDate } from '@/lib/utils';
import type { Application, ApplicationStatus, Attachment } from '@/types';
import { normalizeAttachment } from '@/types';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Props {
    app: Application | null;
    onClose: () => void;
    onEdit: (app: Application) => void;
    onDelete: (id: string) => void;
    onStatusChange: (id: string, status: ApplicationStatus) => void;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<ApplicationStatus, { label: string; dot: string; pill: string }> = {
    draft: { label: 'Draft', dot: 'bg-neutral-400', pill: 'bg-neutral-100 text-neutral-700 ring-neutral-200' },
    applied: { label: 'Applied', dot: 'bg-blue-500', pill: 'bg-blue-50 text-blue-700 ring-blue-200' },
    interviewing: { label: 'Interviewing', dot: 'bg-amber-500', pill: 'bg-amber-50 text-amber-700 ring-amber-200' },
    offer: { label: 'Offer', dot: 'bg-emerald-500', pill: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
    rejected: { label: 'Rejected', dot: 'bg-red-400', pill: 'bg-red-50 text-red-600 ring-red-200' },
};
const ALL_STATUSES: ApplicationStatus[] = ['draft', 'applied', 'interviewing', 'offer', 'rejected'];

// ─── Helpers ───────────────────────────────────────────────────────────────────

function todayMidnight() { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); }
function normDate(s: string) { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d).getTime(); }
function followUpState(nextFollowUp?: string): { label: string; cls: string; dot: string } | null {
    if (!nextFollowUp) return null;
    const diff = Math.round((normDate(nextFollowUp) - todayMidnight()) / 86_400_000);
    if (diff < 0) return { label: `Overdue by ${Math.abs(diff)}d`, cls: 'text-red-600 bg-red-50 ring-1 ring-red-200', dot: 'bg-red-500' };
    if (diff === 0) return { label: 'Due today', cls: 'text-amber-600 bg-amber-50 ring-1 ring-amber-200', dot: 'bg-amber-500' };
    return { label: `In ${diff} day${diff !== 1 ? 's' : ''}`, cls: 'text-emerald-700 bg-emerald-50 ring-1 ring-emerald-200', dot: 'bg-emerald-500' };
}

// ─── Inline copy button ────────────────────────────────────────────────────────

const CopyBtn = memo(function CopyBtn({ value }: { value: string }) {
    const [copied, setCopied] = useState(false);
    const timer = useRef<ReturnType<typeof setTimeout>>();
    const handle = useCallback(async (e: React.MouseEvent) => {
        e.stopPropagation();
        try { await navigator.clipboard.writeText(value); } catch { /* ignore */ }
        setCopied(true);
        timer.current = setTimeout(() => setCopied(false), 2000);
    }, [value]);
    useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
    return (
        <button type="button" onClick={handle} title="Copy"
            className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded text-neutral-400 hover:text-neutral-700">
            <AnimatePresence mode="wait" initial={false}>
                {copied
                    ? <motion.span key="c" initial={{ scale: 0.7 }} animate={{ scale: 1 }} exit={{ scale: 0.7 }} transition={{ duration: 0.1 }}><Check className="w-3 h-3 text-emerald-600" /></motion.span>
                    : <motion.span key="u" initial={{ scale: 0.7 }} animate={{ scale: 1 }} exit={{ scale: 0.7 }} transition={{ duration: 0.1 }}><Copy className="w-3 h-3" /></motion.span>
                }
            </AnimatePresence>
        </button>
    );
});

// ─── Inline Status Picker ──────────────────────────────────────────────────────

function InlineStatusPicker({ current, onSelect }: { current: ApplicationStatus; onSelect: (s: ApplicationStatus) => void }) {
    const [open, setOpen] = useState(false);
    const cfg = STATUS_CONFIG[current];
    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className={cn(
                    'inline-flex items-center gap-1.5 px-2.5 h-7 rounded-full text-[11px] font-semibold uppercase tracking-wide ring-1 transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-blue-400',
                    cfg.pill
                )}
            >
                <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', cfg.dot)} />
                {cfg.label}
                <ChevronDown className="w-3 h-3 ml-0.5" />
            </button>
            <AnimatePresence>
                {open && (
                    <>
                        <div className="fixed inset-0 z-50" onClick={() => setOpen(false)} />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -4 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -4 }}
                            transition={{ duration: 0.1 }}
                            className="absolute left-0 top-9 z-50 w-44 bg-white rounded-xl border border-neutral-100 shadow-xl py-1 overflow-hidden"
                        >
                            {ALL_STATUSES.map((s) => {
                                const c = STATUS_CONFIG[s];
                                return (
                                    <button
                                        key={s} type="button"
                                        onClick={() => { onSelect(s); setOpen(false); }}
                                        className={cn(
                                            'w-full flex items-center gap-2.5 px-3 py-2 text-[12.5px] text-left transition-colors',
                                            'outline-none hover:bg-neutral-50',
                                            s === current ? 'font-semibold text-neutral-900' : 'text-neutral-600'
                                        )}
                                    >
                                        <span className={cn('w-2 h-2 rounded-full shrink-0', c.dot)} />{c.label}
                                        {s === current && <CheckCircle2 className="w-3 h-3 ml-auto text-blue-500" />}
                                    </button>
                                );
                            })}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── Info Row ──────────────────────────────────────────────────────────────────

function InfoRow({ icon: Icon, label, value, href, copy }: {
    icon: React.ElementType; label: string; value?: string | null; href?: string; copy?: boolean;
}) {
    if (!value) return null;
    return (
        <div className="flex items-start gap-3 group py-1.5">
            <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-neutral-50 shrink-0">
                <Icon className="w-4 h-4 text-neutral-400" />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wide">{label}</p>
                <div className="flex items-center gap-1 min-w-0">
                    {href ? (
                        <a href={href} target="_blank" rel="noopener noreferrer"
                            className="text-[13px] text-blue-600 hover:underline truncate flex items-center gap-1">
                            {value} <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                    ) : (
                        <p className="text-[13px] text-neutral-800 break-words">{value}</p>
                    )}
                    {copy && <CopyBtn value={value} />}
                </div>
            </div>
        </div>
    );
}

// ─── Section ───────────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="pt-5 border-t border-neutral-100 first:border-t-0 first:pt-0">
            <h3 className="text-[11px] font-semibold text-neutral-400 uppercase tracking-widest mb-3">{title}</h3>
            {children}
        </div>
    );
}

// ─── Attachment Item ───────────────────────────────────────────────────────────

function AttachmentItem({ att }: { att: Attachment }) {
    const norm = normalizeAttachment(att as unknown as Record<string, unknown>);
    const [copyDone, setCopyDone] = useState(false);

    const handleCopyLink = useCallback(async () => {
        if (norm.kind !== 'drive') return;
        try { await navigator.clipboard.writeText(norm.url); } catch { /* ignore */ }
        setCopyDone(true);
        setTimeout(() => setCopyDone(false), 2000);
    }, [norm]);

    if (norm.kind === 'drive') {
        return (
            <div className="flex items-center gap-2.5 py-2 px-3 rounded-xl bg-sky-50 border border-sky-100 group">
                <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-sky-100 shrink-0">
                    <Link2 className="w-4 h-4 text-sky-600" />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-[12.5px] font-medium text-neutral-800 truncate">{norm.name}</p>
                    <p className="text-[11px] text-neutral-400">Drive link</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                    <button type="button" onClick={handleCopyLink} title="Copy link"
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-neutral-400 hover:bg-sky-100 hover:text-sky-700 transition-colors">
                        {copyDone ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <a href={norm.url} target="_blank" rel="noopener noreferrer"
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-neutral-400 hover:bg-sky-100 hover:text-sky-700 transition-colors"
                        title="Open in Drive">
                        <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                </div>
            </div>
        );
    }

    const hasData = Boolean((norm as { dataUrl?: string }).dataUrl);
    const sizeKb = Math.round((norm.size ?? 0) / 1024);
    return (
        <div className="flex items-center gap-2.5 py-2 px-3 rounded-xl bg-neutral-50 border border-neutral-100">
            <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-neutral-100 shrink-0">
                <FileText className="w-4 h-4 text-neutral-500" />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-[12.5px] font-medium text-neutral-800 truncate">{norm.name}</p>
                {!hasData ? (
                    <p className="text-[10.5px] text-amber-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Preview unavailable — stored without inline data
                    </p>
                ) : (
                    <p className="text-[11px] text-neutral-400">{sizeKb >= 1 ? `${sizeKb} KB` : `${norm.size}B`}</p>
                )}
            </div>
        </div>
    );
}

// ─── Follow-Up Health Card ─────────────────────────────────────────────────────

function FollowUpCard({ app }: { app: Application }) {
    const state = followUpState(app.nextFollowUp);
    if (!app.nextFollowUp && !state) {
        return (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-neutral-50 border border-neutral-100 text-neutral-400 text-[12.5px]">
                <CalendarClock className="w-4 h-4" /> No follow-up scheduled
            </div>
        );
    }
    return (
        <div className={cn('flex items-center gap-2 px-3 py-2.5 rounded-xl text-[12.5px] font-medium', state?.cls)}>
            <span className={cn('w-2 h-2 rounded-full shrink-0', state?.dot)} />
            <span>{state?.label}</span>
            {app.nextFollowUp && (
                <span className="ml-auto font-normal opacity-70">{formatDate(app.nextFollowUp)}</span>
            )}
        </div>
    );
}

// ─── Source Intelligence ───────────────────────────────────────────────────────

function SourcePanel({ app }: { app: Application }) {
    if (app.source === 'Referral' && app.referralContact) {
        return (
            <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-violet-50 border border-violet-100">
                <User className="w-4 h-4 text-violet-500 shrink-0" />
                <div>
                    <p className="text-[10.5px] font-medium text-violet-500 uppercase tracking-wide">Referral pipeline</p>
                    <p className="text-[12.5px] text-violet-900 font-medium">{app.referralContact}</p>
                </div>
            </div>
        );
    }
    if (app.source === 'Recruiter' && app.recruiterName) {
        return (
            <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-blue-50 border border-blue-100">
                <Briefcase className="w-4 h-4 text-blue-500 shrink-0" />
                <div>
                    <p className="text-[10.5px] font-medium text-blue-500 uppercase tracking-wide">Recruiter-managed</p>
                    <p className="text-[12.5px] text-blue-900 font-medium">{app.recruiterName}</p>
                </div>
            </div>
        );
    }
    return null;
}

// ─── Delete Confirm ────────────────────────────────────────────────────────────

function DeleteConfirm({ app, onConfirm, onCancel }: { app: Application; onConfirm: () => void; onCancel: () => void }) {
    return (
        <motion.div
            className="fixed inset-0 z-[70] flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
            <motion.div
                initial={{ scale: 0.95, y: 8 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 8 }}
                transition={{ duration: 0.15 }}
                className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full z-10"
            >
                <div className="w-11 h-11 bg-red-50 rounded-full flex items-center justify-center mb-4">
                    <Trash2 className="w-5 h-5 text-red-500" />
                </div>
                <h3 className="font-semibold text-neutral-900 text-[15px] mb-1.5">Delete this application?</h3>
                <p className="text-[13px] text-neutral-500 mb-5">{app.company} — {app.roleTitle}. This cannot be undone.</p>
                <div className="flex gap-3">
                    <button type="button" onClick={onCancel}
                        className="flex-1 h-9 rounded-xl border border-neutral-200 text-[13px] font-medium text-neutral-600 hover:bg-neutral-50 transition-colors outline-none">
                        Cancel
                    </button>
                    <button type="button" onClick={onConfirm}
                        className="flex-1 h-9 rounded-xl bg-red-500 hover:bg-red-600 text-white text-[13px] font-semibold transition-colors outline-none">
                        Delete
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}

// ─── Main Drawer ───────────────────────────────────────────────────────────────

export function AppDetailDrawer({ app, onClose, onEdit, onDelete, onStatusChange }: Props) {
    const [showDelete, setShowDelete] = useState(false);

    // ESC to close
    useEffect(() => {
        if (!app) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !showDelete) onClose();
            if (e.key === 'e' && !showDelete) onEdit(app);
            if (e.key === 'Delete' && !showDelete) setShowDelete(true);
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [app, onClose, onEdit, showDelete]);

    const handleConfirmDelete = useCallback(() => {
        if (!app) return;
        onDelete(app.id);
        setShowDelete(false);
        onClose();
    }, [app, onDelete, onClose]);

    const normalizedAttachments = app?.attachments.map((a) => normalizeAttachment(a as unknown as Record<string, unknown>)) ?? [];
    const fileCount = normalizedAttachments.filter((a) => a.kind === 'file').length;
    const driveCount = normalizedAttachments.filter((a) => a.kind === 'drive').length;

    return (
        <AnimatePresence>
            {app && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        key="app-drawer-backdrop"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-40 bg-black/25 backdrop-blur-sm"
                        onClick={onClose}
                        aria-hidden="true"
                    />

                    {/* Panel */}
                    <motion.aside
                        key="app-drawer-panel"
                        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                        transition={{ duration: 0.26, ease: [0.4, 0, 0.2, 1] }}
                        className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-lg bg-white border-l border-neutral-100 shadow-2xl flex flex-col"
                        role="dialog" aria-modal="true"
                        aria-label={`${app.company} — ${app.roleTitle}`}
                    >
                        {/* ── Header ──────────────────────────────────────────── */}
                        <div className="flex items-start gap-3 px-5 py-4 border-b border-neutral-100 shrink-0">
                            {/* Avatar */}
                            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 text-white font-bold text-sm flex items-center justify-center shrink-0 select-none">
                                {app.company.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                                <h2 className="font-bold text-neutral-900 truncate" style={{ fontSize: 15 }}>{app.roleTitle}</h2>
                                <p className="text-[12.5px] text-neutral-500 truncate">{app.company}{app.location ? ` · ${app.location}` : ''}</p>
                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                    <InlineStatusPicker current={app.status} onSelect={(s) => onStatusChange(app.id, s)} />
                                    {app.source && (
                                        <span className="inline-flex items-center gap-1 h-6 px-2 rounded-full text-[10.5px] bg-neutral-100 text-neutral-600 ring-1 ring-neutral-200">
                                            {app.source}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0 ml-1">
                                <button type="button" onClick={() => onEdit(app)} title="Edit (E)"
                                    className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-400 hover:bg-blue-50 hover:text-blue-600 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-400">
                                    <Edit className="w-4 h-4" />
                                </button>
                                <button type="button" onClick={() => setShowDelete(true)} title="Delete"
                                    className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-400 hover:bg-red-50 hover:text-red-500 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-red-400">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                                <button type="button" onClick={onClose} title="Close"
                                    className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-400">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* ── Scrollable Body ──────────────────────────────── */}
                        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4" style={{ scrollbarWidth: 'thin' }}>

                            {/* Follow-up health */}
                            <FollowUpCard app={app} />

                            {/* Source intelligence panel */}
                            <SourcePanel app={app} />

                            {/* Core details */}
                            <Section title="Details">
                                <InfoRow icon={CalendarClock} label="Action Date" value={app.actionDate ? formatDate(app.actionDate) : undefined} />
                                <InfoRow icon={MapPin} label="Location" value={app.location || undefined} />
                                <InfoRow icon={Hash} label="Job ID" value={app.jobId || undefined} copy />
                                <InfoRow icon={FileText} label="Resume Version" value={app.resumeVersion || undefined} />
                                {app.jobPostingUrl && (
                                    <InfoRow icon={Globe} label="Job Posting" value={app.jobPostingUrl} href={app.jobPostingUrl} copy />
                                )}
                            </Section>

                            {/* Outreach */}
                            {(app.subjectLineUsed || app.valuePitchSummary || app.personalizationNotes || app.emailType) && (
                                <Section title="Outreach">
                                    {app.emailType && (
                                        <InfoRow icon={Mail} label="Email Type"
                                            value={app.emailType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())} />
                                    )}
                                    <InfoRow icon={Mail} label="Subject Line" value={app.subjectLineUsed || undefined} />
                                    {app.valuePitchSummary && (
                                        <div className="py-1.5">
                                            <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wide mb-1">Value Pitch</p>
                                            <p className="text-[13px] text-neutral-700 whitespace-pre-wrap leading-relaxed">{app.valuePitchSummary}</p>
                                        </div>
                                    )}
                                    {app.personalizationNotes && (
                                        <div className="py-1.5">
                                            <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wide mb-1">Personalization</p>
                                            <p className="text-[13px] text-neutral-700 whitespace-pre-wrap leading-relaxed">{app.personalizationNotes}</p>
                                        </div>
                                    )}
                                    <div className="flex gap-4 mt-2">
                                        <div className="flex items-center gap-1.5 text-[12px]">
                                            <span className={cn('w-2 h-2 rounded-full', app.replyReceived ? 'bg-emerald-500' : 'bg-neutral-200')} />
                                            <span className={app.replyReceived ? 'text-emerald-700' : 'text-neutral-400'}>Reply received</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[12px]">
                                            <span className={cn('w-2 h-2 rounded-full', app.followUpSent ? 'bg-blue-500' : 'bg-neutral-200')} />
                                            <span className={app.followUpSent ? 'text-blue-700' : 'text-neutral-400'}>Follow-up sent</span>
                                        </div>
                                    </div>
                                </Section>
                            )}

                            {/* Strategic Notes */}
                            {app.strategicNotes && (
                                <Section title="Strategic Notes">
                                    <p className="text-[13px] text-neutral-700 whitespace-pre-wrap leading-relaxed">{app.strategicNotes}</p>
                                </Section>
                            )}

                            {/* Attachments */}
                            <Section title={`Attachments${normalizedAttachments.length > 0 ? ` · ${fileCount > 0 ? `${fileCount} file${fileCount !== 1 ? 's' : ''}` : ''}${fileCount > 0 && driveCount > 0 ? ' · ' : ''}${driveCount > 0 ? `${driveCount} Drive link${driveCount !== 1 ? 's' : ''}` : ''}` : ''}`}>
                                {normalizedAttachments.length === 0 ? (
                                    <p className="text-[12.5px] text-neutral-400 italic">No attachments</p>
                                ) : (
                                    <div className="space-y-2">
                                        {normalizedAttachments.map((a) => <AttachmentItem key={a.id} att={a} />)}
                                    </div>
                                )}
                            </Section>

                            {/* Meta */}
                            <Section title="Metadata">
                                <InfoRow icon={Clock} label="Created" value={formatDate(app.createdAt)} />
                                <InfoRow icon={Clock} label="Last Updated" value={formatRelativeDate(app.updatedAt)} />
                            </Section>
                        </div>

                        {/* ── Footer ──────────────────────────────────────────── */}
                        <div className="px-5 py-4 border-t border-neutral-100 bg-neutral-50/60 shrink-0 flex items-center gap-3">
                            <button type="button" onClick={() => onEdit(app)}
                                className="flex-1 h-9 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-semibold transition-colors flex items-center justify-center gap-1.5 outline-none focus-visible:ring-2 focus-visible:ring-blue-400">
                                <Edit className="w-4 h-4" /> Edit Application
                            </button>
                            <button type="button" onClick={() => setShowDelete(true)}
                                className="h-9 px-4 rounded-xl border border-neutral-200 text-[13px] font-medium text-red-500 hover:bg-red-50 transition-colors outline-none">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </motion.aside>

                    {/* Delete confirm */}
                    <AnimatePresence>
                        {showDelete && (
                            <DeleteConfirm app={app} onConfirm={handleConfirmDelete} onCancel={() => setShowDelete(false)} />
                        )}
                    </AnimatePresence>
                </>
            )}
        </AnimatePresence>
    );
}
