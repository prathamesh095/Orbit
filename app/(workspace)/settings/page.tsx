'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/authContext';
import { useSettings } from '@/lib/settingsContext';
import { useToast } from '@/lib/toastContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { resetPasswordSchema, type ResetPasswordFormData } from '@/lib/validations';
import * as authService from '@/services/auth/authService';
import * as storageService from '@/services/storage/storageService';
import { Palette, Shield, Database, Bell, Layout, List, Clock, Briefcase, Users, Paperclip } from 'lucide-react';
import type { AppSettings } from '@/types';

const THEME_OPTIONS = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark (coming soon)' },
    { value: 'system', label: 'System' },
];

const DENSITY_OPTIONS = [
    { value: 'compact', label: 'Compact' },
    { value: 'normal', label: 'Normal' },
    { value: 'comfortable', label: 'Comfortable' },
];

function SectionHeader({ icon, title, description }: { icon: React.ReactNode; title: string; description?: string }) {
    return (
        <div className="flex items-start gap-3 mb-6">
            <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
                {icon}
            </div>
            <div>
                <h3 className="font-semibold text-gray-900">{title}</h3>
                {description && <p className="text-sm text-gray-500 mt-0.5">{description}</p>}
            </div>
        </div>
    );
}

export default function SettingsPage() {
    const { user } = useAuth();
    const { settings, updateSettings } = useSettings();
    const { success, error: showError } = useToast();

    // ─── Appearance ──────────────────────────────────────────────────────────────
    const handleAppearanceUpdate = (key: keyof AppSettings, value: string) => {
        updateSettings({ [key]: value });
        success('Setting saved');
    };

    // ─── Password Change ──────────────────────────────────────────────────────────
    const {
        register,
        handleSubmit,
        reset: resetForm,
        formState: { errors, isSubmitting },
    } = useForm<ResetPasswordFormData>({
        resolver: zodResolver(resetPasswordSchema),
    });

    const onPasswordSubmit = async (data: ResetPasswordFormData) => {
        try {
            // We reuse the reset flow — user must know their current password
            // For now this is a UI-only demo; in production, verify current password
            success('Password updated!');
            resetForm();
        } catch (err) {
            showError('Failed to update password', err instanceof Error ? err.message : '');
        }
    };

    // ─── Export / Clear Data ──────────────────────────────────────────────────────
    const handleExportData = () => {
        if (!user) return;
        const key = `jt_v1_${user.id}_apps`;
        const raw = localStorage.getItem(key) ?? '[]';
        const blob = new Blob([raw], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `jobtrack-export-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        success('Data exported!');
    };

    const [clearConfirm, setClearConfirm] = useState(false);
    const [clearTyped, setClearTyped] = useState('');
    const handleClearData = () => {
        if (!user) return;
        if (!clearConfirm) {
            setClearConfirm(true);
            return;
        }
        if (clearTyped !== 'DELETE') return;

        ['apps', 'contacts', 'notifications', 'logs', 'settings', 'templates'].forEach((k) => {
            localStorage.removeItem(`job_crm:v1:${user.id}:${k}`);
        });
        success('All data cleared', 'Your workspace has been reset');
        setClearConfirm(false);
        setClearTyped('');
        window.location.reload();
    };

    const stats = user ? storageService.getStorageStats(user.id) : { applications: 0, contacts: 0, attachments: 0 };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h2 className="text-xl font-bold text-gray-900">Settings</h2>
                <p className="text-sm text-gray-500">Manage your account and app preferences</p>
            </div>

            {/* Appearance */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <SectionHeader icon={<Palette className="w-4 h-4" />} title="Appearance" />
                <div className="space-y-4">
                    <Select
                        label="List Density"
                        options={DENSITY_OPTIONS}
                        value={settings.density}
                        onChange={(e) => handleAppearanceUpdate('density', e.target.value as AppSettings['density'])}
                    />
                </div>
            </div>

            {/* Workspace Defaults */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <SectionHeader icon={<List className="w-4 h-4" />} title="Workspace Defaults" description="Set your global workflow preferences" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                        label="Default Pipeline View"
                        value={settings.defaultView}
                        options={[
                            { value: 'list', label: 'List View' },
                            { value: 'grid', label: 'Grid View' },
                            { value: 'kanban', label: 'Kanban Board' },
                        ]}
                        onChange={(e) => updateSettings({ defaultView: e.target.value as any })}
                    />
                    <Select
                        label="Rows per Page"
                        value={settings.pageSize.toString()}
                        options={[
                            { value: '10', label: '10 rows' },
                            { value: '20', label: '20 rows' },
                            { value: '50', label: '50 rows' },
                        ]}
                        onChange={(e) => updateSettings({ pageSize: Number(e.target.value) })}
                    />
                    <Select
                        label="Default Follow-up Reminder"
                        value={settings.defaultFollowUpDays.toString()}
                        options={[
                            { value: '1', label: 'Next day' },
                            { value: '3', label: '3 days after' },
                            { value: '5', label: '5 days after' },
                            { value: '7', label: '1 week after' },
                        ]}
                        onChange={(e) => updateSettings({ defaultFollowUpDays: Number(e.target.value) })}
                    />
                </div>
            </div>

            {/* Notifications */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <SectionHeader
                    icon={<Bell className="w-4 h-4" />}
                    title="Notifications"
                    description="Control which in-app alerts you receive"
                />
                <div className="space-y-3">
                    {(
                        [
                            { key: 'notifyFollowUp', label: 'Follow-up reminders' },
                            { key: 'notifyOverdue', label: 'Overdue follow-ups' },
                            { key: 'notifyInterviewing', label: 'Interviewing status alerts' },
                        ] as const
                    ).map(({ key, label }) => (
                        <label key={key} className="flex items-center justify-between cursor-pointer">
                            <span className="text-sm text-gray-700">{label}</span>
                            <input
                                type="checkbox"
                                checked={!!settings[key]}
                                onChange={(e) => updateSettings({ [key]: e.target.checked })}
                                className="w-4 h-4 text-blue-600 rounded"
                            />
                        </label>
                    ))}
                </div>
            </div>

            {/* Security */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <SectionHeader icon={<Shield className="w-4 h-4" />} title="Security" description="Update your password" />
                <form onSubmit={handleSubmit(onPasswordSubmit)} className="space-y-4" noValidate>
                    <Input
                        label="New Password"
                        type="password"
                        placeholder="Min. 8 chars, 1 uppercase, 1 number"
                        autoComplete="new-password"
                        {...register('newPassword')}
                        error={errors.newPassword?.message}
                    />
                    <Input
                        label="Confirm New Password"
                        type="password"
                        placeholder="Confirm new password"
                        autoComplete="new-password"
                        {...register('confirmPassword')}
                        error={errors.confirmPassword?.message}
                    />
                    <div className="flex justify-end">
                        <Button type="submit" isLoading={isSubmitting} size="sm">
                            Update Password
                        </Button>
                    </div>
                </form>
            </div>

            {/* Data Management */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <SectionHeader
                    icon={<Database className="w-4 h-4" />}
                    title="Data Management"
                    description="All data is stored locally in your browser"
                />
                <div className="flex flex-wrap gap-3">
                    <Button variant="outline" size="sm" onClick={handleExportData}>
                        Export Data (JSON)
                    </Button>
                    <Button
                        variant={clearConfirm ? 'danger' : 'outline'}
                        size="sm"
                        onClick={handleClearData}
                        disabled={clearConfirm && clearTyped !== 'DELETE'}
                    >
                        {clearConfirm ? 'Confirm Deletion' : 'Clear All Data'}
                    </Button>
                </div>
                {clearConfirm && (
                    <div className="mt-4 p-4 bg-red-50 rounded-xl border border-red-100 flex flex-col gap-3">
                        <p className="text-xs text-red-700 font-medium">
                            This action is irreversible. It will delete all job applications, contacts, and notifications.
                        </p>
                        <div className="space-y-1.5">
                            <label className="text-[10px] uppercase font-bold text-red-400 tracking-wider">Type DELETE to confirm</label>
                            <input
                                type="text"
                                value={clearTyped}
                                onChange={(e) => setClearTyped(e.target.value)}
                                placeholder="DELETE"
                                className="w-full h-9 px-3 rounded-lg border border-red-200 bg-white text-sm outline-none focus:ring-2 focus:ring-red-500/20"
                            />
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => { setClearConfirm(false); setClearTyped(''); }} className="text-red-600 hover:bg-red-100/50">
                            Cancel
                        </Button>
                    </div>
                )}
            </div>

            {/* Storage Health */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <SectionHeader icon={<Database className="w-4 h-4" />} title="Storage Health" description="Overview of your local data footprint" />
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { label: 'Applications', value: stats.applications, icon: Briefcase },
                        { label: 'Contacts', value: stats.contacts, icon: Users },
                        { label: 'Attachments', value: stats.attachments, icon: Paperclip },
                    ].map(({ label, value, icon: Icon }) => (
                        <div key={label} className="p-4 rounded-xl bg-neutral-50 border border-neutral-100 text-center">
                            <Icon className="w-4 h-4 text-neutral-400 mx-auto mb-2" />
                            <p className="text-lg font-bold text-neutral-900">{value}</p>
                            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-0.5">{label}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Account Info */}
            {user && (
                <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 text-sm text-gray-500 flex justify-between flex-wrap gap-2">
                    <span>Signed in as <strong className="text-gray-700">{user.email}</strong></span>
                    <span>Account created: {new Date(user.createdAt).toLocaleDateString()}</span>
                </div>
            )}
        </div>
    );
}
