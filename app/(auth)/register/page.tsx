'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { registerSchema, type RegisterFormData } from '@/lib/validations';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function RegisterPage() {
    const router = useRouter();
    const { register: registerUser } = useAuth();
    const [showPassword, setShowPassword] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
    });

    const onSubmit = async (data: RegisterFormData) => {
        setServerError(null);
        try {
            await registerUser(data.name, data.email, data.password, data.confirmPassword);
            // After successful registration, redirect to login
            router.push('/login?registered=true');
        } catch (err) {
            console.error('[v0] Registration error:', err);
            setServerError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
        }
    };

    return (
        <>
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Create account</h2>
                <p className="text-gray-500 text-sm mt-1">Start tracking your job search today</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                <Input
                    label="Full name"
                    type="text"
                    autoComplete="name"
                    placeholder="Jane Smith"
                    required
                    {...register('name')}
                    error={errors.name?.message}
                />

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
                    autoComplete="new-password"
                    placeholder="Min. 8 chars, 1 uppercase, 1 number"
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

                <Input
                    label="Confirm password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Confirm your password"
                    required
                    {...register('confirmPassword')}
                    error={errors.confirmPassword?.message}
                />

                {serverError && (
                    <div role="alert" className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                        {serverError}
                    </div>
                )}

                <Button
                    type="submit"
                    className="w-full"
                    isLoading={isSubmitting}
                    leftIcon={<UserPlus className="w-4 h-4" />}
                    size="lg"
                >
                    {isSubmitting ? 'Creating account…' : 'Create account'}
                </Button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6">
                Already have an account?{' '}
                <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                    Sign in
                </Link>
            </p>
        </>
    );
}
