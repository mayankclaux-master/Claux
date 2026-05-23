/**
 * Priority Badge Component
 * Displays task priority with color coding
 */

import type { TaskPriority } from '@/lib/command-center/types';

interface PriorityBadgeProps {
  priority: TaskPriority;
  size?: 'sm' | 'md' | 'lg';
}

const priorityStyles: Record<TaskPriority, { bg: string; text: string; border: string }> = {
  critical: {
    bg: 'bg-red-500/10',
    text: 'text-red-400',
    border: 'border-red-500/30',
  },
  high: {
    bg: 'bg-orange-500/10',
    text: 'text-orange-400',
    border: 'border-orange-500/30',
  },
  medium: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    border: 'border-blue-500/30',
  },
  low: {
    bg: 'bg-gray-500/10',
    text: 'text-gray-400',
    border: 'border-gray-500/30',
  },
};

const sizeStyles = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-1.5 text-base',
};

export function PriorityBadge({ priority, size = 'md' }: PriorityBadgeProps) {
  const style = priorityStyles[priority];
  const sizeStyle = sizeStyles[size];

  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium uppercase tracking-wide ${style.bg} ${style.text} ${style.border} ${sizeStyle}`}
    >
      {priority}
    </span>
  );
}
