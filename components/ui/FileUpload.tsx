'use client';

import React, { useRef, useState, useCallback, memo } from 'react';
import {
    Upload, X, FileText, AlertCircle, Loader2,
    CheckCircle2, RotateCcw, Link, ExternalLink,
    HardDrive,
} from 'lucide-react';
import { cn, formatFileSize } from '@/lib/utils';
import type { Attachment, FileAttachment, DriveLinkAttachment } from '@/types';

// ─── Feature flags ────────────────────────────────────────────────────────────

const ENABLE_DRIVE_LINKS = true;

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_DATA_URL_BYTES = 400_000;
const ALLOWED_EXTENSIONS = /\.(pdf|doc|docx|txt|png|jpg|jpeg|gif|webp)$/i;
const ALLOWED_TYPES = new Set([
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp',
]);

/** Patterns accepted as valid Google Drive / Docs URLs */
const DRIVE_URL_PATTERNS = [
    /^https:\/\/drive\.google\.com\/file\//,
    /^https:\/\/drive\.google\.com\/open\?/,
    /^https:\/\/docs\.google\.com\//,
];

// ─── Types ────────────────────────────────────────────────────────────────────

type AttachmentMode = 'file' | 'drive';

interface PendingFile {
    id: string;
    name: string;
    size: number;
    progress: number;
    status: 'loading' | 'ready' | 'error';
    error?: string;
    largeFileWarning?: boolean;
}

interface FileUploadProps {
    attachments: Attachment[];
    onChange: (attachments: Attachment[]) => void;
    maxFileSize?: number;
    accept?: string;
    className?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateId(): string {
    return typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function normalizeDriveUrl(raw: string): string | null {
    const trimmed = raw.trim();
    // Ensure https
    const url = trimmed.startsWith('http://') ? trimmed.replace('http://', 'https://') : trimmed;
    const isValid = DRIVE_URL_PATTERNS.some((p) => p.test(url));
    if (!isValid) return null;
    // Strip common tracking params
    try {
        const parsed = new URL(url);
        ['utm_source', 'utm_medium', 'utm_campaign', 'fbclid', 'gclid'].forEach((p) => { parsed.searchParams.delete(p); });
        return parsed.toString();
    } catch { return null; }
}

// ─── Mode Tab ─────────────────────────────────────────────────────────────────

const ModeTab = memo(function ModeTab({
    mode, active, label, icon: Icon, onClick,
}: { mode: AttachmentMode; active: boolean; label: string; icon: React.ElementType; onClick: () => void }) {
    return (
        <button
            type="button" role="tab" aria-selected={active} onClick={onClick}
            className={cn(
                'flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg text-[13px] font-medium transition-all duration-150',
                'outline-none focus-visible:ring-2 focus-visible:ring-blue-400',
                active ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700',
            )}
        >
            <Icon className="w-3.5 h-3.5" />
            {label}
        </button>
    );
});

// ─── Drive Link Panel ─────────────────────────────────────────────────────────

function DriveLinkPanel({
    attachments, onAdd,
}: { attachments: Attachment[]; onAdd: (att: DriveLinkAttachment) => void }) {
    const [url, setUrl] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleSave = () => {
        setError(null);
        const normalized = normalizeDriveUrl(url);
        if (!normalized) {
            setError('Please enter a valid Google Drive or Docs URL.');
            return;
        }
        // Duplicate URL check
        const isDuplicate = attachments.some(
            (a) => a.kind === 'drive' && a.url === normalized
        );
        if (isDuplicate) {
            setError('This Drive link is already attached.');
            return;
        }
        const att: DriveLinkAttachment = {
            id: generateId(), kind: 'drive',
            name: name.trim() || 'Drive link',
            url: normalized,
            uploadedAt: new Date().toISOString(),
        };
        onAdd(att);
        setUrl(''); setName('');
    };

    return (
        <div className="space-y-3">
            <div className="space-y-2">
                <input
                    type="url" value={url} onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://drive.google.com/file/… or docs.google.com/…"
                    aria-label="Google Drive URL"
                    className={cn(
                        'w-full h-9 px-3 rounded-lg border text-sm text-neutral-800 placeholder:text-neutral-400',
                        'outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400 transition-shadow',
                        error ? 'border-red-300' : 'border-gray-300'
                    )}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSave(); } }}
                />
                <input
                    type="text" value={name} onChange={(e) => setName(e.target.value)}
                    placeholder="Display name (optional)"
                    aria-label="Display name for link"
                    className="w-full h-9 px-3 rounded-lg border border-gray-300 text-sm text-neutral-800 placeholder:text-neutral-400 outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400 transition-shadow"
                />
            </div>
            {error && (
                <p role="alert" className="flex items-center gap-1.5 text-xs text-red-600">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
                </p>
            )}
            <div className="flex items-center gap-2">
                <button
                    type="button" onClick={handleSave}
                    disabled={!url.trim()}
                    className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[13px] font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                >
                    <Link className="w-3.5 h-3.5" /> Save Link
                </button>
                <p className="text-xs text-neutral-400">
                    Accepted: drive.google.com · docs.google.com
                </p>
            </div>
        </div>
    );
}

// ─── File Drop Zone ───────────────────────────────────────────────────────────

function FileDropZone({
    onFiles, maxFileSize, accept,
}: { onFiles: (files: FileList) => void; maxFileSize: number; accept: string }) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [dragging, setDragging] = useState(false);

    return (
        <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files.length) onFiles(e.dataTransfer.files); }}
            onClick={() => inputRef.current?.click()}
            role="button" tabIndex={0} aria-label="Upload files"
            onKeyDown={(e) => { if (e.key === 'Enter') inputRef.current?.click(); }}
            className={cn(
                'relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors',
                dragging ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
            )}
        >
            <input
                ref={inputRef} type="file" multiple accept={accept} className="sr-only"
                onChange={(e) => { if (e.target.files) onFiles(e.target.files); e.target.value = ''; }}
            />
            <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
            <p className="text-sm font-medium text-gray-700">Click or drag files to upload</p>
            <p className="text-xs text-gray-400 mt-1">
                PDF, Word, TXT, Images · Max {formatFileSize(maxFileSize)}
            </p>
        </div>
    );
}

// ─── Attachment List Item ─────────────────────────────────────────────────────

const AttachmentItem = memo(function AttachmentItem({
    attachment, isConfirming, onRemoveClick,
}: { attachment: Attachment; isConfirming: boolean; onRemoveClick: (id: string, hasData: boolean) => void }) {
    if (attachment.kind === 'drive') {
        return (
            <li className="flex items-center gap-3 p-3 rounded-lg border border-blue-100 bg-blue-50">
                <HardDrive className="w-4 h-4 text-blue-500 shrink-0" />
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{attachment.name}</p>
                    <p className="text-xs text-blue-500 truncate">{attachment.url}</p>
                </div>
                <a
                    href={attachment.url} target="_blank" rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    aria-label="Open Drive link"
                    className="text-blue-400 hover:text-blue-600 transition-colors"
                >
                    <ExternalLink className="w-4 h-4" />
                </a>
                <button
                    type="button"
                    onClick={() => onRemoveClick(attachment.id, false)}
                    aria-label={`Remove ${attachment.name}`}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </li>
        );
    }

    // FileAttachment
    return (
        <li className={cn(
            'flex items-center gap-3 p-3 rounded-lg border transition-colors',
            isConfirming ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'
        )}>
            {attachment.dataUrl
                ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                : <FileText className="w-4 h-4 text-amber-500 shrink-0" />
            }
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{attachment.name}</p>
                <p className="text-xs text-gray-400 flex items-center gap-1.5">
                    {formatFileSize(attachment.size)}
                    {!attachment.dataUrl && (
                        <span className="text-amber-600">· no preview (stored as metadata)</span>
                    )}
                </p>
            </div>
            <button
                type="button"
                onClick={() => onRemoveClick(attachment.id, Boolean(attachment.dataUrl))}
                aria-label={isConfirming ? `Confirm remove ${attachment.name}` : `Remove ${attachment.name}`}
                className={cn(
                    'text-xs font-medium px-2 py-1 rounded transition-colors',
                    isConfirming ? 'bg-red-500 text-white hover:bg-red-600' : 'text-gray-400 hover:text-red-500'
                )}
            >
                {isConfirming ? 'Confirm' : <X className="w-4 h-4" />}
            </button>
        </li>
    );
});

// ─── Main FileUpload Component ────────────────────────────────────────────────

export function FileUpload({
    attachments, onChange,
    maxFileSize = 5 * 1024 * 1024,
    accept = '.pdf,.doc,.docx,.txt,.png,.jpg,.jpeg',
    className,
}: FileUploadProps) {
    const [mode, setMode] = useState<AttachmentMode>('file');
    const [globalError, setGlobalError] = useState<string | null>(null);
    const [pending, setPending] = useState<PendingFile[]>([]);
    const [confirmingId, setConfirmingId] = useState<string | null>(null);

    // ── Validation ─────────────────────────────────────────────────────────────
    const isDuplicate = useCallback((file: File): boolean => {
        return (
            attachments.some((a) => a.kind !== 'drive' && a.name === file.name && (a as FileAttachment).size === file.size) ||
            pending.some((p) => p.name === file.name && p.size === file.size)
        );
    }, [attachments, pending]);

    const validateFile = useCallback((file: File): string | null => {
        if (file.size > maxFileSize) return `"${file.name}" exceeds ${formatFileSize(maxFileSize)} limit.`;
        if (!ALLOWED_EXTENSIONS.test(file.name) && file.type && !ALLOWED_TYPES.has(file.type))
            return `"${file.name}" is not an allowed file type.`;
        if (isDuplicate(file)) return `"${file.name}" is already attached.`;
        return null;
    }, [maxFileSize, isDuplicate]);

    // ── Process Files ──────────────────────────────────────────────────────────
    const processFiles = useCallback((files: FileList) => {
        setGlobalError(null);
        const errors: string[] = [];

        Array.from(files).forEach((file) => {
            const err = validateFile(file);
            if (err) { errors.push(err); return; }

            const pendingId = generateId();
            setPending((prev) => [...prev, { id: pendingId, name: file.name, size: file.size, progress: 0, status: 'loading' }]);

            const reader = new FileReader();
            reader.onprogress = (e) => {
                if (e.lengthComputable) {
                    const pct = Math.round((e.loaded / e.total) * 100);
                    setPending((prev) => prev.map((p) => p.id === pendingId ? { ...p, progress: pct } : p));
                }
            };
            reader.onload = (e) => {
                const dataUrl = e.target?.result as string;
                const isLargeFile = dataUrl.length > MAX_DATA_URL_BYTES;
                const att: FileAttachment = {
                    id: pendingId, kind: 'file',
                    name: file.name, size: file.size, type: file.type,
                    dataUrl: isLargeFile ? undefined : dataUrl,
                    uploadedAt: new Date().toISOString(),
                };
                onChange([...attachments, att]);
                setPending((prev) => prev.filter((p) => p.id !== pendingId));
                if (isLargeFile) {
                    // Transient large-file warning row
                    const warnId = pendingId + '_warn';
                    setPending((prev) => [...prev, { id: warnId, name: file.name, size: file.size, progress: 100, status: 'ready', largeFileWarning: true }]);
                    setTimeout(() => setPending((prev) => prev.filter((p) => p.id !== warnId)), 4000);
                }
            };
            reader.onerror = () => {
                setPending((prev) => prev.map((p) => p.id === pendingId ? { ...p, status: 'error', error: 'Failed to read file.' } : p));
            };
            try { reader.readAsDataURL(file); }
            catch { setPending((prev) => prev.map((p) => p.id === pendingId ? { ...p, status: 'error', error: 'Could not open file.' } : p)); }
        });

        if (errors.length) setGlobalError(errors.join(' '));
    }, [validateFile, attachments, onChange]);

    // ── Drive link add ─────────────────────────────────────────────────────────
    const handleDriveAdd = useCallback((att: DriveLinkAttachment) => {
        onChange([...attachments, att]);
    }, [attachments, onChange]);

    // ── Remove ─────────────────────────────────────────────────────────────────
    const handleRemoveClick = useCallback((id: string, hasData: boolean) => {
        if (hasData) {
            if (confirmingId === id) {
                onChange(attachments.filter((a) => a.id !== id));
                setConfirmingId(null);
            } else {
                setConfirmingId(id);
                setTimeout(() => setConfirmingId(null), 3000);
            }
        } else {
            onChange(attachments.filter((a) => a.id !== id));
        }
    }, [confirmingId, attachments, onChange]);

    // ─────────────────────────────────────────────────────────────────────────

    return (
        <div className={cn('space-y-4', className)}>
            {/* Mode tab switcher */}
            {ENABLE_DRIVE_LINKS && (
                <div role="tablist" aria-label="Attachment mode" className="flex bg-neutral-100 rounded-xl p-1 gap-0.5">
                    <ModeTab mode="file" active={mode === 'file'} label="Upload File" icon={Upload} onClick={() => setMode('file')} />
                    <ModeTab mode="drive" active={mode === 'drive'} label="Google Drive" icon={HardDrive} onClick={() => setMode('drive')} />
                </div>
            )}

            {/* File upload zone */}
            {mode === 'file' && (
                <FileDropZone onFiles={processFiles} maxFileSize={maxFileSize} accept={accept} />
            )}

            {/* Drive link panel */}
            {mode === 'drive' && ENABLE_DRIVE_LINKS && (
                <DriveLinkPanel attachments={attachments} onAdd={handleDriveAdd} />
            )}

            {/* Global error */}
            {globalError && (
                <div role="alert" className="flex items-start gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200">
                    <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-red-600 flex-1">{globalError}</p>
                    <button type="button" onClick={() => setGlobalError(null)} className="text-red-400 hover:text-red-600">
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            )}

            {/* Pending uploads */}
            {pending.length > 0 && (
                <ul className="space-y-2">
                    {pending.map((p) => (
                        <li key={p.id} className={cn(
                            'flex items-center gap-3 p-3 rounded-lg border',
                            p.status === 'error' ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200',
                            p.largeFileWarning && 'bg-amber-50 border-amber-200'
                        )}>
                            {p.status === 'loading'
                                ? <Loader2 className="w-4 h-4 text-blue-400 shrink-0 animate-spin" />
                                : p.status === 'error'
                                    ? <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                                    : <FileText className="w-4 h-4 text-amber-500 shrink-0" />
                            }
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-800 truncate">{p.name}</p>
                                {p.status === 'loading' && (
                                    <div className="mt-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${p.progress}%` }} />
                                    </div>
                                )}
                                {p.status === 'error' && <p className="text-xs text-red-500">{p.error}</p>}
                                {p.largeFileWarning && <p className="text-xs text-amber-600">Stored without preview — file too large</p>}
                            </div>
                            {p.status === 'error' && (
                                <button type="button" onClick={() => setPending((prev) => prev.filter((x) => x.id !== p.id))}
                                    className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1">
                                    <RotateCcw className="w-3 h-3" /> dismiss
                                </button>
                            )}
                        </li>
                    ))}
                </ul>
            )}

            {/* Existing attachments (polymorphic) */}
            {attachments.length > 0 && (
                <ul className="space-y-2">
                    {attachments.map((att) => (
                        <AttachmentItem
                            key={att.id}
                            attachment={att}
                            isConfirming={confirmingId === att.id}
                            onRemoveClick={handleRemoveClick}
                        />
                    ))}
                </ul>
            )}

            {attachments.length === 0 && pending.length === 0 && (
                <p className="text-xs text-neutral-400 text-center">No attachments yet</p>
            )}
        </div>
    );
}
