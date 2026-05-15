/**
 * Approval Workflow System
 * 
 * Lightweight approval gates for:
 * - publishing approval
 * - media approval
 * - review-response approval
 * - destructive action approval
 * 
 * Approval states: pending_review, approved, rejected, rolled_back
 * Runtime-native, replay-safe, tenant-isolated, execution-traceable
 */

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export type ApprovalType = 'publishing' | 'media' | 'review_response' | 'destructive_action';
export type ApprovalState = 'pending_review' | 'approved' | 'rejected' | 'rolled_back';

export interface ApprovalRequest {
  id: string;
  tenant_id: string;
  execution_id: string;
  approval_type: ApprovalType;
  state: ApprovalState;
  requested_by: string;
  reviewed_by?: string;
  reviewed_at?: string;
  reason?: string;
  created_at: string;
  expires_at?: string;
}

export class ApprovalWorkflow {
  /**
   * Create approval request
   */
  async createApprovalRequest(
    tenantId: string,
    executionId: string,
    approvalType: ApprovalType,
    requestedBy: string,
    expiresInMs?: number
  ): Promise<string> {
    const supabase = createSupabaseBrowserClient();

    const expiresAt = expiresInMs ? new Date(Date.now() + expiresInMs).toISOString() : undefined;

    const { data, error } = await supabase
      .from("approval_requests")
      .insert({
        tenant_id: tenantId,
        execution_id: executionId,
        approval_type: approvalType,
        state: 'pending_review',
        requested_by: requestedBy,
        expires_at: expiresAt,
      })
      .select("id")
      .single();

    if (error || !data) {
      throw new Error(`Failed to create approval request: ${error?.message}`);
    }

    return data.id;
  }

  /**
   * Approve request
   */
  async approveRequest(approvalId: string, reviewedBy: string, reason?: string): Promise<void> {
    const supabase = createSupabaseBrowserClient();

    const { error } = await supabase
      .from("approval_requests")
      .update({
        state: 'approved',
        reviewed_by: reviewedBy,
        reviewed_at: new Date().toISOString(),
        reason,
      })
      .eq("id", approvalId);

    if (error) {
      throw new Error(`Failed to approve request: ${error.message}`);
    }
  }

  /**
   * Reject request
   */
  async rejectRequest(approvalId: string, reviewedBy: string, reason: string): Promise<void> {
    const supabase = createSupabaseBrowserClient();

    const { error } = await supabase
      .from("approval_requests")
      .update({
        state: 'rejected',
        reviewed_by: reviewedBy,
        reviewed_at: new Date().toISOString(),
        reason,
      })
      .eq("id", approvalId);

    if (error) {
      throw new Error(`Failed to reject request: ${error.message}`);
    }
  }

  /**
   * Rollback approval
   */
  async rollbackApproval(approvalId: string, reviewedBy: string, reason: string): Promise<void> {
    const supabase = createSupabaseBrowserClient();

    const { error } = await supabase
      .from("approval_requests")
      .update({
        state: 'rolled_back',
        reviewed_by: reviewedBy,
        reviewed_at: new Date().toISOString(),
        reason,
      })
      .eq("id", approvalId);

    if (error) {
      throw new Error(`Failed to rollback approval: ${error.message}`);
    }
  }

  /**
   * Get approval request
   */
  async getApprovalRequest(approvalId: string): Promise<ApprovalRequest | null> {
    const supabase = createSupabaseBrowserClient();

    const { data, error } = await supabase
      .from("approval_requests")
      .select("*")
      .eq("id", approvalId)
      .single();

    if (error || !data) {
      return null;
    }

    return data as ApprovalRequest;
  }

  /**
   * Get pending approvals for tenant
   */
  async getPendingApprovals(tenantId: string): Promise<ApprovalRequest[]> {
    const supabase = createSupabaseBrowserClient();

    const { data, error } = await supabase
      .from("approval_requests")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("state", 'pending_review')
      .order("created_at", { ascending: false });

    if (error || !data) {
      return [];
    }

    return data as ApprovalRequest[];
  }

  /**
   * Check if approval is expired
   */
  async checkApprovalExpiry(approvalId: string): Promise<boolean> {
    const request = await this.getApprovalRequest(approvalId);

    if (!request || !request.expires_at) {
      return false;
    }

    return new Date(request.expires_at) < new Date();
  }

  /**
   * Cancel expired approvals
   */
  async cancelExpiredApprovals(): Promise<number> {
    const supabase = createSupabaseBrowserClient();

    const { data, error } = await supabase
      .from("approval_requests")
      .select("id")
      .eq("state", 'pending_review')
      .lt("expires_at", new Date().toISOString());

    if (error || !data) {
      return 0;
    }

    const ids = data.map(d => d.id);

    if (ids.length === 0) {
      return 0;
    }

    const { error: updateError } = await supabase
      .from("approval_requests")
      .update({ state: 'rejected' })
      .in("id", ids);

    if (updateError) {
      return 0;
    }

    return ids.length;
  }
}

// Singleton instance
let approvalWorkflowInstance: ApprovalWorkflow | null = null;

export function getApprovalWorkflow(): ApprovalWorkflow {
  if (!approvalWorkflowInstance) {
    approvalWorkflowInstance = new ApprovalWorkflow();
  }
  return approvalWorkflowInstance;
}
