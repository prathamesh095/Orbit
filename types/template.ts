// ─── Template Types ───────────────────────────────────────────────────────────

export type TemplateCategory =
    | 'Cold Outreach'
    | 'Follow-Up'
    | 'Thank You'
    | 'Referral'
    | 'Application Confirmation'
    | 'Networking'
    | 'Other';

export interface Template {
    id: string;
    userId: string;
    title: string;
    category: TemplateCategory | string;
    content: string;
    useCount: number;       // future-ready: how many times copied/used
    createdAt: string;      // ISO string
    updatedAt: string;      // ISO string
}

export type TemplateFormData = Pick<Template, 'title' | 'category' | 'content'>;

export const TEMPLATE_CATEGORIES: TemplateCategory[] = [
    'Cold Outreach',
    'Follow-Up',
    'Thank You',
    'Referral',
    'Application Confirmation',
    'Networking',
    'Other',
];

export const CATEGORY_COLORS: Record<string, string> = {
    'Cold Outreach': 'bg-blue-50 text-blue-700 ring-blue-200',
    'Follow-Up': 'bg-amber-50 text-amber-700 ring-amber-200',
    'Thank You': 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    'Referral': 'bg-violet-50 text-violet-700 ring-violet-200',
    'Application Confirmation': 'bg-cyan-50 text-cyan-700 ring-cyan-200',
    'Networking': 'bg-rose-50 text-rose-700 ring-rose-200',
    'Other': 'bg-neutral-100 text-neutral-600 ring-neutral-200',
};
