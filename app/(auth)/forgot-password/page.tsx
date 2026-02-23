'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { forgotPasswordSchema, type ForgotPasswordFormData } from '@/lib/validations';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function ForgotPasswordPage() {
    const { forgotPassword } = useAuth();
    const [submitted, setSubmitted] = useState(false);
    const [resetToken, setResetToken] = useState<string | null>(null);
    const [serverError, setServerError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<ForgotPasswordFormData>({
        resolver: zodResolver(forgotPasswordSchema),
    });

    const onSubmit = async (data: ForgotPasswordFormData) => {
        setServerError(null);
        try {
            const { token } = await forgotPassword(data.email);
            setResetToken(token || null);
            setSubmitted(true);
        } catch (err) {
            setServerError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
        }
    };

    if (submitted) {
        return (
            <div className="text-center">
                <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-7 h-7 text-emerald-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Check your email</h2>
                <p className="text-gray-500 text-sm mb-6">
                    If an account exists with that email, we&apos;ve sent a reset link.
                </p>

                {/* Demo only: show token in dev mode */}
                {resetToken && process.env.NODE_ENV !== 'production' && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-left">
                        <p className="text-xs text-amber-700 font-medium mb-1">Demo reset token (dev only):</p>
                        <code className="text-xs text-amber-800 break-all">{resetToken}</code>
                    </div>
                )}

                <Link
                    href="/login"
                    className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to sign in
                </Link>
            </div>
        );
    }

    return (
        <>
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Forgot password?</h2>
                <p className="text-gray-500 text-sm mt-1">
                    Enter your email and we&apos;ll send a reset link.
                </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                <Input
                    label="Email address"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    required
                    leftAddon={<Mail className="w-4 h-4" />}
                    {...register('email')}
                    error={errors.email?.message}
                />

                {serverError && (
                    <div role="alert" className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                        {serverError}
                    </div>
                )}

                <Button type="submit" className="w-full" isLoading={isSubmitting} size="lg">
                    {isSubmitting ? 'Sending…' : 'Send reset link'}
                </Button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6">
                <Link href="/login" className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium">
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back to sign in
                </Link>
            </p>
        </>
    );
}
