'use client';

import { motion } from 'framer-motion';
import type { Application } from '@/types';
import { StatusBadge } from '@/components/ui/Badge';
import { formatDate, classifyUrgency, URGENCY_COLORS } from '@/lib/utils';
import { Calendar, Building2, MapPin } from 'lucide-react';

interface KanbanCardProps {
    application: Application;
    onClick: () => void;
}

export function KanbanCard({ application: app, onClick }: KanbanCardProps) {
    const urgency = classifyUrgency(app);

    return (
        <motion.article
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            onClick={onClick}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); }}
            tabIndex={0}
            role="button"
            aria-label={`${app.company} — ${'roleTitle' in app ? (app as any).roleTitle : 'Follow-up'}. ${app.status}`}
            className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 cursor-pointer hover:shadow-md hover:border-blue-200 transition-all duration-150 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
            <div className="flex items-start gap-2 mb-2">
                <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                    <Building2 className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{app.company}</p>
                    <p className="text-xs text-gray-500 truncate">{'roleTitle' in app ? (app as any).roleTitle : 'Follow-up'}</p>
                </div>
            </div>

            {'location' in app && (app as any).location && (
                <div className="flex items-center gap-1 text-xs text-gray-400 mb-2">
                    <MapPin className="w-3 h-3 shrink-0" />
                    {(app as any).location}
                </div>
            )}

            {app.nextFollowUp && (
                <div className={`flex items-center gap-1 text-xs font-medium mt-2 ${URGENCY_COLORS[urgency]}`}>
                    <Calendar className="w-3 h-3 shrink-0" />
                    Follow-up {formatDate(app.nextFollowUp)}
                </div>
            )}
        </motion.article>
    );
}
