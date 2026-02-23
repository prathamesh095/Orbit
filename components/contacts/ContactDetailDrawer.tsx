'use client';

import { useEffect, useState, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Edit, Trash2, Mail, Phone, Linkedin, Building2,
    User, MessageSquare, Clock, ExternalLink, Copy, Check,
} from 'lucide-react';
import { cn, formatDate, formatRelativeDate } from '@/lib/utils';
import type { Contact } from '@/types';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Props {
    contact: Contact | null;
    onClose: () => void;
    onEdit: (contact: Contact) => void;
    onDelete: (contact: Contact) => void;
}

// ─── Copy Row ──────────────────────────────────────────────────────────────────

const CopyableLink = memo(function CopyableLink({
    href, icon: Icon, value, label, external,
}: { href?: string; icon: React.ElementType; value: string; label: string; external?: boolean }) {
    const [copied, setCopied] = useState(false);
    const handleCopy = useCallback(async (e: React.MouseEvent) => {
        e.stopPropagation(); e.preventDefault();
        try { await navigator.clipboard.writeText(value); } catch { /* ignore */ }
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [value]);

    const inner = (
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-neutral-50 border border-neutral-100 group hover:border-neutral-200 transition-colors">
            <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-neutral-100 shrink-0">
                <Icon className="w-4 h-4 text-neutral-500" />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-[10.5px] font-medium text-neutral-400 uppercase tracking-wide">{label}</p>
                <p className="text-[13px] text-neutral-800 truncate">{value}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
                <button type="button" onClick={handleCopy} title="Copy"
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-neutral-300 hover:text-neutral-700 hover:bg-neutral-100 transition-colors">
                    <AnimatePresence mode="wait" initial={false}>
                        {copied
                            ? <motion.span key="c" initial={{ scale: 0.7 }} animate={{ scale: 1 }} exit={{ scale: 0.7 }}><Check className="w-3.5 h-3.5 text-emerald-600" /></motion.span>
                            : <motion.span key="u" initial={{ scale: 0.7 }} animate={{ scale: 1 }} exit={{ scale: 0.7 }}><Copy className="w-3.5 h-3.5" /></motion.span>
                        }
                    </AnimatePresence>
                </button>
                {external && (
                    <a href={href ?? value} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-neutral-300 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                        <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                )}
            </div>
        </div>
    );

    if (href && !external) {
        return <a href={href} className="block">{inner}</a>;
    }
    return inner;
});

// ─── Delete Confirm ────────────────────────────────────────────────────────────

function DeleteConfirm({ contact, onConfirm, onCancel }: { contact: Contact; onConfirm: () => void; onCancel: () => void }) {
    return (
        <motion.div className="fixed inset-0 z-[70] flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
            <motion.div initial={{ scale: 0.95, y: 8 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 8 }}
                transition={{ duration: 0.15 }}
                className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full z-10">
                <div className="w-11 h-11 bg-red-50 rounded-full flex items-center justify-center mb-4">
                    <Trash2 className="w-5 h-5 text-red-500" />
                </div>
                <h3 className="font-semibold text-neutral-900 text-[15px] mb-1.5">Remove this contact?</h3>
                <p className="text-[13px] text-neutral-500 mb-5">"{contact.name}" will be permanently removed. This cannot be undone.</p>
                <div className="flex gap-3">
                    <button type="button" onClick={onCancel}
                        className="flex-1 h-9 rounded-xl border border-neutral-200 text-[13px] font-medium text-neutral-600 hover:bg-neutral-50 transition-colors outline-none">Cancel</button>
                    <button type="button" onClick={onConfirm}
                        className="flex-1 h-9 rounded-xl bg-red-500 hover:bg-red-600 text-white text-[13px] font-semibold transition-colors outline-none">Remove</button>
                </div>
            </motion.div>
        </motion.div>
    );
}

// ─── Main Drawer ───────────────────────────────────────────────────────────────

export function ContactDetailDrawer({ contact, onClose, onEdit, onDelete }: Props) {
    const [showDelete, setShowDelete] = useState(false);

    useEffect(() => {
        if (!contact) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !showDelete) onClose();
            if (e.key === 'e' && !showDelete && !(e.target instanceof HTMLInputElement)) onEdit(contact);
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [contact, onClose, onEdit, showDelete]);

    const initials = contact
        ? contact.name.split(/\s+/).slice(0, 2).map((w) => w[0] ?? '').join('').toUpperCase()
        : '';

    return (
        <AnimatePresence>
            {contact && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        key="contact-drawer-backdrop"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-40 bg-black/25 backdrop-blur-sm"
                        onClick={onClose} aria-hidden="true"
                    />

                    {/* Panel */}
                    <motion.aside
                        key="contact-drawer-panel"
                        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                        transition={{ duration: 0.26, ease: [0.4, 0, 0.2, 1] }}
                        className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-white border-l border-neutral-100 shadow-2xl flex flex-col"
                        role="dialog" aria-modal="true" aria-label={`Contact: ${contact.name}`}
                    >
                        {/* ── Header ─────────────────────────────────────────── */}
                        <div className="flex items-start gap-3 px-5 py-4 border-b border-neutral-100 shrink-0">
                            {/* Avatar */}
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 text-white font-bold text-base flex items-center justify-center shrink-0 select-none">
                                {initials}
                            </div>
                            <div className="min-w-0 flex-1">
                                <h2 className="font-bold text-neutral-900" style={{ fontSize: 15 }}>{contact.name}</h2>
                                {contact.role && <p className="text-[12.5px] text-neutral-500">{contact.role}</p>}
                                {contact.company && (
                                    <div className="flex items-center gap-1 text-[12px] text-neutral-400 mt-0.5">
                                        <Building2 className="w-3.5 h-3.5" />
                                        <span>{contact.company}</span>
                                    </div>
                                )}
                                {contact.relationship && (
                                    <span className="inline-block mt-1.5 px-2 h-5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-700 ring-1 ring-blue-100">
                                        {contact.relationship}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                                <button type="button" onClick={() => onEdit(contact)} title="Edit (E)"
                                    className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-400 hover:bg-blue-50 hover:text-blue-600 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-400">
                                    <Edit className="w-4 h-4" />
                                </button>
                                <button type="button" onClick={() => setShowDelete(true)} title="Remove"
                                    className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-400 hover:bg-red-50 hover:text-red-500 transition-colors outline-none">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                                <button type="button" onClick={onClose} title="Close"
                                    className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition-colors outline-none">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* ── Body ───────────────────────────────────────────── */}
                        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5" style={{ scrollbarWidth: 'thin' }}>

                            {/* Contact methods */}
                            <div>
                                <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-widest mb-3">Contact</p>
                                <div className="space-y-2">
                                    {contact.email && (
                                        <CopyableLink icon={Mail} value={contact.email} label="Email" href={`mailto:${contact.email}`} />
                                    )}
                                    {contact.phone && (
                                        <CopyableLink icon={Phone} value={contact.phone} label="Phone" href={`tel:${contact.phone}`} />
                                    )}
                                    {contact.linkedInUrl && (
                                        <CopyableLink icon={Linkedin} value={contact.linkedInUrl} label="LinkedIn" external />
                                    )}
                                </div>
                                {!contact.email && !contact.phone && !contact.linkedInUrl && (
                                    <p className="text-[12.5px] text-neutral-400 italic">No contact details added</p>
                                )}
                            </div>

                            {/* Notes */}
                            {contact.notes && (
                                <div className="pt-4 border-t border-neutral-100">
                                    <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-widest mb-3">
                                        <span className="inline-flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5" /> Notes</span>
                                    </p>
                                    <p className="text-[13px] text-neutral-700 whitespace-pre-wrap leading-relaxed">
                                        {contact.notes}
                                    </p>
                                </div>
                            )}

                            {/* Meta */}
                            <div className="pt-4 border-t border-neutral-100 space-y-1.5">
                                <div className="flex items-center gap-2 text-[11.5px] text-neutral-400">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>Added {formatDate(contact.createdAt)}</span>
                                </div>
                                <div className="flex items-center gap-2 text-[11.5px] text-neutral-400">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>Updated {formatRelativeDate(contact.updatedAt)}</span>
                                </div>
                            </div>
                        </div>

                        {/* ── Footer ─────────────────────────────────────────── */}
                        <div className="px-5 py-4 border-t border-neutral-100 bg-neutral-50/60 shrink-0 flex gap-3">
                            <button type="button" onClick={() => onEdit(contact)}
                                className="flex-1 h-9 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-semibold transition-colors flex items-center justify-center gap-1.5 outline-none">
                                <Edit className="w-4 h-4" /> Edit Contact
                            </button>
                            {contact.email && (
                                <a href={`mailto:${contact.email}`}
                                    className="h-9 px-4 rounded-xl border border-neutral-200 text-[13px] font-medium text-neutral-600 hover:bg-neutral-50 transition-colors flex items-center justify-center gap-1.5 outline-none">
                                    <Mail className="w-4 h-4" />
                                </a>
                            )}
                        </div>
                    </motion.aside>

                    {/* Delete confirm */}
                    <AnimatePresence>
                        {showDelete && (
                            <DeleteConfirm
                                contact={contact}
                                onConfirm={() => { onDelete(contact); setShowDelete(false); onClose(); }}
                                onCancel={() => setShowDelete(false)}
                            />
                        )}
                    </AnimatePresence>
                </>
            )}
        </AnimatePresence>
    );
}
