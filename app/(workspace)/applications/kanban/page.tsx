import { redirect } from 'next/navigation';

/**
 * The Kanban board is now integrated into the unified Pipeline page.
 * Direct links to /applications/kanban continue to work via this redirect.
 */
export default function KanbanRedirectPage() {
    redirect('/applications?view=kanban');
}
