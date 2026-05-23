/**
 * Client Task Feed Component
 * Displays recent client task activity
 */

'use client';

import type { CommandCenterTask } from '@/lib/command-center/types';
import { PriorityBadge } from './PriorityBadge';
import { StatusBadge } from './StatusBadge';

interface ClientTaskFeedProps {
  tasks: CommandCenterTask[];
  limit?: number;
}

export function ClientTaskFeed({ tasks, limit = 10 }: ClientTaskFeedProps) {
  const recentTasks = tasks.slice(0, limit);

  if (recentTasks.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-slate-400 text-sm">No recent activity</div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {recentTasks.map(task => (
        <div
          key={task.id}
          className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/30 border border-slate-800/50 hover:bg-slate-800/50 transition-colors"
        >
          <div className="flex flex-col gap-1 mt-1">
            <PriorityBadge priority={task.priority} size="sm" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-slate-200 truncate">{task.title}</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-slate-500">{task.agent_name}</span>
              <span className="text-slate-700">•</span>
              <StatusBadge status={task.status} size="sm" />
            </div>
          </div>
          <div className="text-xs text-slate-500 whitespace-nowrap">
            {new Date(task.created_at).toLocaleDateString()}
          </div>
        </div>
      ))}
    </div>
  );
}
