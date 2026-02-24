'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/lib/authContext';
import { useContacts } from '@/hooks/useContacts';
import { useToast } from '@/lib/toastContext';
import { ContactForm } from '@/components/forms/ContactForm';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { useDebounce } from '@/hooks/useDebounce';
import type { Contact } from '@/types';
import type { ContactFormValues } from '@/lib/validations';
import {
    Users,
    Plus,
    Search,
    Edit,
    Trash2,
    Mail,
    Phone,
    Linkedin,
    Building2,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { ContactDetailDrawer } from '@/components/contacts/ContactDetailDrawer';

const SMOOTH_SPRING = { type: 'spring', stiffness: 300, damping: 30 };
const STIFF_SPRING = { type: 'spring', stiffness: 400, damping: 30 };

const PAGE_SIZE = 12;

export default function ContactsPage() {
    const { user } = useAuth();
    const { contacts, createContact, updateContact, deleteContact } = useContacts(user?.id ?? '');
    const { success, error } = useToast();
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [addOpen, setAddOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<Contact | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Contact | null>(null);
    const [viewTarget, setViewTarget] = useState<Contact | null>(null);
    const debouncedSearch = useDebounce(search, 300);

    const filtered = useMemo(() => {
        if (!debouncedSearch) return contacts;
        const q = debouncedSearch.toLowerCase();
        return contacts.filter(
            (c) =>
                c.name.toLowerCase().includes(q) ||
                c.company?.toLowerCase().includes(q) ||
                c.email?.toLowerCase().includes(q)
        );
    }, [contacts, debouncedSearch]);

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const handleCreate = async (data: ContactFormValues) => {
        createContact(data);
        success('Contact added!', data.name);
        setAddOpen(false);
    };

    const handleUpdate = async (data: ContactFormValues) => {
        if (!editTarget) return;
        updateContact(editTarget.id, data);
        success('Contact updated!', data.name);
        setEditTarget(null);
    };

    const handleDelete = () => {
        if (!deleteTarget) return;
        deleteContact(deleteTarget.id);
        success('Contact deleted');
        setDeleteTarget(null);
    };

    const handleDeleteFromDrawer = (contact: Contact) => {
        deleteContact(contact.id);
        success('Contact deleted');
        setViewTarget(null);
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Contacts</h2>
                    <p className="text-sm text-gray-500">{contacts.length} contact{contacts.length !== 1 ? 's' : ''}</p>
                </div>
                <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setAddOpen(true)}>
                    Add Contact
                </Button>
            </div>

            {/* Search */}
            <Input
                placeholder="Search by name, company, or email..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                leftAddon={<Search className="w-4 h-4" />}
                containerClassName="max-w-sm"
            />

            {/* Grid */}
            {filtered.length === 0 ? (
                <EmptyState
                    icon={<Users />}
                    title={search ? 'No matches' : 'No contacts yet'}
                    description={search ? 'Try a different search.' : 'Add your first contact to build your network.'}
                    action={
                        !search ? (
                            <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setAddOpen(true)}>
                                Add Contact
                            </Button>
                        ) : undefined
                    }
                />
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {paginated.map((contact, i) => (
                            <motion.div
                                key={contact.id}
                                layout
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                transition={{ ...SMOOTH_SPRING, delay: i * 0.03 }}
                                className="bg-white rounded-xl border border-neutral-200 shadow-sm p-5 flex flex-col hover:shadow-md transition-shadow cursor-pointer group"
                                onClick={() => setViewTarget(contact)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => { if (e.key === 'Enter') setViewTarget(contact); }}
                            >
                                {/* Avatar + Name */}
                                <div className="flex items-start gap-3 mb-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-violet-600 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
                                        {contact.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-semibold text-gray-900 text-sm truncate">{contact.name}</p>
                                        {contact.role && (
                                            <p className="text-xs text-gray-500 truncate">{contact.role}</p>
                                        )}
                                        {contact.company && (
                                            <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                                                <Building2 className="w-3 h-3 shrink-0" />
                                                <span className="truncate">{contact.company}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Contact Links */}
                                <div className="space-y-1 text-xs flex-1">
                                    {contact.email && (
                                        <a href={`mailto:${contact.email}`} className="flex items-center gap-1.5 text-gray-500 hover:text-blue-600 truncate">
                                            <Mail className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                                            {contact.email}
                                        </a>
                                    )}
                                    {contact.phone && (
                                        <a href={`tel:${contact.phone}`} className="flex items-center gap-1.5 text-gray-500 hover:text-blue-600">
                                            <Phone className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                                            {contact.phone}
                                        </a>
                                    )}
                                    {contact.linkedInUrl && (
                                        <a href={contact.linkedInUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-gray-500 hover:text-blue-600">
                                            <Linkedin className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                                            LinkedIn
                                        </a>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-gray-100" onClick={(e) => e.stopPropagation()}>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setViewTarget(null); setEditTarget(contact); }}
                                        className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                        aria-label={`Edit ${contact.name}`}
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setDeleteTarget(contact); }}
                                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                        aria-label={`Delete ${contact.name}`}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {totalPages > 1 && (
                        <div className="flex justify-center">
                            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
                        </div>
                    )}
                </>
            )}

            {/* Add Modal */}
            <Modal
                isOpen={addOpen}
                onClose={() => setAddOpen(false)}
                title="Add Contact"
                size="lg"
            >
                <ContactForm onSubmit={handleCreate} onCancel={() => setAddOpen(false)} />
            </Modal>

            {/* Edit Modal */}
            <Modal
                isOpen={!!editTarget}
                onClose={() => setEditTarget(null)}
                title="Edit Contact"
                size="lg"
            >
                {editTarget && (
                    <ContactForm
                        defaultValues={editTarget}
                        onSubmit={handleUpdate}
                        onCancel={() => setEditTarget(null)}
                        isEditing
                    />
                )}
            </Modal>

            {/* Delete Confirm */}
            <Modal
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                title="Delete Contact"
                description={`Remove "${deleteTarget?.name}"? This cannot be undone.`}
                size="sm"
            >
                <div className="flex justify-end gap-3 mt-2">
                    <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</Button>
                    <Button variant="danger" onClick={handleDelete}>Delete</Button>
                </div>
            </Modal>

            {/* Contact Detail Drawer */}
            <ContactDetailDrawer
                contact={viewTarget}
                onClose={() => setViewTarget(null)}
                onEdit={(c) => { setViewTarget(null); setEditTarget(c); }}
                onDelete={handleDeleteFromDrawer}
            />
        </div>
    );
}
