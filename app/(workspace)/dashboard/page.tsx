'use client';

import { useMemo } from 'react';
import { useAuth } from '@/lib/authContext';
import { useApplications } from '@/hooks/useApplications';
import { KPICard } from '@/components/dashboard/KPICard';
import { TrendChart, StatusPieChart } from '@/components/dashboard/Charts';
import { SkeletonKPICard } from '@/components/ui/SkeletonLoader';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/ui/Badge';
import { classifyUrgency, formatDate, URGENCY_COLORS } from '@/lib/utils';
import {
    Briefcase,
    MessageSquare,
    Trophy,
    TrendingUp,
    AlertTriangle,
    Clock,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { motion } from 'framer-motion';

export default function DashboardPage() {
    const { user, isLoading: authLoading } = useAuth();
    const { applications, refresh } = useApplications(user?.id ?? '');

    const kpis = useMemo(() => {
        const total = applications.length;
        const interviews = applications.filter((a) => a.status === 'interviewing').length;
        const offers = applications.filter((a) => a.status === 'offer').length;
        const replied = applications.filter(
            (a) => a.replyReceived || a.status !== 'applied'
        ).length;
        const responseRate =
            total > 0 ? Math.round((replied / total) * 100) : 0;

        return { total, interviews, offers, responseRate };
    }, [applications]);

    const urgentApps = useMemo(() => {
        return applications
            .map((a) => ({ ...a, urgency: classifyUrgency(a) }))
            .filter((a) => a.urgency !== 'normal')
            .sort((a, b) => {
                const order = { critical: 0, overdue: 1, due_today: 2, normal: 3 };
                return order[a.urgency] - order[b.urgency];
            })
            .slice(0, 5);
    }, [applications]);

    if (authLoading) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    {[0, 1, 2, 3].map((i) => <SkeletonKPICard key={i} />)}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Welcome */}
            <div>
                <h2 className="text-xl font-bold text-gray-900">
                    {user ? `Welcome back, ${user.name.split(' ')[0]} 👋` : 'Dashboard'}
                </h2>
                <p className="text-sm text-gray-500 mt-1">Here&apos;s your job search overview.</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <KPICard
                    title="Total Applications"
                    value={kpis.total}
                    icon={<Briefcase className="w-5 h-5 text-blue-600" />}
                    iconBg="bg-blue-100"
                    delay={0}
                />
                <KPICard
                    title="Interviews"
                    value={kpis.interviews}
                    icon={<MessageSquare className="w-5 h-5 text-amber-600" />}
                    iconBg="bg-amber-100"
                    delay={0.05}
                />
                <KPICard
                    title="Offers"
                    value={kpis.offers}
                    icon={<Trophy className="w-5 h-5 text-emerald-600" />}
                    iconBg="bg-emerald-100"
                    delay={0.1}
                />
                <KPICard
                    title="Response Rate"
                    value={`${kpis.responseRate}%`}
                    icon={<TrendingUp className="w-5 h-5 text-violet-600" />}
                    iconBg="bg-violet-100"
                    delay={0.15}
                    trend={kpis.total === 0 ? 'Add applications to track' : undefined}
                />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                    <TrendChart applications={applications} />
                </div>
                <StatusPieChart applications={applications} />
            </div>

            {/* Urgent Actions */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                        <h3 className="font-semibold text-gray-900 text-sm">Needs Attention</h3>
                    </div>
                    <Link href="/applications" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                        View all
                    </Link>
                </div>

                {urgentApps.length === 0 ? (
                    <EmptyState
                        icon={<Clock />}
                        title="You're all caught up!"
                        description={
                            applications.length === 0
                                ? 'Start by adding your first job application.'
                                : 'No follow-ups needed right now.'
                        }
                        action={
                            applications.length === 0 ? (
                                <Link href="/applications/new">
                                    <Button leftIcon={<Briefcase className="w-4 h-4" />}>
                                        Add Application
                                    </Button>
                                </Link>
                            ) : undefined
                        }
                        className="py-8"
                    />
                ) : (
                    <ul>
                        {urgentApps.map((app, i) => (
                            <motion.li
                                key={app.id}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="flex items-center gap-4 px-6 py-3 border-b border-gray-50 last:border-b-0 hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="font-medium text-sm text-gray-900 truncate">{app.company}</span>
                                        <span className="text-gray-300 text-xs">·</span>
                                        <span className="text-sm text-gray-500 truncate">{app.roleTitle}</span>
                                    </div>
                                    {app.nextFollowUp && (
                                        <p className="text-xs text-gray-400">
                                            Follow-up: {formatDate(app.nextFollowUp)}
                                        </p>
                                    )}
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    <StatusBadge status={app.status} />
                                    <span className={`text-xs font-medium capitalize ${URGENCY_COLORS[app.urgency]}`}>
                                        {app.urgency === 'due_today' ? 'Due Today' : app.urgency}
                                    </span>
                                </div>
                                <Link
                                    href={`/applications/${app.id}`}
                                    className="text-xs text-blue-600 hover:text-blue-700 font-medium shrink-0"
                                >
                                    View →
                                </Link>
                            </motion.li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
