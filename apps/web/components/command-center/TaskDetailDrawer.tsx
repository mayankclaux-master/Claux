/**
 * Task Detail Drawer Component
 * Displays complete task details with copy-ready outputs
 */

'use client';

import { useState } from 'react';
import type { CommandCenterTask } from '@/lib/command-center/types';
import { PriorityBadge } from './PriorityBadge';
import { StatusBadge } from './StatusBadge';

interface TaskDetailDrawerProps {
  task: CommandCenterTask | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus?: (taskId: string, status: string) => void;
  onAddNote?: (taskId: string, note: string) => void;
}

export function TaskDetailDrawer({ task, isOpen, onClose, onUpdateStatus, onAddNote }: TaskDetailDrawerProps) {
  const [note, setNote] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusUpdate = async (newStatus: string) => {
    if (!task) return;
    setIsUpdating(true);
    try {
      await onUpdateStatus?.(task.id, newStatus);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddNote = async () => {
    if (!task || !note.trim()) return;
    try {
      await onAddNote?.(task.id, note);
      setNote('');
    } catch (error) {
      console.error('Failed to add note:', error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (!task || !isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative ml-auto h-full w-full max-w-lg bg-slate-900 border-l border-slate-800 shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900/95 backdrop-blur border-b border-slate-800 p-4 z-10">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <PriorityBadge priority={task.priority} size="sm" />
              <StatusBadge status={task.status} size="sm" />
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <h2 className="text-lg font-semibold text-slate-100">{task.title}</h2>
          {task.description && (
            <p className="text-sm text-slate-400 mt-1">{task.description}</p>
          )}
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Metadata */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Task Metadata</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-slate-500">Agent</div>
                <div className="text-slate-200">{task.agent_name}</div>
              </div>
              <div>
                <div className="text-slate-500">Type</div>
                <div className="text-slate-200">{task.task_type}</div>
              </div>
              <div>
                <div className="text-slate-500">Created</div>
                <div className="text-slate-200">{new Date(task.created_at).toLocaleString()}</div>
              </div>
              {task.due_at && (
                <div>
                  <div className="text-slate-500">Due</div>
                  <div className="text-slate-200">{new Date(task.due_at).toLocaleString()}</div>
                </div>
              )}
              {task.assigned_to && (
                <div>
                  <div className="text-slate-500">Assigned To</div>
                  <div className="text-slate-200">{task.assigned_to}</div>
                </div>
              )}
            </div>
          </div>

          {/* Source Execution */}
          {task.source_execution_id && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Source Execution</h3>
              <div className="bg-slate-800/50 rounded-lg p-3">
                <div className="text-sm text-slate-400 mb-2">Execution ID</div>
                <div className="flex items-center gap-2">
                  <code className="text-xs text-slate-200 bg-slate-800 px-2 py-1 rounded flex-1">
                    {task.source_execution_id}
                  </code>
                  <button
                    onClick={() => task.source_execution_id && copyToClipboard(task.source_execution_id)}
                    className="text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Action Payload */}
          {task.action_payload && Object.keys(task.action_payload).length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Action Payload</h3>
              <div className="bg-slate-800/50 rounded-lg p-3">
                <pre className="text-xs text-slate-300 overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(task.action_payload, null, 2)}
                </pre>
                <button
                  onClick={() => copyToClipboard(JSON.stringify(task.action_payload, null, 2))}
                  className="mt-2 text-xs text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Copy Payload
                </button>
              </div>
            </div>
          )}

          {/* Metadata */}
          {task.metadata && Object.keys(task.metadata).length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Additional Metadata</h3>
              <div className="bg-slate-800/50 rounded-lg p-3">
                <pre className="text-xs text-slate-300 overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(task.metadata, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Quick Actions</h3>
            <div className="flex gap-2">
              {task.status === 'pending' && (
                <button
                  onClick={() => handleStatusUpdate('in_progress')}
                  disabled={isUpdating}
                  className="flex-1 px-4 py-2 text-sm font-medium text-slate-200 bg-blue-500/10 border border-blue-500/30 rounded hover:bg-blue-500/20 disabled:opacity-50 transition-colors"
                >
                  Start Task
                </button>
              )}
              {task.status === 'in_progress' && (
                <>
                  <button
                    onClick={() => handleStatusUpdate('completed')}
                    disabled={isUpdating}
                    className="flex-1 px-4 py-2 text-sm font-medium text-green-400 bg-green-500/10 border border-green-500/30 rounded hover:bg-green-500/20 disabled:opacity-50 transition-colors"
                  >
                    Complete
                  </button>
                  <button
                    onClick={() => handleStatusUpdate('blocked')}
                    disabled={isUpdating}
                    className="flex-1 px-4 py-2 text-sm font-medium text-red-400 bg-red-500/10 border border-red-500/30 rounded hover:bg-red-500/20 disabled:opacity-50 transition-colors"
                  >
                    Block
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Add Note */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Add Note</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a note..."
                className="flex-1 bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
              />
              <button
                onClick={handleAddNote}
                disabled={!note.trim()}
                className="px-4 py-2 text-sm font-medium text-slate-200 bg-slate-800 border border-slate-700 rounded hover:bg-slate-700 disabled:opacity-50 transition-colors"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
