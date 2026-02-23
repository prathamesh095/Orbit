'use client';

import { Skeleton } from './Skeleton';
import { cn } from '@/lib/utils';

// ─── List View Skeleton ───────────────────────────────────────────────────────

export function ListSkeleton({ rows = 6 }: { rows?: number }) {
    return (
        <div className="w-full bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
            <div className="h-10 bg-neutral-50/60 border-b border-neutral-100 flex items-center px-5 gap-4">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-24 hidden md:block" />
                <Skeleton className="h-3 w-20 hidden lg:block" />
            </div>
            <div className="divide-y divide-neutral-50">
                {Array.from({ length: rows }).map((_, i) => (
                    <div key={i} className="px-5 py-4 flex items-center gap-4">
                        <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-1/3" />
                            <Skeleton className="h-3 w-1/4" />
                        </div>
                        <Skeleton className="h-6 w-20 rounded-full" />
                        <Skeleton className="h-4 w-24 hidden md:block" />
                        <Skeleton className="h-8 w-8 rounded-lg" />
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Grid View Skeleton ───────────────────────────────────────────────────────

export function GridSkeleton({ count = 8 }: { count?: number }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-neutral-100 p-4 h-[180px] flex flex-col gap-3 shadow-sm">
                    <div className="flex items-center gap-3">
                        <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                        </div>
                    </div>
                    <div className="space-y-2 mt-2">
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-2/3" />
                    </div>
                    <div className="mt-auto flex justify-between items-center">
                        <Skeleton className="h-5 w-20 rounded-full" />
                        <Skeleton className="h-3 w-24" />
                    </div>
                </div>
            ))}
        </div>
    );
}

// ─── Kanban Board Skeleton ─────────────────────────────────────────────────────

export function KanbanSkeleton() {
    return (
        <div className="flex gap-4 overflow-hidden py-1 px-1">
            {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="w-[300px] shrink-0 space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-5 w-8 rounded-full" />
                    </div>
                    <Skeleton className="h-1 w-full rounded-full" />
                    <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, j) => (
                            <div key={j} className="bg-white rounded-xl border border-neutral-100 p-3 h-32 space-y-3 shadow-sm">
                                <div className="flex justify-between">
                                    <Skeleton className="h-4 w-2/3" />
                                    <Skeleton className="h-3 w-4" />
                                </div>
                                <Skeleton className="h-3 w-full" />
                                <Skeleton className="h-3 w-1/3" />
                                <div className="pt-2 flex gap-2">
                                    <Skeleton className="h-4 w-12 rounded-full" />
                                    <Skeleton className="h-4 w-12 rounded-full" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
