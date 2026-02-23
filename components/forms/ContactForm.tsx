'use client';

import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save } from 'lucide-react';
import { contactSchema, type ContactFormValues } from '@/lib/validations';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import type { Contact } from '@/types';

const RELATIONSHIP_OPTIONS = [
    { value: '', label: 'Select type...' },
    { value: 'recruiter', label: 'Recruiter' },
    { value: 'hiring_manager', label: 'Hiring Manager' },
    { value: 'employee', label: 'Employee' },
    { value: 'alumni', label: 'Alumni' },
    { value: 'referral', label: 'Referral / Introducer' },
    { value: 'other', label: 'Other' },
];

interface ContactFormProps {
    defaultValues?: Partial<ContactFormValues>;
    onSubmit: (data: ContactFormValues) => Promise<void>;
    onCancel?: () => void;
    isEditing?: boolean;
}

export function ContactForm({
    defaultValues,
    onSubmit,
    onCancel,
    isEditing = false,
}: ContactFormProps) {
    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm<ContactFormValues>({
        resolver: zodResolver(contactSchema) as Resolver<ContactFormValues>,
        defaultValues: {
            name: '',
            email: '',
            phone: '',
            company: '',
            linkedInUrl: '',
            role: '',
            relationship: '',
            notes: '',
            ...defaultValues,
        },
    });

    const notesValue = watch('notes');

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                    label="Full Name"
                    placeholder="Jane Smith"
                    required
                    {...register('name')}
                    error={errors.name?.message}
                />
                <Input
                    label="Email"
                    type="email"
                    placeholder="jane@example.com"
                    {...register('email')}
                    error={errors.email?.message}
                />
                <Input
                    label="Phone"
                    type="tel"
                    placeholder="+1 555 000 0000"
                    {...register('phone')}
                    error={errors.phone?.message}
                />
                <Input
                    label="Company"
                    placeholder="Acme Corp"
                    {...register('company')}
                    error={errors.company?.message}
                />
                <Input
                    label="Role / Title"
                    placeholder="Engineering Manager"
                    {...register('role')}
                    error={errors.role?.message}
                />
                <Select
                    label="Relationship Type"
                    options={RELATIONSHIP_OPTIONS}
                    {...register('relationship')}
                    error={errors.relationship?.message}
                />
                <div className="md:col-span-2">
                    <Input
                        label="LinkedIn URL"
                        type="url"
                        placeholder="https://linkedin.com/in/..."
                        {...register('linkedInUrl')}
                        error={errors.linkedInUrl?.message}
                    />
                </div>
            </div>
            <Textarea
                label="Notes"
                placeholder="Context, introductions, conversation history..."
                autoResize
                maxChars={3000}
                value={notesValue}
                onChange={(e) => setValue('notes', e.target.value)}
                error={errors.notes?.message}
            />
            <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                {onCancel && (
                    <Button type="button" variant="ghost" onClick={onCancel}>
                        Cancel
                    </Button>
                )}
                <Button type="submit" isLoading={isSubmitting} leftIcon={<Save className="w-4 h-4" />}>
                    {isEditing ? 'Save Changes' : 'Save Contact'}
                </Button>
            </div>
        </form>
    );
}
