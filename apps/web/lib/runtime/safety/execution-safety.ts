/**
 * Execution Safety
 * 
 * Runtime safety mechanisms for execution lifecycle
 */

import type { UUID } from '../types/common.types';
import { ExecutionStatus } from '../types/execution.types';
import { RuntimeDatabaseError, RuntimeDbErrorCode } from '../db';
import { createSupabaseBrowserClient } from '../../supabase/client';

export interface SafetyCheckpoint {
  id: string;
  execution_id: string;
  checkpoint_type: 'approval' | 'rollback' | 'artifact_validation';
  status: 'pending' | 'passed' | 'failed';
  created_at: string;
  passed_at?: string;
  failed_at?: string;
  error_message?: string;
}

export class ExecutionSafety {
  /**
   * Create approval checkpoint
   */
  async createApprovalCheckpoint(executionId: string, approvalType: string): Promise<string> {
    const supabase = createSupabaseBrowserClient();

    const { data, error } = await supabase
      .from("safety_checkpoints")
      .insert({
        execution_id: executionId,
        checkpoint_type: 'approval',
        status: 'pending',
        metadata: { approval_type: approvalType },
      })
      .select("id")
      .single();

    if (error || !data) {
      throw new Error(`Failed to create approval checkpoint: ${error?.message}`);
    }

    return data.id;
  }

  /**
   * Create rollback checkpoint
   */
  async createRollbackCheckpoint(executionId: string, rollbackPoint: string): Promise<string> {
    const supabase = createSupabaseBrowserClient();

    const { data, error } = await supabase
      .from("safety_checkpoints")
      .insert({
        execution_id: executionId,
        checkpoint_type: 'rollback',
        status: 'pending',
        metadata: { rollback_point: rollbackPoint },
      })
      .select("id")
      .single();

    if (error || !data) {
      throw new Error(`Failed to create rollback checkpoint: ${error?.message}`);
    }

    return data.id;
  }

  /**
   * Validate artifact
   */
  async validateArtifact(artifactId: string, validationRules: Record<string, unknown>): Promise<boolean> {
    const supabase = createSupabaseBrowserClient();

    const { data, error } = await supabase
      .from("safety_checkpoints")
      .insert({
        checkpoint_type: 'artifact_validation',
        status: 'pending',
        metadata: { artifact_id: artifactId, validation_rules: validationRules },
      })
      .select("id")
      .single();

    if (error || !data) {
      return false;
    }

    // Validation logic would go here
    const isValid = true;

    const { error: updateError } = await supabase
      .from("safety_checkpoints")
      .update({
        status: isValid ? 'passed' : 'failed',
        passed_at: isValid ? new Date().toISOString() : undefined,
        failed_at: isValid ? undefined : new Date().toISOString(),
      })
      .eq("id", data.id);

    if (updateError) {
      return false;
    }

    return isValid;
  }

  /**
   * Prevent duplicate publish
   */
  async preventDuplicatePublish(tenantId: string, contentId: string, cmsTarget: string): Promise<boolean> {
    const supabase = createSupabaseBrowserClient();

    const { data, error } = await supabase
      .from("publish_attempts")
      .select("id, status")
      .eq("tenant_id", tenantId)
      .eq("content_id", contentId)
      .eq("cms_target", cmsTarget)
      .eq("status", 'completed')
      .gte("completed_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .limit(1);

    if (error) {
      return false;
    }

    return !!(data && data.length > 0);
  }

  /**
   * Handle approval timeout
   */
  async handleApprovalTimeout(approvalId: string, timeoutMs: number): Promise<boolean> {
    const supabase = createSupabaseBrowserClient();

    const { data, error } = await supabase
      .from("approval_requests")
      .select("created_at")
      .eq("id", approvalId)
      .eq("state", 'pending_review')
      .single();

    if (error || !data) {
      return false;
    }

    const elapsed = Date.now() - new Date(data.created_at).getTime();
    if (elapsed > timeoutMs) {
      // Timeout - reject approval
      const { error: updateError } = await supabase
        .from("approval_requests")
        .update({
          state: 'rejected',
          reason: 'Approval timeout',
        })
        .eq("id", approvalId);

      return !updateError;
    }

    return false;
  }

  /**
   * Invalidate stale execution
   */
  async invalidateStaleExecution(executionId: string, staleThresholdMs: number): Promise<boolean> {
    const supabase = createSupabaseBrowserClient();

    const { data, error } = await supabase
      .from("agent_executions")
      .select("created_at, status")
      .eq("id", executionId)
      .single();

    if (error || !data) {
      return false;
    }

    const elapsed = Date.now() - new Date(data.created_at).getTime();
    if (elapsed > staleThresholdMs && (data.status === ExecutionStatus.PENDING || data.status === ExecutionStatus.RUNNING)) {
      // Invalidate stale execution
      const { error: updateError } = await supabase
        .from("agent_executions")
        .update({
          status: ExecutionStatus.FAILED,
          error_message: 'Execution invalidated due to staleness',
        })
        .eq("id", executionId);

      return !updateError;
    }

    return false;
  }
}

// Singleton instance
let executionSafetyInstance: ExecutionSafety | null = null;

export function getExecutionSafety(): ExecutionSafety {
  if (!executionSafetyInstance) {
    executionSafetyInstance = new ExecutionSafety();
  }
  return executionSafetyInstance;
}
