/**
 * Execution Audit Service
 * 
 * Canonical audit service for CLAUX V1.
 * Tracks execution duration, retry count, failure rate, timeout frequency, agent reliability, tenant execution volume.
 * Everything traceable by tenant, execution, traceId, agent.
 * 
 * CRITICAL: This is the ONLY execution audit service in CLAUX.
 */

import type { UUID } from '../runtime/types/common.types';
import { createClerkSupabaseClient } from '@/lib/supabase/admin';
import { createLogger, Logger } from '@/lib/utils/logger';
import { ErrorType } from './failure-classification';

/**
 * Execution audit entry
 */
export interface ExecutionAuditEntry {
  tenantId: UUID;
  executionId: UUID;
  traceId: UUID;
  agentName: string;
  executionType: 'cron' | 'manual' | 'api';
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  status: 'success' | 'failed' | 'timeout' | 'cancelled';
  errorType?: ErrorType;
  errorMessage?: string;
  retryCount: number;
  timeoutMs?: number;
}

/**
 * Execution audit service
 */
export class ExecutionAuditService {
  private logger: Logger;

  constructor() {
    this.logger = createLogger();
  }

  /**
   * Record execution start
   */
  async recordExecutionStart(
    tenantId: UUID,
    executionId: UUID,
    traceId: UUID,
    agentName: string,
    executionType: 'cron' | 'manual' | 'api',
    token: string
  ): Promise<void> {
    this.logger.info('Recording execution start', { tenantId, executionId, traceId, agentName });

    const supabase = createClerkSupabaseClient(token);

    const { error } = await supabase.from('execution_audit').insert({
      tenant_id: tenantId,
      execution_id: executionId,
      trace_id: traceId,
      agent_name: agentName,
      execution_type: executionType,
      started_at: new Date().toISOString(),
      status: 'success', // Default to success, will update on completion
      retry_count: 0,
    });

    if (error) {
      this.logger.error('Failed to record execution start', { error, tenantId, executionId });
      throw new Error(`Failed to record execution start: ${error.message}`);
    }

    this.logger.info('Execution start recorded successfully', { tenantId, executionId });
  }

  /**
   * Record execution completion
   */
  async recordExecutionCompletion(
    tenantId: UUID,
    executionId: UUID,
    status: 'success' | 'failed' | 'timeout' | 'cancelled',
    token: string,
    errorType?: ErrorType,
    errorMessage?: string,
    retryCount: number = 0,
    timeoutMs?: number
  ): Promise<void> {
    this.logger.info('Recording execution completion', { tenantId, executionId, status });

    const supabase = createClerkSupabaseClient(token);

    const startedAt = await this.getExecutionStartTime(tenantId, executionId, token);
    const completedAt = new Date();
    const durationMs = startedAt ? completedAt.getTime() - new Date(startedAt).getTime() : undefined;

    const { error } = await supabase
      .from('execution_audit')
      .update({
        completed_at: completedAt.toISOString(),
        duration_ms: durationMs,
        status,
        error_type: errorType,
        error_message: errorMessage,
        retry_count: retryCount,
        timeout_ms: timeoutMs,
      })
      .eq('tenant_id', tenantId)
      .eq('execution_id', executionId);

    if (error) {
      this.logger.error('Failed to record execution completion', { error, tenantId, executionId });
      throw new Error(`Failed to record execution completion: ${error.message}`);
    }

    this.logger.info('Execution completion recorded successfully', { tenantId, executionId, durationMs });
  }

  /**
   * Get execution start time
   */
  private async getExecutionStartTime(tenantId: UUID, executionId: UUID, token: string): Promise<string | null> {
    const supabase = createClerkSupabaseClient(token);

    const { data, error } = await supabase
      .from('execution_audit')
      .select('started_at')
      .eq('tenant_id', tenantId)
      .eq('execution_id', executionId)
      .maybeSingle();

    if (error) {
      this.logger.error('Failed to get execution start time', { error, tenantId, executionId });
      return null;
    }

    return (data as { started_at: string })?.started_at || null;
  }

  /**
   * Query execution audit by tenant
   */
  async queryByTenant(
    tenantId: UUID,
    token: string,
    limit: number = 100
  ): Promise<unknown[]> {
    this.logger.info('Querying execution audit by tenant', { tenantId, limit });

    const supabase = createClerkSupabaseClient(token);

    const { data, error } = await supabase
      .from('execution_audit')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('started_at', { ascending: false })
      .limit(limit);

    if (error) {
      this.logger.error('Failed to query execution audit by tenant', { error, tenantId });
      throw new Error(`Failed to query execution audit by tenant: ${error.message}`);
    }

    this.logger.info('Execution audit queried successfully', { tenantId, count: data?.length || 0 });
    return data || [];
  }

  /**
   * Query execution audit by agent
   */
  async queryByAgent(
    tenantId: UUID,
    agentName: string,
    token: string,
    limit: number = 100
  ): Promise<unknown[]> {
    this.logger.info('Querying execution audit by agent', { tenantId, agentName, limit });

    const supabase = createClerkSupabaseClient(token);

    const { data, error } = await supabase
      .from('execution_audit')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('agent_name', agentName)
      .order('started_at', { ascending: false })
      .limit(limit);

    if (error) {
      this.logger.error('Failed to query execution audit by agent', { error, tenantId, agentName });
      throw new Error(`Failed to query execution audit by agent: ${error.message}`);
    }

    this.logger.info('Execution audit by agent queried successfully', { tenantId, agentName, count: data?.length || 0 });
    return data || [];
  }

  /**
   * Query execution audit by trace ID
   */
  async queryByTraceId(tenantId: UUID, traceId: UUID, token: string): Promise<unknown | null> {
    this.logger.info('Querying execution audit by trace ID', { tenantId, traceId });

    const supabase = createClerkSupabaseClient(token);

    const { data, error } = await supabase
      .from('execution_audit')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('trace_id', traceId)
      .maybeSingle();

    if (error) {
      this.logger.error('Failed to query execution audit by trace ID', { error, tenantId, traceId });
      throw new Error(`Failed to query execution audit by trace ID: ${error.message}`);
    }

    this.logger.info('Execution audit by trace ID queried successfully', { tenantId, traceId });
    return data;
  }

  /**
   * Calculate agent reliability metrics
   */
  async calculateAgentReliability(
    tenantId: UUID,
    agentName: string,
    token: string,
    days: number = 30
  ): Promise<{
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    timeoutExecutions: number;
    successRate: number;
    averageDurationMs: number;
    averageRetryCount: number;
  }> {
    this.logger.info('Calculating agent reliability metrics', { tenantId, agentName, days });

    const supabase = createClerkSupabaseClient(token);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('execution_audit')
      .select('status, duration_ms, retry_count')
      .eq('tenant_id', tenantId)
      .eq('agent_name', agentName)
      .gte('started_at', startDate.toISOString());

    if (error) {
      this.logger.error('Failed to calculate agent reliability metrics', { error, tenantId, agentName });
      throw new Error(`Failed to calculate agent reliability metrics: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return {
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        timeoutExecutions: 0,
        successRate: 0,
        averageDurationMs: 0,
        averageRetryCount: 0,
      };
    }

    const totalExecutions = data.length;
    const successfulExecutions = data.filter((r: unknown) => (r as { status: string }).status === 'success').length;
    const failedExecutions = data.filter((r: unknown) => (r as { status: string }).status === 'failed').length;
    const timeoutExecutions = data.filter((r: unknown) => (r as { status: string }).status === 'timeout').length;
    const successRate = (successfulExecutions / totalExecutions) * 100;

    const durations = data
      .map((r: unknown) => (r as { duration_ms: number | null }).duration_ms)
      .filter((d): d is number => d !== null);
    const averageDurationMs = durations.length > 0 ? durations.reduce((sum, d) => sum + d, 0) / durations.length : 0;

    const retryCounts = data.map((r: unknown) => (r as { retry_count: number }).retry_count);
    const averageRetryCount = retryCounts.reduce((sum, rc) => sum + rc, 0) / retryCounts.length;

    this.logger.info('Agent reliability metrics calculated successfully', { 
      tenantId, 
      agentName, 
      successRate 
    });

    return {
      totalExecutions,
      successfulExecutions,
      failedExecutions,
      timeoutExecutions,
      successRate,
      averageDurationMs,
      averageRetryCount,
    };
  }

  /**
   * Calculate tenant execution volume
   */
  async calculateTenantExecutionVolume(
    tenantId: UUID,
    token: string,
    days: number = 30
  ): Promise<{
    totalExecutions: number;
    byAgent: Record<string, number>;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
  }> {
    this.logger.info('Calculating tenant execution volume', { tenantId, days });

    const supabase = createClerkSupabaseClient(token);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('execution_audit')
      .select('agent_name, execution_type, status')
      .eq('tenant_id', tenantId)
      .gte('started_at', startDate.toISOString());

    if (error) {
      this.logger.error('Failed to calculate tenant execution volume', { error, tenantId });
      throw new Error(`Failed to calculate tenant execution volume: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return {
        totalExecutions: 0,
        byAgent: {},
        byType: {},
        byStatus: {},
      };
    }

    const totalExecutions = data.length;
    const byAgent: Record<string, number> = {};
    const byType: Record<string, number> = {};
    const byStatus: Record<string, number> = {};

    for (const record of data) {
      const r = record as { agent_name: string; execution_type: string; status: string };
      
      byAgent[r.agent_name] = (byAgent[r.agent_name] || 0) + 1;
      byType[r.execution_type] = (byType[r.execution_type] || 0) + 1;
      byStatus[r.status] = (byStatus[r.status] || 0) + 1;
    }

    this.logger.info('Tenant execution volume calculated successfully', { tenantId, totalExecutions });

    return {
      totalExecutions,
      byAgent,
      byType,
      byStatus,
    };
  }
}

/**
 * Singleton instance
 */
export const executionAuditService = new ExecutionAuditService();
