export interface Contact {
    id: string;
    userId: string;
    name: string;
    email?: string;
    phone?: string;
    company?: string;
    role?: string;
    linkedInUrl?: string;
    relationship?: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

export type ContactFormData = Omit<
    Contact,
    'id' | 'userId' | 'createdAt' | 'updatedAt'
>;

export type ContactDraft = Partial<ContactFormData> & {
    savedAt: string;
};
