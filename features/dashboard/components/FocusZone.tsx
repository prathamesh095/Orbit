import { motion, AnimatePresence } from 'framer-motion';
import {
    Zap,
    Target,
    MessageSquare,
    Plus,
    Lightbulb,
    ArrowRight
} from 'lucide-react';
import type { PipelineMetrics } from '../../shared/types/domain';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

/**
 * FAANG-tier Focus Zone.
 * 
 * DESIGN DECISIONS:
 * 1. Rule Engine Approach: Nudges are derived from current pipeline health.
 * 2. Progressive Onboarding: Different UI for empty vs active states.
 * 3. Strategic Guidance: Beyond simple "empty states", this offers "what to do next".
 */

interface FocusZoneProps {
    metrics: PipelineMetrics;
    onAddApplication: () => void;
}

export function FocusZone({ metrics, onAddApplication }: FocusZoneProps) {
    const hasApps = metrics.totalApplications > 0;
    const hasInterviews = metrics.statusDistribution.interviewing > 0;
    const lowResponseRate = metrics.totalApplications > 5 && metrics.conversionRates.applicationToInterview < 10;

    // Rule engine for nudges
    const getNudges = () => {
        const nudges = [];

        // 1. Onboarding Priority
        if (!hasApps) {
            nudges.push({
                id: 'onboarding',
                title: 'Start your search',
                description: 'Add your first application to track your momentum.',
                icon: <Plus className="w-5 h-5 text-[#007AFF]" />,
                action: { label: 'Add Application', onClick: onAddApplication }
            });
            return nudges;
        }

        // 2. High Urgency: Due Today
        if (metrics.urgencyCounts.due_today > 0) {
            nudges.push({
                id: 'due-today',
                title: 'Action required today',
                description: `You have ${metrics.urgencyCounts.due_today} follow-up${metrics.urgencyCounts.due_today > 1 ? 's' : ''} scheduled for today.`,
                icon: <Zap className="w-5 h-5 text-[#FF9500]" />, // Warning Orange
                action: { label: 'View Tasks', href: '/applications?filter=due_today' }
            });
        }

        // 3. Strategic: Active Interviews
        if (hasInterviews) {
            nudges.push({
                id: 'interviews',
                title: 'Interview Management',
                description: `You have ${metrics.statusDistribution.interviewing} active interview process${metrics.statusDistribution.interviewing > 1 ? 'es' : ''}. Keep them warm.`,
                icon: <Target className="w-5 h-5 text-[#32D74B]" />, // Green
                action: { label: 'Prep Guide', href: '/library' }
            });
        } else if (hasApps) {
            // Only show "Boost response rate" if they HAVE apps but NO interviews
            nudges.push({
                id: 'strategy',
                title: 'Boost response rate',
                description: 'Try adding follow-ups or refining your outreach strategy.',
                icon: <Target className="w-5 h-5 text-[#FF9500]" />,
                action: { label: 'View Pipeline', href: '/applications' }
            });
        }

        // 4. Outreach Optimization
        if (lowResponseRate) {
            nudges.push({
                id: 'outreach',
                title: 'Response volume',
                description: 'Your rate is below 10%. Consider high-intent outreach.',
                icon: <MessageSquare className="w-5 h-5 text-[#5856D6]" />,
                action: { label: 'Outreach Guide', href: '/library' }
            });
        }

        return nudges;
    };

    const nudges = getNudges();

    return (
        <div className="bg-white rounded-[22px] border border-[#000000]/05 overflow-hidden shadow-apple-md">
            <div className="px-6 py-4 border-b border-[#000000]/05 bg-[#FBFBFC]">
                <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-[#FFCC00] fill-[#FFCC00]" />
                    <h3 className="text-[12px] font-semibold text-[#86868B] uppercase tracking-[0.05em]">Strategy Focus</h3>
                </div>
            </div>

            <div className="divide-y divide-[#000000]/05">
                <AnimatePresence mode="popLayout">
                    {nudges.map((nudge) => (
                        <motion.div
                            key={nudge.id}
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                            className="p-6 flex items-start gap-5 hover:bg-[#F5F5F7]/30 transition-colors"
                        >
                            <div className="w-12 h-12 rounded-[14px] bg-[#F5F5F7] flex items-center justify-center shrink-0 shadow-apple-sm">
                                {nudge.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-[15px] font-semibold text-[#1D1D1F]">{nudge.title}</h4>
                                <p className="text-[14px] text-[#86868B] mt-1 leading-relaxed">{nudge.description}</p>
                                <div className="mt-4 flex items-center gap-3">
                                    {'onClick' in nudge.action ? (
                                        <Button size="sm" onClick={nudge.action.onClick} className="rounded-[10px]">
                                            {nudge.action.label}
                                            <ArrowRight className="w-3.5 h-3.5 ml-1" />
                                        </Button>
                                    ) : (
                                        <Link
                                            href={nudge.action.href || '#'}
                                            className="inline-flex items-center justify-center font-medium rounded-[10px] transition-all duration-150 active:duration-75 h-8 px-3 text-[13px] gap-1.5 border border-[#D1D1D6] bg-white text-[#1D1D1F] shadow-apple-sm hover:bg-[#F2F2F7] tap-active"
                                        >
                                            {nudge.action.label}
                                            <ArrowRight className="w-3.5 h-3.5 ml-1" />
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {nudges.length === 0 && (
                    <div className="p-12 text-center">
                        <div className="w-12 h-12 bg-[#F5F5F7] rounded-full flex items-center justify-center mx-auto mb-4">
                            <Lightbulb className="w-6 h-6 text-[#A1A1A6]" />
                        </div>
                        <p className="text-[14px] font-medium text-[#1D1D1F]">Your pipeline is healthy</p>
                        <p className="text-[13px] text-[#86868B] mt-1">Keep up the excellent momentum!</p>
                    </div>
                )}
            </div>
        </div>
    );
}
