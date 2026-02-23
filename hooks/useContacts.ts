'use client';

import { useState, useCallback } from 'react';
import type { Contact, ContactFormData } from '@/types';
import * as storageService from '@/services/storage/storageService';
import { generateId } from '@/lib/utils';

export function useContacts(userId: string) {
    const [contacts, setContacts] = useState<Contact[]>(() => {
        if (!userId) return [];
        return storageService.getContacts(userId);
    });

    const refresh = useCallback(() => {
        if (!userId) return;
        setContacts(storageService.getContacts(userId));
    }, [userId]);

    const createContact = useCallback(
        (data: ContactFormData): Contact => {
            const now = new Date().toISOString();
            const contact: Contact = {
                ...data,
                id: generateId(),
                userId,
                createdAt: now,
                updatedAt: now,
            };
            storageService.upsertContact(userId, contact);
            setContacts((prev) => [contact, ...prev]);
            return contact;
        },
        [userId]
    );

    const updateContact = useCallback(
        (id: string, data: Partial<ContactFormData>): Contact | null => {
            const contacts = storageService.getContacts(userId);
            const existing = contacts.find((c) => c.id === id);
            if (!existing) return null;
            const now = new Date().toISOString();
            const updated: Contact = {
                ...existing,
                ...data,
                id,
                userId,
                updatedAt: now,
            };
            storageService.upsertContact(userId, updated);
            setContacts((prev) => prev.map((c) => (c.id === id ? updated : c)));
            return updated;
        },
        [userId]
    );

    const deleteContact = useCallback(
        (id: string) => {
            storageService.deleteContact(userId, id);
            setContacts((prev) => prev.filter((c) => c.id !== id));
        },
        [userId]
    );

    return { contacts, refresh, createContact, updateContact, deleteContact };
}
