/**
 * Execution Deduplication
 * 
 * Prevents duplicate executions based on tenant, agent, and workflow configuration
 */

import type { UUID } from '../types';
import { ExecutionStatus } from '../types';
import { RuntimeDatabaseError, RuntimeDbErrorCode } from '../db';

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export interface ExecutionFingerprint {
  tenantId: string;
  agentName: string;
  workflowType: string;
  inputHash: string;
  fingerprint: string;
}

export interface DeduplicationResult {
  isDuplicate: boolean;
  existingExecutionId?: string;
  reason?: string;
}

export class ExecutionDeduplication {
  /**
   * Generate execution fingerprint from input parameters
   */
  generateFingerprint(params: ExecutionFingerprint): string {
    const { tenantId, agentName, workflowType, inputHash } = params;
    return `${tenantId}:${agentName}:${workflowType}:${inputHash}`;
  }

  /**
   * Check for duplicate execution
   */
  async checkDuplicate(params: ExecutionFingerprint): Promise<DeduplicationResult> {
    const fingerprint = this.generateFingerprint(params);

    // Check if execution with this fingerprint already exists
    // This would query agent_executions for recent executions with matching fingerprint
    // For now, we'll implement a basic check
    const supabase = createSupabaseBrowserClient();

    const { data: existingExecutions } = await supabase
      .from("agent_executions")
      .select("id, status, created_at")
      .eq("tenant_id", params.tenantId)
      .eq("agent_name", params.agentName)
      .eq("workflow_type", params.workflowType)
      .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
      .limit(10);

    if (!existingExecutions || existingExecutions.length === 0) {
      return { isDuplicate: false };
    }

    // Check for running executions
    const runningExecution = existingExecutions.find(e => e.status === ExecutionStatus.RUNNING || e.status === ExecutionStatus.PENDING);
    if (runningExecution) {
      return {
        isDuplicate: true,
        existingExecutionId: runningExecution.id,
        reason: 'Execution already running',
      };
    }

    // Check for recently completed executions (within last hour)
    const recentCompletion = existingExecutions.find(e => 
      e.status === ExecutionStatus.COMPLETED && 
      new Date(e.created_at).getTime() > Date.now() - 60 * 60 * 1000
    );
    if (recentCompletion) {
      return {
        isDuplicate: true,
        existingExecutionId: recentCompletion.id,
        reason: 'Execution completed recently (within last hour)',
      };
    }

    return { isDuplicate: false };
  }

  /**
   * Generate input hash from payload
   */
  generateInputHash(inputPayload: Record<string, unknown>): string {
    // Simple hash implementation - in production use crypto
    const sorted = Object.keys(inputPayload).sort();
    const str = JSON.stringify(inputPayload, sorted);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Check for duplicate task
   */
  async checkDuplicateTask(executionId: string, taskName: string, taskType: string): Promise<boolean> {
    const supabase = createSupabaseBrowserClient();

    const { data: existingTasks } = await supabase
      .from("agent_tasks")
      .select("id, status")
      .eq("execution_id", executionId)
      .eq("task_name", taskName)
      .eq("task_type", taskType)
      .in("status", ["pending", "running"]);

    return !!(existingTasks && existingTasks.length > 0);
  }

  /**
   * Prevent replay collision
   */
  async preventReplayCollision(executionId: string): Promise<boolean> {
    const supabase = createSupabaseBrowserClient();

    const { data: execution } = await supabase
      .from("agent_executions")
      .select("status")
      .eq("id", executionId)
      .single();

    if (!execution) {
      return false;
    }

    /**
     * Check if execution is active
     */
    if (this.isExecutionActive(execution)) {
      return true;
    }

    return false;
  }

  /**
   * Check if execution is active
   */
  isExecutionActive(execution: any): boolean {
    return execution.status === ExecutionStatus.RUNNING || execution.status === ExecutionStatus.COMPLETED;
  }
}

// Singleton instance
let deduplicationInstance: ExecutionDeduplication | null = null;

export function getExecutionDeduplication(): ExecutionDeduplication {
  if (!deduplicationInstance) {
    deduplicationInstance = new ExecutionDeduplication();
  }
  return deduplicationInstance;
}
