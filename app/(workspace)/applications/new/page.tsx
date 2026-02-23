'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { useApplications } from '@/hooks/useApplications';
import { useToast } from '@/lib/toastContext';
import { ApplicationForm } from '@/components/forms/ApplicationForm';
import type { ApplicationFormValues } from '@/lib/validations';
import type { Attachment } from '@/types';

const DRAFT_ID = 'new-application';

export default function NewApplicationPage() {
    const router = useRouter();
    const { user } = useAuth();
    const { createApplication } = useApplications(user?.id ?? '');
    const { success, error } = useToast();

    const handleSubmit = async (data: ApplicationFormValues, attachments: Attachment[]) => {
        try {
            const app = createApplication({ ...data, attachments });
            success('Application saved!', `${data.company} — ${data.roleTitle}`);
            router.push(`/applications/${app.id}`);
        } catch (err) {
            error('Failed to save', err instanceof Error ? err.message : 'Please try again.');
        }
    };

    if (!user) return null;

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
                <Link href="/applications" className="text-gray-400 hover:text-gray-600 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h2 className="text-xl font-bold text-gray-900">New Application</h2>
                    <p className="text-sm text-gray-500">Track a new job application</p>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 lg:p-8">
                <ApplicationForm
                    userId={user.id}
                    draftId={DRAFT_ID}
                    onSubmit={handleSubmit}
                    onCancel={() => router.push('/applications')}
                />
            </div>
        </div>
    );
}
