/**
 * CLAUX Phase 2B — Task Filters Component
 * Simple filters for task table
 */

'use client';

import { useState } from 'react';
import type { TaskStatus, TaskPriority } from '@/lib/command-center/types';

interface TaskFiltersProps {
  onFilterChange?: (filters: { status?: TaskStatus; priority?: TaskPriority }) => void;
}

export function TaskFilters({ onFilterChange }: TaskFiltersProps) {
  const [status, setStatus] = useState<TaskStatus | ''>('');
  const [priority, setPriority] = useState<TaskPriority | ''>('');

  const handleStatusChange = (newStatus: TaskStatus | '') => {
    setStatus(newStatus);
    onFilterChange?.({
      status: newStatus || undefined,
      priority: priority || undefined,
    });
  };

  const handlePriorityChange = (newPriority: TaskPriority | '') => {
    setPriority(newPriority);
    onFilterChange?.({
      status: status || undefined,
      priority: newPriority || undefined,
    });
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex space-x-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => handleStatusChange(e.target.value as TaskStatus | '')}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="blocked">Blocked</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
          <select
            value={priority}
            onChange={(e) => handlePriorityChange(e.target.value as TaskPriority | '')}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            <option value="">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>
    </div>
  );
}
