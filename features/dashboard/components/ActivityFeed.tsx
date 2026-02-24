import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import * as storageService from '@/services/storage/storageService';
import { formatDistanceToNow } from 'date-fns';
import {
    Activity,
    CheckCircle2,
    Clock,
    ArrowUpRight,
    PlusCircle,
    UserPlus,
    FileText
} from 'lucide-react';
import { CACHE_KEYS } from '@/lib/queryClient';
import { cn } from '@/lib/utils';
import type { ExecutionLog } from '@/types';

/**
 * Enterprise Activity Feed.
 * 
 * DESIGN DECISIONS:
 * 1. Event-driven model: consumes the execution log stream.
 * 2. Virtualization-ready: flat list structure.
 * 3. Relative time formatting for human readability.
 * 4. Distinct iconography per event type.
 */

interface ActivityFeedProps {
    userId: string;
}

export function ActivityFeed({ userId }: ActivityFeedProps) {
    const { data: logs = [], isLoading } = useQuery({
        queryKey: ['activity-logs', userId],
        queryFn: async () => {
            // Simulated network delay
            await new Promise(r => setTimeout(r, 600));
            return storageService.getExecutionLogs(userId);
        },
        enabled: !!userId,
    });

    if (isLoading) {
        return (
            <div className="space-y-6 animate-pulse px-2">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex gap-4">
                        <div className="w-9 h-9 rounded-full bg-[#F5F5F7]" />
                        <div className="flex-1 space-y-2.5 pt-1">
                            <div className="h-4 bg-[#F5F5F7] rounded-full w-3/4" />
                            <div className="h-3 bg-[#F5F5F7] rounded-full w-1/4" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (logs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 bg-[#F5F5F7] rounded-full flex items-center justify-center mb-5">
                    <Activity className="w-8 h-8 text-[#D1D1D6]" />
                </div>
                <p className="text-[15px] font-semibold text-[#1D1D1F]">No activity yet</p>
                <p className="text-[13px] text-[#86868B] mt-1.5 max-w-[200px]">Actions you take will appear here in real-time.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-[22px] border border-[#000000]/05 overflow-hidden shadow-apple-md">
            <div className="px-6 py-4 border-b border-[#000000]/05 bg-[#FBFBFC]">
                <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#86868B]" />
                    <h3 className="text-[12px] font-semibold text-[#86868B] uppercase tracking-[0.05em]">Recent Activity</h3>
                </div>
            </div>
            <div className="p-6">
                <div className="flow-root">
                    <ul role="list" className="-mb-8">
                        {logs.map((log: ExecutionLog, idx: number) => (
                            <li key={log.timestamp + idx}>
                                <div className="relative pb-8">
                                    {idx !== logs.length - 1 ? (
                                        <span className="absolute left-[18px] top-9 -ml-px h-full w-[1.5px] bg-[#F5F5F7]" aria-hidden="true" />
                                    ) : null}
                                    <div className="relative flex space-x-4">
                                        <motion.div
                                            initial={{ scale: 0.8, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            transition={{ delay: idx * 0.05, ease: [0.23, 1, 0.32, 1] }}
                                        >
                                            <span className={cn(
                                                "h-9 w-9 rounded-full flex items-center justify-center ring-4 ring-white shadow-apple-sm",
                                                getEventColor(log.action)
                                            )}>
                                                {getEventIcon(log.action)}
                                            </span>
                                        </motion.div>
                                        <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                                            <a
                                                href={`/applications?id=${log.applicationId}`}
                                                className="group flex-1 flex justify-between gap-4"
                                            >
                                                <div className="flex-1">
                                                    <p className="text-[14px] leading-relaxed text-[#86868B] group-hover:text-[#1D1D1F] transition-colors">
                                                        <span className="font-medium text-[#1D1D1F] capitalize">{log.action.replace('_', ' ')}</span>
                                                        {' '}{deriveActivityDetails(log)}
                                                    </p>
                                                </div>
                                                <div className="whitespace-nowrap text-right text-[12px] font-medium text-[#A1A1A6] tabular-nums pt-0.5">
                                                    {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                                                </div>
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}

function getEventIcon(action: string) {
    if (action.includes('Created')) return <PlusCircle className="w-4 h-4 text-white" />;
    if (action.includes('Updated')) return <CheckCircle2 className="w-4 h-4 text-white" />;
    if (action.includes('Status')) return <ArrowUpRight className="w-4 h-4 text-white" />;
    if (action.includes('Contact')) return <UserPlus className="w-4 h-4 text-white" />;
    return <FileText className="w-4 h-4 text-white" />;
}

function getEventColor(action: string) {
    if (action.includes('created')) return 'bg-[#007AFF]';
    if (action.includes('status')) return 'bg-[#FF9500]';
    if (action.includes('offer')) return 'bg-[#34C759]';
    if (action.includes('rejected')) return 'bg-[#FF3B30]';
    return 'bg-[#8E8E93]';
}

function deriveActivityDetails(log: ExecutionLog): string {
    if (log.action === 'created') return 'for a new opportunity';
    if (log.action === 'status_changed') return `from ${log.previousValue} to ${log.newValue}`;
    if (log.action === 'deleted') return 'removed from pipeline';
    return log.newValue ? `to ${log.newValue}` : '';
}
