/**
 * Task Queue Panel Component
 * Displays prioritized task queue with infinite scroll style
 */

'use client';

import { useEffect, useState } from 'react';
import type { CommandCenterTask } from '@/lib/command-center/types';
import { TaskCard } from './TaskCard';

interface TaskQueuePanelProps {
  tasks: CommandCenterTask[];
  loading?: boolean;
  onTaskStart?: (taskId: string) => void;
  onTaskComplete?: (taskId: string) => void;
  onTaskBlock?: (taskId: string) => void;
  onTaskViewDetails?: (task: CommandCenterTask) => void;
  onLoadMore?: () => void;
}

export function TaskQueuePanel({
  tasks,
  loading = false,
  onTaskStart,
  onTaskComplete,
  onTaskBlock,
  onTaskViewDetails,
  onLoadMore,
}: TaskQueuePanelProps) {
  const [visibleTasks, setVisibleTasks] = useState<CommandCenterTask[]>([]);
  const [page, setPage] = useState(1);
  const tasksPerPage = 20;

  useEffect(() => {
    setVisibleTasks(tasks.slice(0, tasksPerPage));
    setPage(1);
  }, [tasks]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    const start = nextPage * tasksPerPage;
    const end = start + tasksPerPage;
    const newTasks = tasks.slice(start, end);

    if (newTasks.length > 0) {
      setVisibleTasks(prev => [...prev, ...newTasks]);
      setPage(nextPage);
    }

    onLoadMore?.();
  };

  if (tasks.length === 0 && !loading) {
    return (
      <div className="text-center py-12">
        <div className="text-slate-400 text-sm">No tasks found</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {visibleTasks.map(task => (
        <TaskCard
          key={task.id}
          task={task}
          onStart={onTaskStart}
          onComplete={onTaskComplete}
          onBlock={onTaskBlock}
          onViewDetails={onTaskViewDetails}
        />
      ))}

      {loading && (
        <div className="text-center py-4">
          <div className="text-slate-400 text-sm">Loading tasks...</div>
        </div>
      )}

      {!loading && visibleTasks.length < tasks.length && (
        <button
          onClick={handleLoadMore}
          className="w-full py-3 text-sm text-slate-400 hover:text-slate-200 transition-colors"
        >
          Load More Tasks
        </button>
      )}
    </div>
  );
}
