'use client';

import {
    useState, useMemo, useCallback, memo, useEffect, useRef,
} from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useAuth } from '@/lib/authContext';
import { useTemplates } from '@/hooks/useTemplates';
import { useToast } from '@/lib/toastContext';
import { useDebounce } from '@/hooks/useDebounce';
import { cn, formatDate, generateId } from '@/lib/utils';
import type { Template, TemplateFormData } from '@/types/template';
import { TEMPLATE_CATEGORIES, CATEGORY_COLORS } from '@/types/template';
import {
    Plus, Search, X, Copy, Check, Eye, Pencil, Trash2,
    MoreHorizontal, BookOpen, Filter, ChevronDown,
    FileText, Clock, ArrowRight,
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

type SortKey = 'createdAt' | 'updatedAt' | 'title' | 'useCount';

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
    { value: 'updatedAt', label: 'Recently updated' },
    { value: 'createdAt', label: 'Recently created' },
    { value: 'title', label: 'Alphabetical' },
    { value: 'useCount', label: 'Most used' },
];

function sortTemplates(list: Template[], key: SortKey): Template[] {
    return [...list].sort((a, b) => {
        if (key === 'title') return a.title.localeCompare(b.title);
        if (key === 'useCount') return b.useCount - a.useCount;
        return new Date(b[key]).getTime() - new Date(a[key]).getTime();
    });
}

// ─── Category Pill ────────────────────────────────────────────────────────────

function CategoryPill({ category, sm }: { category: string; sm?: boolean }) {
    const cls = CATEGORY_COLORS[category] ?? CATEGORY_COLORS['Other'];
    return (
        <span
            className={cn(
                'inline-flex items-center rounded-full ring-1 font-medium select-none whitespace-nowrap',
                sm ? 'px-1.5 h-5 text-[10px]' : 'px-2 h-6 text-[11px]',
                cls
            )}
        >
            {category}
        </span>
    );
}

// ─── Copy Button ──────────────────────────────────────────────────────────────

interface CopyButtonProps {
    content: string;
    onCopied?: () => void;
    className?: string;
    label?: string;
}

function CopyButton({ content, onCopied, className, label }: CopyButtonProps) {
    const [copied, setCopied] = useState(false);
    const timer = useRef<ReturnType<typeof setTimeout>>();

    const handleCopy = useCallback(async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(content);
            setCopied(true);
            onCopied?.();
            timer.current = setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback for browsers without clipboard API
            const ta = document.createElement('textarea');
            ta.value = content;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            setCopied(true);
            timer.current = setTimeout(() => setCopied(false), 2000);
        }
    }, [content, onCopied]);

    useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

    return (
        <button
            type="button"
            onClick={handleCopy}
            aria-label={copied ? 'Copied!' : 'Copy to clipboard'}
            className={cn(
                'inline-flex items-center gap-1.5 rounded-lg font-medium transition-all duration-150 outline-none',
                'focus-visible:ring-2 focus-visible:ring-blue-400',
                copied
                    ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200',
                label ? 'h-8 px-3 text-[13px]' : 'h-7 w-7 justify-center',
                className
            )}
        >
            <AnimatePresence mode="wait" initial={false}>
                {copied ? (
                    <motion.span key="check" initial={{ scale: 0.6 }} animate={{ scale: 1 }} exit={{ scale: 0.6 }} transition={{ duration: 0.12 }}>
                        <Check style={{ width: 13, height: 13 }} />
                    </motion.span>
                ) : (
                    <motion.span key="copy" initial={{ scale: 0.6 }} animate={{ scale: 1 }} exit={{ scale: 0.6 }} transition={{ duration: 0.12 }}>
                        <Copy style={{ width: 13, height: 13 }} />
                    </motion.span>
                )}
            </AnimatePresence>
            {label && <span>{copied ? 'Copied!' : label}</span>}
        </button>
    );
}

// ─── Card Actions Menu ────────────────────────────────────────────────────────

interface CardMenuProps {
    onPreview: () => void;
    onEdit: () => void;
    onDuplicate: () => void;
    onDelete: () => void;
}

function CardMenu({ onPreview, onEdit, onDuplicate, onDelete }: CardMenuProps) {
    const [open, setOpen] = useState(false);
    const close = () => setOpen(false);

    const items = [
        { label: 'Preview', Icon: Eye, action: () => { onPreview(); close(); } },
        { label: 'Edit', Icon: Pencil, action: () => { onEdit(); close(); } },
        { label: 'Duplicate', Icon: FileText, action: () => { onDuplicate(); close(); } },
        { label: 'Delete', Icon: Trash2, action: () => { onDelete(); close(); }, danger: true },
    ];

    return (
        <div className="relative">
            <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
                aria-label="Template actions"
                aria-haspopup="menu"
                aria-expanded={open}
                className={cn(
                    'w-7 h-7 rounded-lg flex items-center justify-center',
                    'text-neutral-400 outline-none focus-visible:ring-2 focus-visible:ring-blue-400',
                    'transition-colors duration-100',
                    open ? 'bg-neutral-100 text-neutral-600 opacity-100'
                        : 'opacity-0 group-hover:opacity-100 hover:bg-neutral-100 hover:text-neutral-600'
                )}
            >
                <MoreHorizontal style={{ width: 14, height: 14 }} />
            </button>

            <AnimatePresence>
                {open && (
                    <>
                        <div className="fixed inset-0 z-20" onClick={close} />
                        <motion.div
                            role="menu"
                            initial={{ opacity: 0, scale: 0.95, y: -4 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -4 }}
                            transition={{ duration: 0.1, ease: 'easeOut' }}
                            className="absolute right-0 top-9 z-30 w-40 bg-white rounded-xl border border-neutral-100 shadow-lg py-1 overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {items.map(({ label, Icon, action, danger }) => (
                                <button
                                    key={label}
                                    type="button"
                                    role="menuitem"
                                    onClick={action}
                                    className={cn(
                                        'w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-left transition-colors',
                                        'outline-none focus-visible:bg-neutral-50',
                                        danger ? 'text-red-500 hover:bg-red-50' : 'text-neutral-700 hover:bg-neutral-50'
                                    )}
                                >
                                    <Icon style={{ width: 13, height: 13, strokeWidth: 1.75 }} />
                                    {label}
                                </button>
                            ))}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── Template Card ────────────────────────────────────────────────────────────

interface TemplateCardProps {
    template: Template;
    onPreview: (t: Template) => void;
    onEdit: (t: Template) => void;
    onDuplicate: (id: string) => void;
    onDelete: (id: string) => void;
    onCopied: (id: string) => void;
}

const TemplateCard = memo(function TemplateCard({
    template: t, onPreview, onEdit, onDuplicate, onDelete, onCopied,
}: TemplateCardProps) {
    const shouldReduceMotion = useReducedMotion();

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.18, ease: 'easeOut' }}
            whileHover={shouldReduceMotion ? {} : { y: -2, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
            className={cn(
                'group relative flex flex-col bg-white rounded-2xl border border-neutral-100/80',
                'shadow-sm overflow-hidden cursor-pointer outline-none',
                'focus-visible:ring-2 focus-visible:ring-blue-400'
            )}
            tabIndex={0}
            role="article"
            aria-label={`Template: ${t.title}`}
            onClick={() => onPreview(t)}
            onKeyDown={(e) => { if (e.key === 'Enter') onPreview(t); }}
        >
            {/* Top bar: category + actions */}
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
                <CategoryPill category={t.category} />
                <CardMenu
                    onPreview={() => onPreview(t)}
                    onEdit={() => onEdit(t)}
                    onDuplicate={() => onDuplicate(t.id)}
                    onDelete={() => onDelete(t.id)}
                />
            </div>

            {/* Title */}
            <h3
                className="px-4 font-semibold text-neutral-900 truncate"
                style={{ fontSize: 14.5 }}
                title={t.title}
            >
                {t.title}
            </h3>

            {/* Content preview */}
            <div className="mx-4 mt-2.5 mb-3 rounded-xl bg-neutral-50 border border-neutral-100 px-3 py-2.5 flex-1">
                <p
                    className="text-neutral-500 leading-relaxed line-clamp-4 select-none"
                    style={{ fontSize: 12, fontFamily: 'ui-monospace, "Cascadia Code", monospace', whiteSpace: 'pre-wrap' }}
                >
                    {t.content}
                </p>
            </div>

            {/* Footer meta */}
            <div className="flex items-center justify-between px-4 pb-3.5 pt-0.5">
                <div className="flex items-center gap-1 text-neutral-400" style={{ fontSize: 11 }}>
                    <Clock style={{ width: 11, height: 11 }} />
                    <span>{formatDate(t.updatedAt)}</span>
                </div>

                {/* Copy — primary quick action */}
                <CopyButton
                    content={t.content}
                    onCopied={() => onCopied(t.id)}
                    label="Copy"
                />
            </div>
        </motion.div>
    );
}, (prev, next) =>
    prev.template.id === next.template.id &&
    prev.template.title === next.template.title &&
    prev.template.category === next.template.category &&
    prev.template.content === next.template.content &&
    prev.template.updatedAt === next.template.updatedAt
);

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ isFiltered, onClear, onCreate }: { isFiltered: boolean; onClear: () => void; onCreate: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-50 to-violet-50 border border-neutral-100 flex items-center justify-center mb-5 shadow-sm">
                <BookOpen className="text-blue-500" style={{ width: 28, height: 28, strokeWidth: 1.5 }} />
            </div>
            <h3 className="font-semibold text-neutral-800 mb-1.5" style={{ fontSize: 16 }}>
                {isFiltered ? 'No templates match' : 'Your Library is empty'}
            </h3>
            <p className="text-neutral-400 max-w-xs leading-relaxed" style={{ fontSize: 13 }}>
                {isFiltered
                    ? 'Try adjusting your search, category, or clear the filters to see all templates.'
                    : 'Build your personal library of reusable outreach messages, follow-ups, and email templates.'}
            </p>
            <div className="mt-6">
                {isFiltered ? (
                    <button
                        onClick={onClear}
                        className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl text-[13px] font-medium border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition-colors"
                    >
                        <X style={{ width: 13, height: 13 }} /> Clear filters
                    </button>
                ) : (
                    <button
                        onClick={onCreate}
                        className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl text-[13px] font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm"
                    >
                        <Plus style={{ width: 14, height: 14, strokeWidth: 2.5 }} /> Create template
                    </button>
                )}
            </div>
        </div>
    );
}

// ─── Preview Drawer ───────────────────────────────────────────────────────────

interface PreviewDrawerProps {
    template: Template | null;
    onClose: () => void;
    onEdit: (t: Template) => void;
    onCopied: (id: string) => void;
}

function PreviewDrawer({ template, onClose, onEdit, onCopied }: PreviewDrawerProps) {
    const shouldReduceMotion = useReducedMotion();

    // ESC to close
    useEffect(() => {
        if (!template) return;
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [template, onClose]);

    return (
        <AnimatePresence>
            {template && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        key="backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
                        onClick={onClose}
                        aria-hidden="true"
                    />

                    {/* Panel */}
                    <motion.aside
                        key="drawer"
                        initial={{ x: shouldReduceMotion ? 0 : '100%', opacity: shouldReduceMotion ? 0 : 1 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: shouldReduceMotion ? 0 : '100%', opacity: shouldReduceMotion ? 0 : 1 }}
                        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                        className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-white border-l border-neutral-100 shadow-2xl flex flex-col"
                        role="dialog"
                        aria-modal="true"
                        aria-label={`Preview: ${template.title}`}
                    >
                        {/* Drawer header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 shrink-0">
                            <div className="min-w-0 flex-1">
                                <h2 className="font-semibold text-neutral-900 truncate" style={{ fontSize: 15 }}>
                                    {template.title}
                                </h2>
                                <div className="mt-1">
                                    <CategoryPill category={template.category} sm />
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                aria-label="Close preview"
                                className="ml-3 w-8 h-8 flex items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-400 shrink-0"
                            >
                                <X style={{ width: 16, height: 16 }} />
                            </button>
                        </div>

                        {/* Scrollable content */}
                        <div className="flex-1 overflow-y-auto px-5 py-4" style={{ scrollbarWidth: 'thin' }}>
                            <div className="rounded-2xl bg-neutral-50 border border-neutral-100 px-4 py-4">
                                <pre
                                    className="text-neutral-700 leading-relaxed whitespace-pre-wrap break-words"
                                    style={{ fontSize: 13.5, fontFamily: 'ui-monospace, "Cascadia Code", monospace' }}
                                >
                                    {template.content}
                                </pre>
                            </div>

                            <div className="flex items-center gap-2 text-neutral-400 mt-3" style={{ fontSize: 11 }}>
                                <Clock style={{ width: 11, height: 11 }} />
                                Updated {formatDate(template.updatedAt)}
                                <span className="mx-1">·</span>
                                {template.content.split(/\s+/).filter(Boolean).length} words
                            </div>
                        </div>

                        {/* Drawer footer */}
                        <div className="flex items-center gap-3 px-5 py-4 border-t border-neutral-100 bg-neutral-50/60 shrink-0">
                            <CopyButton
                                content={template.content}
                                onCopied={() => onCopied(template.id)}
                                label="Copy template"
                                className="flex-1 justify-center"
                            />
                            <button
                                type="button"
                                onClick={() => { onEdit(template); onClose(); }}
                                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg text-[13px] font-medium border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                            >
                                <Pencil style={{ width: 13, height: 13 }} /> Edit
                            </button>
                        </div>
                    </motion.aside>
                </>
            )}
        </AnimatePresence>
    );
}

// ─── Editor Modal ─────────────────────────────────────────────────────────────

type ModalMode = 'create' | 'edit' | 'duplicate';

interface EditorModalProps {
    mode: ModalMode;
    initial?: Partial<TemplateFormData>;
    onSave: (data: TemplateFormData) => void;
    onClose: () => void;
    isSaving: boolean;
}

function EditorModal({ mode, initial, onSave, onClose, isSaving }: EditorModalProps) {
    const [title, setTitle] = useState(initial?.title ?? '');
    const [category, setCategory] = useState<string>(initial?.category ?? TEMPLATE_CATEGORIES[0]);
    const [content, setContent] = useState(initial?.content ?? '');
    const [dirty, setDirty] = useState(false);
    const titleRef = useRef<HTMLInputElement>(null);

    // Auto-focus
    useEffect(() => { setTimeout(() => titleRef.current?.focus(), 50); }, []);

    // ESC guard
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (dirty) {
                    if (window.confirm('Discard unsaved changes?')) onClose();
                } else {
                    onClose();
                }
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [dirty, onClose]);

    const CONTENT_MAX = 4000;
    const errors = {
        title: title.trim().length === 0 ? 'Title is required' : null,
        content: content.trim().length === 0 ? 'Content is required' : null,
    };
    const isValid = !errors.title && !errors.content;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isValid) return;
        onSave({ title: title.trim(), category, content: content.trim() });
    };

    const titles: Record<ModalMode, string> = {
        create: 'New Template', edit: 'Edit Template', duplicate: 'Duplicate Template',
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-50 bg-black/25 backdrop-blur-sm"
                onClick={() => { if (!dirty) onClose(); else if (window.confirm('Discard changes?')) onClose(); }}
                aria-hidden="true"
            />

            {/* Modal */}
            <motion.div
                role="dialog"
                aria-modal="true"
                aria-label={titles[mode]}
                initial={{ opacity: 0, scale: 0.97, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, y: 8 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
                <form
                    onSubmit={handleSubmit}
                    className="pointer-events-auto w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Modal header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 shrink-0">
                        <h2 className="font-semibold text-neutral-900" style={{ fontSize: 15 }}>
                            {titles[mode]}
                        </h2>
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Close"
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                        >
                            <X style={{ width: 16, height: 16 }} />
                        </button>
                    </div>

                    {/* Fields */}
                    <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">

                        {/* Title */}
                        <div>
                            <label htmlFor="tmpl-title" className="block text-[12px] font-semibold text-neutral-600 mb-1.5 uppercase tracking-wide">
                                Title <span className="text-red-400">*</span>
                            </label>
                            <input
                                id="tmpl-title"
                                ref={titleRef}
                                type="text"
                                value={title}
                                onChange={(e) => { setTitle(e.target.value); setDirty(true); }}
                                placeholder="e.g., Cold outreach — Software Engineer"
                                maxLength={120}
                                className={cn(
                                    'w-full h-10 px-3 rounded-xl border text-[13.5px] text-neutral-900 placeholder:text-neutral-300',
                                    'outline-none transition-shadow duration-150',
                                    'focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400',
                                    errors.title && dirty ? 'border-red-300' : 'border-neutral-200'
                                )}
                            />
                        </div>

                        {/* Category */}
                        <div>
                            <label htmlFor="tmpl-category" className="block text-[12px] font-semibold text-neutral-600 mb-1.5 uppercase tracking-wide">
                                Category <span className="text-red-400">*</span>
                            </label>
                            <select
                                id="tmpl-category"
                                value={category}
                                onChange={(e) => { setCategory(e.target.value); setDirty(true); }}
                                className="w-full h-10 px-3 rounded-xl border border-neutral-200 text-[13.5px] text-neutral-900 outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400 appearance-none cursor-pointer transition-shadow"
                                style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23a1a1aa\' stroke-width=\'2\'%3E%3Cpath d=\'m6 9 6 6 6-6\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
                            >
                                {TEMPLATE_CATEGORIES.map((c) => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>

                        {/* Content */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label htmlFor="tmpl-content" className="block text-[12px] font-semibold text-neutral-600 uppercase tracking-wide">
                                    Content <span className="text-red-400">*</span>
                                </label>
                                <span
                                    className={cn('text-[11px]', content.length > CONTENT_MAX * 0.9 ? 'text-red-400' : 'text-neutral-400')}
                                >
                                    {content.length}/{CONTENT_MAX}
                                </span>
                            </div>
                            <textarea
                                id="tmpl-content"
                                value={content}
                                onChange={(e) => { setContent(e.target.value.slice(0, CONTENT_MAX)); setDirty(true); }}
                                placeholder="Write your template content here…"
                                rows={10}
                                className={cn(
                                    'w-full px-3 py-2.5 rounded-xl border text-[13px] text-neutral-800 placeholder:text-neutral-300',
                                    'resize-y outline-none transition-shadow duration-150 leading-relaxed',
                                    'focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400',
                                    errors.content && dirty ? 'border-red-300' : 'border-neutral-200'
                                )}
                                style={{ fontFamily: 'ui-monospace, "Cascadia Code", monospace', minHeight: 180, maxHeight: 420 }}
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-neutral-100 bg-neutral-50/60 shrink-0">
                        <button
                            type="button"
                            onClick={onClose}
                            className="h-9 px-4 rounded-xl text-[13px] font-medium text-neutral-600 hover:bg-neutral-100 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!isValid || isSaving}
                            className={cn(
                                'h-9 px-5 rounded-xl text-[13px] font-semibold text-white transition-colors',
                                'outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-1',
                                isValid && !isSaving
                                    ? 'bg-blue-600 hover:bg-blue-700 shadow-sm'
                                    : 'bg-blue-300 cursor-not-allowed'
                            )}
                        >
                            {isSaving ? 'Saving…' : mode === 'edit' ? 'Save changes' : 'Create template'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface EditorState {
    open: boolean;
    mode: ModalMode;
    initial?: Partial<TemplateFormData>;
    editingId?: string;
}

export default function LibraryPage() {
    const { user, isLoading } = useAuth();
    const { templates, createTemplate, updateTemplate, deleteTemplate, duplicateTemplate, incrementUseCount } = useTemplates(user?.id ?? '');
    const { success, error: toastError } = useToast();

    // ── Search / filter state ─────────────────────────────────────────────────
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [sortKey, setSortKey] = useState<SortKey>('updatedAt');
    const debouncedSearch = useDebounce(search, 280);

    // ── UI state ──────────────────────────────────────────────────────────────
    const [preview, setPreview] = useState<Template | null>(null);
    const [editor, setEditor] = useState<EditorState>({ open: false, mode: 'create' });
    const [isSaving, setIsSaving] = useState(false);

    // ── Derived categories (dynamic from actual data) ─────────────────────────
    const uniqueCategories = useMemo(() => {
        const set = new Set(templates.map((t) => t.category));
        return Array.from(set).sort();
    }, [templates]);

    // ── Filtered + sorted templates ───────────────────────────────────────────
    const displayed = useMemo(() => {
        let list = templates;
        if (categoryFilter) list = list.filter((t) => t.category === categoryFilter);
        if (debouncedSearch) {
            const q = debouncedSearch.toLowerCase();
            list = list.filter((t) =>
                t.title.toLowerCase().includes(q) ||
                t.content.toLowerCase().includes(q) ||
                t.category.toLowerCase().includes(q)
            );
        }
        return sortTemplates(list, sortKey);
    }, [templates, categoryFilter, debouncedSearch, sortKey]);

    // ── Handlers ──────────────────────────────────────────────────────────────
    const openCreate = useCallback(() => {
        setEditor({ open: true, mode: 'create' });
    }, []);

    const openEdit = useCallback((t: Template) => {
        setEditor({ open: true, mode: 'edit', editingId: t.id, initial: { title: t.title, category: t.category, content: t.content } });
    }, []);

    const handleSave = useCallback((data: TemplateFormData) => {
        setIsSaving(true);
        setTimeout(() => {
            try {
                if (editor.mode === 'edit' && editor.editingId) {
                    updateTemplate(editor.editingId, data);
                    success('Updated', `"${data.title}" saved`);
                } else {
                    createTemplate(data);
                    success('Created', `"${data.title}" added to Library`);
                }
                setEditor({ open: false, mode: 'create' });
            } catch {
                toastError?.('Error', 'Could not save template');
            } finally {
                setIsSaving(false);
            }
        }, 120); // simulate brief async for loading state
    }, [editor, createTemplate, updateTemplate, success, toastError]);

    const handleDuplicate = useCallback((id: string) => {
        const t = duplicateTemplate(id);
        if (t) success('Duplicated', `"${t.title}" added to Library`);
    }, [duplicateTemplate, success]);

    const handleDelete = useCallback((id: string) => {
        const t = templates.find((x) => x.id === id);
        deleteTemplate(id);
        if (preview?.id === id) setPreview(null);
        success('Deleted', t ? `"${t.title}" removed` : 'Template removed');
    }, [templates, deleteTemplate, preview, success]);

    const handleCopied = useCallback((id: string) => {
        incrementUseCount(id);
        success('Copied!', 'Template copied to clipboard');
    }, [incrementUseCount, success]);

    const clearFilters = useCallback(() => {
        setSearch(''); setCategoryFilter('');
    }, []);

    const isFiltered = Boolean(debouncedSearch || categoryFilter);

    // ── Loading ───────────────────────────────────────────────────────────────
    if (isLoading) {
        return (
            <div className="max-w-7xl mx-auto animate-pulse space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="h-5 w-20 bg-neutral-200 rounded mb-1.5" />
                        <div className="h-3.5 w-40 bg-neutral-100 rounded" />
                    </div>
                    <div className="h-9 w-36 bg-neutral-200 rounded-xl" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="h-52 bg-neutral-100 rounded-2xl" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto">

            {/* ── Page Header ─────────────────────────────────────────── */}
            <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
                <div>
                    <h1 className="font-bold text-neutral-900" style={{ fontSize: 20 }}>Library</h1>
                    <p className="text-neutral-400 mt-0.5" style={{ fontSize: 13 }}>
                        Reusable outreach templates · {templates.length} saved
                    </p>
                </div>
                <button
                    type="button"
                    onClick={openCreate}
                    className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl text-[13px] font-semibold bg-blue-600 text-white shadow-sm hover:bg-blue-700 active:bg-blue-800 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-1"
                    aria-label="Create new template"
                >
                    <Plus style={{ width: 14, height: 14, strokeWidth: 2.5 }} />
                    New Template
                </button>
            </div>

            {/* ── Command Toolbar ─────────────────────────────────────── */}
            <div className="flex items-center gap-3 mb-5 flex-wrap">
                {/* Search */}
                <div className="relative flex-1 min-w-48">
                    <Search
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
                        style={{ width: 14, height: 14 }}
                    />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search templates…"
                        aria-label="Search templates"
                        className="w-full h-9 pl-8 pr-8 rounded-xl border border-neutral-200 bg-white text-[13px] text-neutral-800 placeholder:text-neutral-400 outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400 transition-shadow"
                    />
                    <AnimatePresence>
                        {search && (
                            <motion.button
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                type="button"
                                onClick={() => setSearch('')}
                                aria-label="Clear search"
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                            >
                                <X style={{ width: 13, height: 13 }} />
                            </motion.button>
                        )}
                    </AnimatePresence>
                </div>

                {/* Category filter */}
                <div className="relative">
                    <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" style={{ width: 13, height: 13 }} />
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        aria-label="Filter by category"
                        className="h-9 pl-7 pr-8 rounded-xl border border-neutral-200 bg-white text-[13px] text-neutral-700 outline-none focus:ring-2 focus:ring-blue-400/40 appearance-none cursor-pointer"
                        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'10\' height=\'10\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23a1a1aa\' stroke-width=\'2\'%3E%3Cpath d=\'m6 9 6 6 6-6\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center' }}
                    >
                        <option value="">All categories</option>
                        {uniqueCategories.map((c) => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                </div>

                {/* Sort */}
                <div className="relative">
                    <select
                        value={sortKey}
                        onChange={(e) => setSortKey(e.target.value as SortKey)}
                        aria-label="Sort templates"
                        className="h-9 pl-3 pr-8 rounded-xl border border-neutral-200 bg-white text-[13px] text-neutral-700 outline-none focus:ring-2 focus:ring-blue-400/40 appearance-none cursor-pointer"
                        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'10\' height=\'10\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23a1a1aa\' stroke-width=\'2\'%3E%3Cpath d=\'m6 9 6 6 6-6\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center' }}
                    >
                        {SORT_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                    </select>
                </div>

                {/* Active filter chips */}
                <AnimatePresence>
                    {isFiltered && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                            type="button"
                            onClick={clearFilters}
                            className="inline-flex items-center gap-1 h-9 px-3 rounded-xl border border-neutral-200 text-[12px] text-neutral-500 hover:bg-neutral-50 transition-colors"
                        >
                            <X style={{ width: 11, height: 11 }} /> Clear
                            <span className="ml-0.5 font-semibold text-neutral-700">{displayed.length}</span>
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>

            {/* ── Template Grid ────────────────────────────────────────── */}
            {displayed.length === 0 ? (
                <EmptyState isFiltered={isFiltered} onClear={clearFilters} onCreate={openCreate} />
            ) : (
                <motion.div
                    layout
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
                >
                    <AnimatePresence mode="popLayout">
                        {displayed.map((t) => (
                            <TemplateCard
                                key={t.id}
                                template={t}
                                onPreview={setPreview}
                                onEdit={openEdit}
                                onDuplicate={handleDuplicate}
                                onDelete={handleDelete}
                                onCopied={handleCopied}
                            />
                        ))}
                    </AnimatePresence>
                </motion.div>
            )}

            {/* ── Preview Drawer ────────────────────────────────────────── */}
            <PreviewDrawer
                template={preview}
                onClose={() => setPreview(null)}
                onEdit={(t) => { setPreview(null); openEdit(t); }}
                onCopied={handleCopied}
            />

            {/* ── Editor Modal ─────────────────────────────────────────── */}
            <AnimatePresence>
                {editor.open && (
                    <EditorModal
                        key={editor.editingId ?? 'new'}
                        mode={editor.mode}
                        initial={editor.initial}
                        onSave={handleSave}
                        onClose={() => setEditor({ open: false, mode: 'create' })}
                        isSaving={isSaving}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
