/**
 * Command Center Shell Component
 * Main layout shell for Employee Command Centre
 */

'use client';

import { useState } from 'react';
import type { CommandCenterTask } from '@/lib/command-center/types';
import { EmployeeStatsBar } from './EmployeeStatsBar';
import { TaskFilters } from './TaskFilters';
import { TaskQueuePanel } from './TaskQueuePanel';
import { TaskDetailDrawer } from './TaskDetailDrawer';
import { QuickActionsBar } from './QuickActionsBar';
import { ClientTaskFeed } from './ClientTaskFeed';

interface CommandCenterShellProps {
  tenantId: string;
  initialTasks: CommandCenterTask[];
  stats: {
    pendingTasks: number;
    completedToday: number;
    criticalTasks: number;
    clientHealthScore: number;
  };
}

export function CommandCenterShell({ tenantId, initialTasks, stats }: CommandCenterShellProps) {
  const [tasks, setTasks] = useState<CommandCenterTask[]>(initialTasks);
  const [selectedTask, setSelectedTask] = useState<CommandCenterTask | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<{ status?: string; priority?: string; agent_name?: string }>({});

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
    // In production, this would trigger a refetch with filters
  };

  const handleTaskStart = async (taskId: string) => {
    try {
      const response = await fetch(`/api/command-center/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'in_progress' }),
      });
      const data = await response.json();
      if (data.success) {
        setTasks(prev => prev.map(t => t.id === taskId ? data.task : t));
      }
    } catch (error) {
      console.error('Failed to start task:', error);
    }
  };

  const handleTaskComplete = async (taskId: string) => {
    try {
      const response = await fetch(`/api/command-center/tasks/${taskId}/complete`, {
        method: 'POST',
      });
      const data = await response.json();
      if (data.success) {
        setTasks(prev => prev.map(t => t.id === taskId ? data.task : t));
      }
    } catch (error) {
      console.error('Failed to complete task:', error);
    }
  };

  const handleTaskBlock = async (taskId: string) => {
    try {
      const response = await fetch(`/api/command-center/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'blocked' }),
      });
      const data = await response.json();
      if (data.success) {
        setTasks(prev => prev.map(t => t.id === taskId ? data.task : t));
      }
    } catch (error) {
      console.error('Failed to block task:', error);
    }
  };

  const handleTaskViewDetails = (task: CommandCenterTask) => {
    setSelectedTask(task);
    setIsDrawerOpen(true);
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/command-center/tasks');
      const data = await response.json();
      if (data.success) {
        setTasks(data.tasks);
      }
    } catch (error) {
      console.error('Failed to refresh tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-slate-100">Command Centre</h1>
          <p className="text-sm text-slate-400 mt-1">Employee Operational Dashboard</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Bar */}
        <EmployeeStatsBar
          pendingTasks={stats.pendingTasks}
          completedToday={stats.completedToday}
          criticalTasks={stats.criticalTasks}
          clientHealthScore={stats.clientHealthScore}
        />

        {/* Quick Actions */}
        <QuickActionsBar onRefresh={handleRefresh} />

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Filters */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-4">
              <TaskFilters onFilterChange={handleFilterChange} />
              
              {/* Recent Activity */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-slate-200 mb-3">Recent Activity</h3>
                <ClientTaskFeed tasks={tasks} limit={5} />
              </div>
            </div>
          </div>

          {/* Center - Task Queue */}
          <div className="lg:col-span-3">
            <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-slate-200 mb-4">Task Queue</h2>
              <TaskQueuePanel
                tasks={tasks}
                loading={loading}
                onTaskStart={handleTaskStart}
                onTaskComplete={handleTaskComplete}
                onTaskBlock={handleTaskBlock}
                onTaskViewDetails={handleTaskViewDetails}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Task Detail Drawer */}
      <TaskDetailDrawer
        task={selectedTask}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onUpdateStatus={async (taskId, status) => {
          const response = await fetch(`/api/command-center/tasks/${taskId}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
          });
          const data = await response.json();
          if (data.success) {
            setTasks(prev => prev.map(t => t.id === taskId ? data.task : t));
            setSelectedTask(data.task);
          }
        }}
      />
    </div>
  );
}
