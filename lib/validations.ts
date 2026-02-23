import { z } from 'zod';

export const registerSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(80),
    email: z.string().email('Please enter a valid email address'),
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
        .regex(/[0-9]/, 'Must contain at least one number'),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
});

export const loginSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
});

export const resetPasswordSchema = z.object({
    newPassword: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
        .regex(/[0-9]/, 'Must contain at least one number'),
    confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
});

export const applicationSchema = z.object({
    company: z.string().min(1, 'Company name is required').max(200),
    roleTitle: z.string().min(1, 'Role title is required').max(200),
    source: z.string().max(100).default(''),
    jobPostingUrl: z.string().url('Must be a valid URL').or(z.literal('')).default(''),
    jobId: z.string().max(100).default(''),
    location: z.string().max(200).default(''),
    resumeVersion: z.string().max(100).default(''),
    actionDate: z.string().min(1, 'Action date is required'),
    status: z.enum(['draft', 'applied', 'interviewing', 'offer', 'rejected']),
    nextFollowUp: z.string().default(''),
    strategicNotes: z.string().max(5000).default(''),
    subjectLineUsed: z.string().max(500).default(''),
    valuePitchSummary: z.string().max(2000).default(''),
    personalizationNotes: z.string().max(2000).default(''),
    replyReceived: z.boolean().optional().default(false),
    followUpSent: z.boolean().optional().default(false),
    emailType: z.enum(['cold_outreach', 'follow_up', 'thank_you', 'referral', 'application_confirmation', '']).default(''),
    linkedContactIds: z.array(z.string()).default([]),
    // Source-contextual fields
    referralContact: z.string().trim().max(200).optional(),
    recruiterName: z.string().trim().max(200).optional(),
}).superRefine((data, ctx) => {
    // Cross-field: nextFollowUp must be on or after actionDate
    if (data.nextFollowUp && data.actionDate) {
        if (data.nextFollowUp < data.actionDate) {
            ctx.addIssue({
                code: 'custom',
                path: ['nextFollowUp'],
                message: 'Follow-up date must be on or after the action date',
            });
        }
    }
});


export const contactSchema = z.object({
    name: z.string().min(2, 'Name is required').max(100),
    email: z.string().email('Valid email required').or(z.literal('')).default(''),
    phone: z.string().max(30).default(''),
    company: z.string().max(200).default(''),
    role: z.string().max(200).default(''),
    linkedInUrl: z.string().url('Must be a valid LinkedIn URL').or(z.literal('')).default(''),
    relationship: z.string().max(100).default(''),
    notes: z.string().max(3000).default(''),
});

export type RegisterFormData = z.infer<typeof registerSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type ApplicationFormValues = z.infer<typeof applicationSchema>;
export type ContactFormValues = z.infer<typeof contactSchema>;
