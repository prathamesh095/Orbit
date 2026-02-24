'use client';

import { memo } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { PipelineColumn } from '../kanban/PipelineColumn';
import type { Application, ApplicationStatus } from '@/types';

interface KanbanViewProps {
    apps: Application[];
    onStatusChange: (id: string, newStatus: ApplicationStatus) => void;
    onDelete: (id: string) => void;
    onView: (id: string) => void;
    onEdit: (id: string) => void;
    selectedIds: Set<string>;
    toggleSelection: (id: string) => void;
}

const COLUMNS: { id: ApplicationStatus; title: string; dot: string; bg: string; accent: string }[] = [
    { id: 'draft', title: 'Drafts', dot: 'bg-neutral-400', bg: 'bg-neutral-50/50', accent: 'text-neutral-600' },
    { id: 'applied', title: 'Applied', dot: 'bg-blue-500', bg: 'bg-blue-50/30', accent: 'text-blue-700' },
    { id: 'interviewing', title: 'Interviewing', dot: 'bg-amber-500', bg: 'bg-amber-50/30', accent: 'text-amber-700' },
    { id: 'offer', title: 'Offers', dot: 'bg-emerald-500', bg: 'bg-emerald-50/30', accent: 'text-emerald-700' },
    { id: 'rejected', title: 'Rejected', dot: 'bg-red-400', bg: 'bg-red-50/30', accent: 'text-red-600' },
];

export const KanbanView = memo(function KanbanView({
    apps,
    onStatusChange,
    onDelete,
    onView,
    onEdit,
    selectedIds,
    toggleSelection
}: KanbanViewProps) {
    const onDragEnd = (result: DropResult) => {
        const { destination, draggableId } = result;
        if (!destination) return;
        if (destination.droppableId === result.source.droppableId) return;

        onStatusChange(draggableId, destination.droppableId as ApplicationStatus);
    };

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex gap-6 overflow-x-auto pb-8 h-full min-h-[600px] custom-scrollbar lg:justify-start">
                {COLUMNS.map((col) => (
                    <PipelineColumn
                        key={col.id}
                        id={col.id}
                        title={col.title}
                        dotClass={col.dot}
                        bgClass={col.bg}
                        accentClass={col.accent}
                        applications={apps.filter((a) => a.status === col.id)}
                        totalApplications={apps.length}
                        selectedIds={selectedIds}
                        toggleSelection={toggleSelection}
                        onDeleteCard={onDelete}
                        onView={onView}
                        onEdit={onEdit}
                    />
                ))}
            </div>
        </DragDropContext>
    );
});
