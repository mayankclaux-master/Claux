/**
 * Status Badge Component
 * Displays task status with color coding
 */

import type { TaskStatus } from '@/lib/command-center/types';

interface StatusBadgeProps {
  status: TaskStatus;
  size?: 'sm' | 'md' | 'lg';
}

const statusStyles: Record<TaskStatus, { bg: string; text: string; border: string }> = {
  pending: {
    bg: 'bg-slate-500/10',
    text: 'text-slate-400',
    border: 'border-slate-500/30',
  },
  in_progress: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    border: 'border-blue-500/30',
  },
  completed: {
    bg: 'bg-green-500/10',
    text: 'text-green-400',
    border: 'border-green-500/30',
  },
  blocked: {
    bg: 'bg-red-500/10',
    text: 'text-red-400',
    border: 'border-red-500/30',
  },
  cancelled: {
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

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const style = statusStyles[status];
  const sizeStyle = sizeStyles[size];

  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium capitalize ${style.bg} ${style.text} ${style.border} ${sizeStyle}`}
    >
      {status.replace('_', ' ')}
    </span>
  );
}
