/**
 * Quick Actions Bar Component
 * Provides quick access to common operations
 */

'use client';

interface QuickActionsBarProps {
  onRefresh?: () => void;
  onCreateTask?: () => void;
}

export function QuickActionsBar({ onRefresh, onCreateTask }: QuickActionsBarProps) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <button
        onClick={onRefresh}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-200 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Refresh
      </button>
      <button
        onClick={onCreateTask}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-200 bg-blue-500/10 border border-blue-500/30 rounded-lg hover:bg-blue-500/20 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Create Task
      </button>
    </div>
  );
}
