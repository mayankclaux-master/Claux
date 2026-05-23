/**
 * Task Card Component
 * Displays individual task with quick actions
 */

'use client';

import { useState } from 'react';
import type { CommandCenterTask } from '@/lib/command-center/types';
import { PriorityBadge } from './PriorityBadge';
import { StatusBadge } from './StatusBadge';

interface TaskCardProps {
  task: CommandCenterTask;
  onStart?: (taskId: string) => void;
  onComplete?: (taskId: string) => void;
  onBlock?: (taskId: string) => void;
  onViewDetails?: (task: CommandCenterTask) => void;
}

export function TaskCard({ task, onStart, onComplete, onBlock, onViewDetails }: TaskCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleStart = async () => {
    setIsLoading(true);
    try {
      await onStart?.(task.id);
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      await onComplete?.(task.id);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBlock = async () => {
    setIsLoading(true);
    try {
      await onBlock?.(task.id);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHrs < 0) return 'Overdue';
    if (diffHrs < 1) return 'Due now';
    if (diffHrs < 24) return `Due in ${diffHrs}h`;
    if (diffDays < 7) return `Due in ${diffDays}d`;
    return date.toLocaleDateString();
  };

  const dueDisplay = formatDate(task.due_at || null);

  return (
    <div className="group relative rounded-lg border border-slate-800 bg-slate-900/50 p-4 hover:border-slate-700 hover:bg-slate-900/80 transition-all">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <PriorityBadge priority={task.priority} size="sm" />
          <StatusBadge status={task.status} size="sm" />
        </div>
        {dueDisplay && (
          <span className={`text-xs ${dueDisplay === 'Overdue' ? 'text-red-400' : 'text-slate-500'}`}>
            {dueDisplay}
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className="text-sm font-semibold text-slate-100 mb-2 line-clamp-2">
        {task.title}
      </h3>

      {/* Description */}
      {task.description && (
        <p className="text-xs text-slate-400 mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Metadata */}
      <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
        <span className="font-medium text-slate-400">{task.agent_name}</span>
        {task.client_id && <span>• Client Task</span>}
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-2">
        {task.status === 'pending' && (
          <button
            onClick={handleStart}
            disabled={isLoading}
            className="flex-1 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 rounded hover:bg-slate-700 disabled:opacity-50 transition-colors"
          >
            Start
          </button>
        )}
        {task.status === 'in_progress' && (
          <>
            <button
              onClick={handleComplete}
              disabled={isLoading}
              className="flex-1 px-3 py-1.5 text-xs font-medium text-green-400 bg-green-500/10 rounded hover:bg-green-500/20 disabled:opacity-50 transition-colors"
            >
              Complete
            </button>
            <button
              onClick={handleBlock}
              disabled={isLoading}
              className="px-3 py-1.5 text-xs font-medium text-red-400 bg-red-500/10 rounded hover:bg-red-500/20 disabled:opacity-50 transition-colors"
            >
              Block
            </button>
          </>
        )}
        <button
          onClick={() => onViewDetails?.(task)}
          className="px-3 py-1.5 text-xs font-medium text-slate-400 bg-slate-800/50 rounded hover:bg-slate-800 transition-colors"
        >
          Details
        </button>
      </div>
    </div>
  );
}
