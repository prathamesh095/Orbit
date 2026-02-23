'use client';

import { Droppable, Draggable } from '@hello-pangea/dnd';
import type { Application } from '@/types';
import { KanbanCard } from './KanbanCard';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/ui/EmptyState';
import { Briefcase } from 'lucide-react';

interface KanbanColumnProps {
    id: string;
    title: string;
    color: string;
    applications: Application[];
    onCardClick: (app: Application) => void;
}

export function KanbanColumn({ id, title, color, applications, onCardClick }: KanbanColumnProps) {
    return (
        <div className="flex flex-col w-72 shrink-0">
            {/* Column Header */}
            <div className={cn('flex items-center justify-between px-3 py-2.5 rounded-xl mb-3', color)}>
                <h3 className="font-semibold text-sm">{title}</h3>
                <span className="text-xs font-bold bg-black/10 rounded-full px-2 py-0.5">
                    {applications.length}
                </span>
            </div>

            {/* Droppable area */}
            <Droppable droppableId={id}>
                {(provided, snapshot) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={cn(
                            'flex-1 min-h-40 rounded-xl p-2 transition-colors',
                            snapshot.isDraggingOver ? 'bg-blue-50 border-2 border-blue-200 border-dashed' : 'bg-gray-100/60'
                        )}
                    >
                        {applications.length === 0 && !snapshot.isDraggingOver && (
                            <div className="flex items-center justify-center h-24 text-xs text-gray-400">
                                Drop cards here
                            </div>
                        )}
                        <div className="space-y-2">
                            {applications.map((app, index) => (
                                <Draggable key={app.id} draggableId={app.id} index={index}>
                                    {(drag, dragSnapshot) => (
                                        <div
                                            ref={drag.innerRef}
                                            {...drag.draggableProps}
                                            {...drag.dragHandleProps}
                                            style={{
                                                ...drag.draggableProps.style,
                                                opacity: dragSnapshot.isDragging ? 0.9 : 1,
                                                transform: dragSnapshot.isDragging
                                                    ? `${drag.draggableProps.style?.transform ?? ''} rotate(2deg)`
                                                    : drag.draggableProps.style?.transform,
                                            }}
                                        >
                                            <KanbanCard application={app} onClick={() => onCardClick(app)} />
                                        </div>
                                    )}
                                </Draggable>
                            ))}
                        </div>
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </div>
    );
}
