'use client';

import { useState, useCallback } from 'react';
import type { Template, TemplateFormData } from '@/types/template';
import * as storageService from '@/services/storage/storageService';
import { generateId } from '@/lib/utils';

export function useTemplates(userId: string) {
    const [templates, setTemplates] = useState<Template[]>(() => {
        if (!userId) return [];
        return storageService.getTemplates(userId);
    });

    const createTemplate = useCallback(
        (data: TemplateFormData): Template => {
            const now = new Date().toISOString();
            const tmpl: Template = {
                ...data,
                id: generateId(),
                userId,
                useCount: 0,
                createdAt: now,
                updatedAt: now,
            };
            storageService.upsertTemplate(userId, tmpl);
            setTemplates((prev) => [tmpl, ...prev]);
            return tmpl;
        },
        [userId]
    );

    const updateTemplate = useCallback(
        (id: string, data: Partial<TemplateFormData>): Template | null => {
            const existing = templates.find((t) => t.id === id);
            if (!existing) return null;
            const now = new Date().toISOString();
            const updated: Template = { ...existing, ...data, id, userId, updatedAt: now };
            storageService.upsertTemplate(userId, updated);
            setTemplates((prev) => prev.map((t) => (t.id === id ? updated : t)));
            return updated;
        },
        [userId, templates]
    );

    const deleteTemplate = useCallback(
        (id: string) => {
            storageService.deleteTemplate(userId, id);
            setTemplates((prev) => prev.filter((t) => t.id !== id));
        },
        [userId]
    );

    const duplicateTemplate = useCallback(
        (id: string): Template | null => {
            const source = templates.find((t) => t.id === id);
            if (!source) return null;
            return createTemplate({
                title: `${source.title} (Copy)`,
                category: source.category,
                content: source.content,
            });
        },
        [templates, createTemplate]
    );

    const incrementUseCount = useCallback(
        (id: string) => {
            const existing = templates.find((t) => t.id === id);
            if (!existing) return;
            const updated = { ...existing, useCount: existing.useCount + 1, updatedAt: new Date().toISOString() };
            storageService.upsertTemplate(userId, updated);
            setTemplates((prev) => prev.map((t) => (t.id === id ? updated : t)));
        },
        [userId, templates]
    );

    return {
        templates,
        createTemplate,
        updateTemplate,
        deleteTemplate,
        duplicateTemplate,
        incrementUseCount,
    };
}
