/**
 * CLAUX Phase 2B — Task Priority Badge Component
 * Simple badge for displaying task priority
 */

import type { TaskPriority } from '@/lib/command-center/types';

interface TaskPriorityBadgeProps {
  priority: TaskPriority;
}

export function TaskPriorityBadge({ priority }: TaskPriorityBadgeProps) {
  const colors: Record<TaskPriority, string> = {
    critical: 'bg-red-100 text-red-800',
    high: 'bg-orange-100 text-orange-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-gray-100 text-gray-800',
  };

  return (
    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${colors[priority]}`}>
      {priority}
    </span>
  );
}
