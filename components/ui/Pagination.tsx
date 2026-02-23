'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    className?: string;
}

export function Pagination({ page, totalPages, onPageChange, className }: PaginationProps) {
    if (totalPages <= 1) return null;

    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
    const visiblePages = pages.filter(
        (p) => p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1)
    );

    const rendered: React.ReactNode[] = [];
    let prev = 0;

    for (const p of visiblePages) {
        if (prev && p - prev > 1) {
            rendered.push(
                <span key={`ellipsis-${p}`} className="px-2 text-gray-400 select-none">
                    ...
                </span>
            );
        }
        rendered.push(
            <button
                key={p}
                onClick={() => onPageChange(p)}
                aria-current={p === page ? 'page' : undefined}
                className={cn(
                    'w-8 h-8 rounded-lg text-sm font-medium transition-colors',
                    p === page
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                )}
            >
                {p}
            </button>
        );
        prev = p;
    }

    return (
        <nav aria-label="Pagination" className={cn('flex items-center gap-1', className)}>
            <button
                onClick={() => onPageChange(page - 1)}
                disabled={page === 1}
                aria-label="Previous page"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
                <ChevronLeft className="w-4 h-4" />
            </button>
            {rendered}
            <button
                onClick={() => onPageChange(page + 1)}
                disabled={page === totalPages}
                aria-label="Next page"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
                <ChevronRight className="w-4 h-4" />
            </button>
        </nav>
    );
}
