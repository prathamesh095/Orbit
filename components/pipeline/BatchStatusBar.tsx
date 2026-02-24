'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, X, CheckSquare, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BatchStatusBarProps {
    selectedCount: number;
    onClear: () => void;
    onDelete: () => void;
    onStatusUpdate?: (status: string) => void;
}

export function BatchStatusBar({ selectedCount, onClear, onDelete }: BatchStatusBarProps) {
    return (
        <AnimatePresence>
            {selectedCount > 0 && (
                <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 w-full max-w-lg pointer-events-none">
                    <motion.div
                        initial={{ y: 20, opacity: 0, scale: 0.95 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: 20, opacity: 0, scale: 0.95 }}
                        className="bg-neutral-900 text-white rounded-2xl shadow-2xl p-2 flex items-center gap-3 pointer-events-auto border border-white/10"
                    >
                        <div className="flex items-center gap-2 pl-3 pr-4 border-r border-white/10 py-1">
                            <CheckSquare className="w-4 h-4 text-blue-400" />
                            <span className="text-[13px] font-bold">{selectedCount} selected</span>
                        </div>

                        <div className="flex items-center gap-1.5 flex-1 justify-center">
                            <button
                                onClick={onDelete}
                                className="flex items-center gap-2 h-9 px-4 rounded-xl text-[13px] font-bold hover:bg-red-500/10 text-red-400 transition-colors"
                            >
                                <Trash2 className="w-4 h-4" /> Delete
                            </button>
                            <button
                                className="flex items-center gap-2 h-9 px-4 rounded-xl text-[13px] font-bold hover:bg-white/5 text-white/80 transition-colors"
                            >
                                <MoreHorizontal className="w-4 h-4" /> More
                            </button>
                        </div>

                        <button
                            onClick={onClear}
                            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
