'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useDebounce } from './useDebounce';

interface UseDraftAutosaveOptions<T> {
    draftId: string;
    userId: string;
    data: T;
    onSave: (draftId: string, data: T & { savedAt: string }) => void;
    onRestore: () => (T & { savedAt: string }) | null;
    delay?: number;
    enabled?: boolean;
}

export function useDraftAutosave<T extends Record<string, unknown>>({
    draftId,
    userId,
    data,
    onSave,
    onRestore,
    delay = 1500,
    enabled = true,
}: UseDraftAutosaveOptions<T>) {
    const debounced = useDebounce(data, delay);
    const isFirstRender = useRef(true);

    // Save on debounced change
    useEffect(() => {
        if (!enabled || !userId || !draftId) return;
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        const hasContent = Object.values(debounced).some((v) =>
            Array.isArray(v) ? v.length > 0 : v !== '' && v !== false && v !== null && v !== undefined
        );
        if (hasContent) {
            onSave(draftId, { ...debounced, savedAt: new Date().toISOString() });
        }
    }, [debounced, draftId, userId, enabled, onSave]);

    const restore = useCallback(() => {
        return onRestore();
    }, [onRestore]);

    return { restore };
}
