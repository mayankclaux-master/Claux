/**
 * CLAUX Phase 3B — Task Filters Component
 * Dark tactical UI filters for Command Centre
 */

'use client';

import { useState } from 'react';
import type { TaskStatus, TaskPriority } from '@/lib/command-center/types';

interface TaskFiltersProps {
  onFilterChange?: (filters: { status?: TaskStatus; priority?: TaskPriority; agent_name?: string }) => void;
}

export function TaskFilters({ onFilterChange }: TaskFiltersProps) {
  const [status, setStatus] = useState<TaskStatus | ''>('');
  const [priority, setPriority] = useState<TaskPriority | ''>('');
  const [agent, setAgent] = useState<string>('');

  const handleStatusChange = (newStatus: TaskStatus | '') => {
    setStatus(newStatus);
    onFilterChange?.({
      status: newStatus || undefined,
      priority: priority || undefined,
      agent_name: agent || undefined,
    });
  };

  const handlePriorityChange = (newPriority: TaskPriority | '') => {
    setPriority(newPriority);
    onFilterChange?.({
      status: status || undefined,
      priority: newPriority || undefined,
      agent_name: agent || undefined,
    });
  };

  const handleAgentChange = (newAgent: string) => {
    setAgent(newAgent);
    onFilterChange?.({
      status: status || undefined,
      priority: priority || undefined,
      agent_name: newAgent || undefined,
    });
  };

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs font-medium text-slate-400 mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => handleStatusChange(e.target.value as TaskStatus | '')}
            className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="blocked">Blocked</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs font-medium text-slate-400 mb-1">Priority</label>
          <select
            value={priority}
            onChange={(e) => handlePriorityChange(e.target.value as TaskPriority | '')}
            className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
          >
            <option value="">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs font-medium text-slate-400 mb-1">Agent</label>
          <select
            value={agent}
            onChange={(e) => handleAgentChange(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
          >
            <option value="">All Agents</option>
            <option value="ARIA">ARIA</option>
            <option value="SCRIBE">SCRIBE</option>
            <option value="PUBLISH">PUBLISH</option>
            <option value="PULSE">PULSE</option>
            <option value="LOCL">LOCL</option>
            <option value="REPUTE">REPUTE</option>
            <option value="LINX">LINX</option>
            <option value="PRISM">PRISM</option>
            <option value="CORE">CORE</option>
          </select>
        </div>
      </div>
    </div>
  );
}
