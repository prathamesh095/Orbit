'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { loginSchema, type LoginFormData } from '@/lib/validations';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

import { Suspense } from 'react';

function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { login } = useAuth();
    const [showPassword, setShowPassword] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginFormData) => {
        setServerError(null);
        try {
            await login(data.email, data.password);
            const next = searchParams.get('next') ?? '/dashboard';
            router.push(next);
        } catch (err) {
            setServerError(err instanceof Error ? err.message : 'Login failed. Please try again.');
        }
    };

    return (
        <>
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
                <p className="text-gray-500 text-sm mt-1">Sign in to your account</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                <Input
                    label="Email address"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    required
                    {...register('email')}
                    error={errors.email?.message}
                />

                <Input
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Your password"
                    required
                    {...register('password')}
                    error={errors.password?.message}
                    rightAddon={
                        <button
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    }
                />

                <div className="flex justify-end">
                    <Link
                        href="/forgot-password"
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                        Forgot password?
                    </Link>
                </div>

                {serverError && (
                    <div role="alert" className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                        {serverError}
                    </div>
                )}

                <Button
                    type="submit"
                    className="w-full"
                    isLoading={isSubmitting}
                    leftIcon={<LogIn className="w-4 h-4" />}
                    size="lg"
                >
                    {isSubmitting ? 'Signing in…' : 'Sign in'}
                </Button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6">
                Don&apos;t have an account?{' '}
                <Link href="/register" className="text-blue-600 hover:text-blue-700 font-medium">
                    Create one
                </Link>
            </p>
        </>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center p-8">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-sm text-gray-500 font-medium animate-pulse">Loading login...</p>
            </div>
        }>
            <LoginContent />
        </Suspense>
    );
}
