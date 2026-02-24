'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps {
    className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
    return (
        <div
            className={cn(
                'animate-pulse rounded-md bg-[#F2F2F7]',
                className
            )}
            aria-hidden="true"
        />
    );
}

export function SkeletonCard() {
    return (
        <div className="bg-white rounded-[22px] border border-[#000000]/05 p-6 space-y-4 shadow-apple-md">
            <Skeleton className="h-5 w-3/4 rounded-full" />
            <Skeleton className="h-4 w-1/2 rounded-full" />
            <div className="flex gap-2 mt-4">
                <Skeleton className="h-7 w-20 rounded-[8px]" />
                <Skeleton className="h-7 w-16 rounded-[8px]" />
            </div>
        </div>
    );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
    return (
        <div className="space-y-3">
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex gap-4 p-4 bg-white rounded-[18px] border border-[#000000]/05">
                    <Skeleton className="h-10 w-10 rounded-[12px] shrink-0" />
                    <div className="flex-1 space-y-2.5 pt-1">
                        <Skeleton className="h-4 w-1/3 rounded-full" />
                        <Skeleton className="h-3 w-1/2 rounded-full" />
                    </div>
                    <Skeleton className="h-7 w-20 rounded-[10px] self-center" />
                </div>
            ))}
        </div>
    );
}

export function SkeletonKPICard() {
    return (
        <div className="bg-white rounded-[22px] border border-[#000000]/05 p-6 space-y-5 shadow-apple-md">
            <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24 rounded-full" />
                <Skeleton className="h-10 w-10 rounded-[12px]" />
            </div>
            <Skeleton className="h-9 w-20 rounded-full" />
            <Skeleton className="h-3.5 w-32 rounded-full" />
        </div>
    );
}
