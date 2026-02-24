'use client';

import { useMemo } from 'react';
import { useAuth } from '@/lib/authContext';
import { useDashboardAnalytics } from '@/features/dashboard/hooks/useDashboardAnalytics';
import { DashboardErrorBoundary } from '@/features/dashboard/components/DashboardErrorBoundary';
import { KPICard } from '@/components/dashboard/KPICard';
import { TrendChart, StatusPieChart } from '@/components/dashboard/Charts';
import { SkeletonKPICard } from '@/components/ui/SkeletonLoader';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/ui/Badge';
import { classifyUrgency, formatDate, URGENCY_COLORS } from '@/lib/utils';
import type { Application, UrgencyLevel } from '@/types';
import {
    Briefcase,
    MessageSquare,
    Trophy,
    TrendingUp,
    AlertTriangle,
    Clock,
    Activity,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { FocusZone } from '@/features/dashboard/components/FocusZone';
import { ActivityFeed } from '@/features/dashboard/components/ActivityFeed';


const APPLE_SPRING = { type: 'spring', stiffness: 500, damping: 35 };

export default function DashboardPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const { applications, metrics, isLoading } = useDashboardAnalytics(user?.id ?? '');

    const urgentApps = useMemo(() => {
        return applications
            .filter((a: Application) => classifyUrgency(a) !== 'normal')
            .sort((a: Application, b: Application) => {
                const order: Record<UrgencyLevel, number> = { critical: 0, overdue: 1, due_today: 2, normal: 3 };
                return order[classifyUrgency(a)] - order[classifyUrgency(b)];
            })
            .slice(0, 5);
    }, [applications]);

    if (authLoading || isLoading) {
        return (
            <div className="space-y-8 animate-fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[0, 1, 2, 3].map((i) => <SkeletonKPICard key={i} />)}
                </div>
            </div>
        );
    }

    return (
        <DashboardErrorBoundary>
            <div className="space-y-10 max-w-7xl mx-auto pb-16 animate-fade-in">
                {/* Welcome Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-1">
                    <div>
                        <h2 className="text-[28px] font-semibold text-[#1D1D1F] tracking-tight leading-tight">
                            {user ? `Good ${new Date().getHours() < 12 ? 'morning' : 'afternoon'}, ${user.name.split(' ')[0]}` : 'Dashboard'}
                        </h2>
                        <p className="text-[17px] text-[#86868B] mt-1.5 font-medium">Strategic overview of your career pipeline.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/applications">
                            <Button variant="outline" className="px-5">View Pipeline</Button>
                        </Link>
                        <Button onClick={() => router.push('/applications?new=true')} className="px-5">
                            New Application
                        </Button>
                    </div>
                </div>

                {/* KPI Cards */}
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={{
                        visible: { transition: { staggerChildren: 0.08 } }
                    }}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
                >
                    <KPICard
                        title="Pipeline Size"
                        value={metrics.totalApplications}
                        icon={<Briefcase className="w-5 h-5 text-[#007AFF]" />}
                        iconBg="bg-[#007AFF]/5"
                    />
                    <KPICard
                        title="Active Interviews"
                        value={metrics.statusDistribution.interviewing}
                        icon={<MessageSquare className="w-5 h-5 text-[#FF9500]" />}
                        iconBg="bg-[#FF9500]/5"
                    />
                    <KPICard
                        title="Offers Secured"
                        value={metrics.statusDistribution.offer}
                        icon={<Trophy className="w-5 h-5 text-[#34C759]" />}
                        iconBg="bg-[#34C759]/5"
                    />
                    <KPICard
                        title="Conversion Rate"
                        value={`${Math.round(metrics.conversionRates.applicationToInterview)}%`}
                        icon={<TrendingUp className="w-5 h-5 text-[#5856D6]" />}
                        iconBg="bg-[#5856D6]/5"
                    />
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content Area */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Distribution Charts */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-white rounded-[22px] border border-[#000000]/05 p-6 shadow-apple-md">
                                <TrendChart applications={applications} />
                            </div>
                            <div className="bg-white rounded-[22px] border border-[#000000]/05 p-6 shadow-apple-md">
                                <StatusPieChart applications={applications} />
                            </div>
                        </div>

                        {/* Intelligence Focus Zone */}
                        <FocusZone
                            metrics={metrics}
                            onAddApplication={() => router.push('/applications?new=true')}
                        />
                    </div>

                    {/* Activity Feed Sidebar */}
                    <div className="space-y-8">
                        <ActivityFeed userId={user?.id ?? ''} />
                    </div>
                </div>
            </div>
        </DashboardErrorBoundary>
    );
}
