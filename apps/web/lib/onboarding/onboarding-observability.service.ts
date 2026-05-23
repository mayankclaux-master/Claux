/**
 * Onboarding Observability Service
 * 
 * Canonical onboarding observability service for CLAUX V1 onboarding.
 * Tracks onboarding duration, stage duration, onboarding failures, retry counts, activation success rate, connector readiness rate, bootstrap execution failures.
 * Everything searchable by tenant_id, traceId, execution_id.
 * 
 * CRITICAL: This is the ONLY onboarding observability service in CLAUX.
 */

import type { UUID } from '../runtime/types/common.types';
import { createClerkSupabaseClient } from '@/lib/supabase/admin';
import { createLogger, Logger } from '@/lib/utils/logger';

/**
 * Onboarding metrics
 */
export interface OnboardingMetrics {
  onboardingDuration: number; // ms
  stageDurations: Record<string, number>; // stage -> duration ms
  failureCount: number;
  retryCount: number;
  activationSuccessRate: number; // 0-100
  connectorReadinessRate: number; // 0-100
  bootstrapExecutionFailures: number;
}

/**
 * Onboarding observability service
 */
export class OnboardingObservabilityService {
  private logger: Logger;

  constructor() {
    this.logger = createLogger();
  }

  /**
   * Get onboarding metrics for tenant
   */
  async getOnboardingMetrics(tenantId: UUID, token: string): Promise<OnboardingMetrics> {
    this.logger.info('Getting onboarding metrics', { tenantId });

    const supabase = createClerkSupabaseClient(token);

    // Get onboarding session
    const { data: session } = await supabase
      .from('onboarding_sessions')
      .select('*')
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (!session) {
      return {
        onboardingDuration: 0,
        stageDurations: {},
        failureCount: 0,
        retryCount: 0,
        activationSuccessRate: 0,
        connectorReadinessRate: 0,
        bootstrapExecutionFailures: 0,
      };
    }

    // Calculate onboarding duration
    const onboardingDuration = session.completed_at
      ? new Date(session.completed_at).getTime() - new Date(session.created_at).getTime()
      : 0;

    // Get stage durations from events
    const { data: events } = await supabase
      .from('onboarding_events')
      .select('event_stage, duration_ms')
      .eq('onboarding_session_id', session.id)
      .eq('success', true);

    const stageDurations: Record<string, number> = {};
    if (events) {
      for (const event of events) {
        stageDurations[event.event_stage] = (stageDurations[event.event_stage] || 0) + (event.duration_ms || 0);
      }
    }

    // Get failure count
    const { count: failureCount } = await supabase
      .from('onboarding_failures')
      .select('*', { count: 'exact', head: true })
      .eq('onboarding_session_id', session.id);

    // Get retry count
    const retryCount = session.retry_count;

    // Calculate activation success rate
    const activationSuccessRate = session.status === 'production_ready' ? 100 : 0;

    // Calculate connector readiness rate
    const connectorReadinessRate = await this.calculateConnectorReadinessRate(tenantId, token);

    // Get bootstrap execution failures
    const bootstrapExecutionFailures = await this.getBootstrapExecutionFailures(tenantId, token);

    return {
      onboardingDuration,
      stageDurations,
      failureCount: failureCount || 0,
      retryCount,
      activationSuccessRate,
      connectorReadinessRate,
      bootstrapExecutionFailures,
    };
  }

  /**
   * Calculate connector readiness rate
   */
  private async calculateConnectorReadinessRate(tenantId: UUID, token: string): Promise<number> {
    const supabase = createClerkSupabaseClient(token);

    const { data: connectors } = await supabase
      .from('connector_credentials')
      .select('health_status')
      .eq('tenant_id', tenantId);

    if (!connectors || connectors.length === 0) {
      return 0;
    }

    const healthyCount = connectors.filter((c) => c.health_status === 'healthy').length;
    return Math.round((healthyCount / connectors.length) * 100);
  }

  /**
   * Get bootstrap execution failures
   */
  private async getBootstrapExecutionFailures(tenantId: UUID, token: string): Promise<number> {
    const supabase = createClerkSupabaseClient(token);

    const { count } = await supabase
      .from('agent_executions')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('success', false);

    return count || 0;
  }

  /**
   * Get onboarding events by traceId
   */
  async getOnboardingEventsByTraceId(traceId: UUID, token: string): Promise<Array<{
    eventType: string;
    eventStage: string;
    success: boolean;
    durationMs: number;
    createdAt: string;
  }>> {
    const supabase = createClerkSupabaseClient(token);

    const { data } = await supabase
      .from('onboarding_events')
      .select('event_type, event_stage, success, duration_ms, created_at')
      .eq('trace_id', traceId)
      .order('created_at', { ascending: true });

    if (!data) {
      return [];
    }

    return data.map((event) => ({
      eventType: event.event_type,
      eventStage: event.event_stage,
      success: event.success,
      durationMs: event.duration_ms || 0,
      createdAt: event.created_at,
    }));
  }

  /**
   * Get onboarding events by executionId
   */
  async getOnboardingEventsByExecutionId(executionId: UUID, token: string): Promise<Array<{
    eventType: string;
    eventStage: string;
    success: boolean;
    durationMs: number;
    createdAt: string;
  }>> {
    const supabase = createClerkSupabaseClient(token);

    const { data } = await supabase
      .from('onboarding_events')
      .select('event_type, event_stage, success, duration_ms, created_at')
      .eq('execution_id', executionId)
      .order('created_at', { ascending: true });

    if (!data) {
      return [];
    }

    return data.map((event) => ({
      eventType: event.event_type,
      eventStage: event.event_stage,
      success: event.success,
      durationMs: event.duration_ms || 0,
      createdAt: event.created_at,
    }));
  }

  /**
   * Get onboarding failures by tenantId
   */
  async getOnboardingFailures(tenantId: UUID, token: string): Promise<Array<{
    failureStage: string;
    failureType: string;
    failureMessage: string;
    retryCount: number;
    resolved: boolean;
    createdAt: string;
  }>> {
    const supabase = createClerkSupabaseClient(token);

    const { data } = await supabase
      .from('onboarding_failures')
      .select('failure_stage, failure_type, failure_message, retry_count, resolved, created_at')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (!data) {
      return [];
    }

    return data.map((failure) => ({
      failureStage: failure.failure_stage,
      failureType: failure.failure_type,
      failureMessage: failure.failure_message,
      retryCount: failure.retry_count,
      resolved: failure.resolved,
      createdAt: failure.created_at,
    }));
  }

  /**
   * Get aggregate onboarding statistics
   */
  async getAggregateStatistics(token: string): Promise<{
    totalOnboardings: number;
    successfulOnboardings: number;
    failedOnboardings: number;
    averageOnboardingDuration: number;
    averageRetryCount: number;
  }> {
    const supabase = createClerkSupabaseClient(token);

    // Get total onboardings
    const { count: totalOnboardings } = await supabase
      .from('onboarding_sessions')
      .select('*', { count: 'exact', head: true });

    // Get successful onboardings
    const { count: successfulOnboardings } = await supabase
      .from('onboarding_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'production_ready');

    // Get failed onboardings
    const { count: failedOnboardings } = await supabase
      .from('onboarding_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'failed');

    // Get average onboarding duration
    const { data: sessions } = await supabase
      .from('onboarding_sessions')
      .select('created_at, completed_at')
      .eq('status', 'production_ready');

    let totalDuration = 0;
    let completedCount = 0;
    if (sessions) {
      for (const session of sessions) {
        if (session.completed_at) {
          totalDuration += new Date(session.completed_at).getTime() - new Date(session.created_at).getTime();
          completedCount++;
        }
      }
    }

    const averageOnboardingDuration = completedCount > 0 ? totalDuration / completedCount : 0;

    // Get average retry count
    const { data: allSessions } = await supabase
      .from('onboarding_sessions')
      .select('retry_count');

    let totalRetries = 0;
    if (allSessions) {
      totalRetries = allSessions.reduce((sum, session) => sum + session.retry_count, 0);
    }

    const averageRetryCount = allSessions && allSessions.length > 0 ? totalRetries / allSessions.length : 0;

    return {
      totalOnboardings: totalOnboardings || 0,
      successfulOnboardings: successfulOnboardings || 0,
      failedOnboardings: failedOnboardings || 0,
      averageOnboardingDuration,
      averageRetryCount,
    };
  }

  /**
   * Log onboarding event
   */
  async logOnboardingEvent(
    sessionId: UUID,
    tenantId: UUID,
    eventType: string,
    eventStage: string,
    success: boolean,
    durationMs: number,
    token: string,
    options: {
      executionId?: UUID;
      traceId?: UUID;
      eventData?: Record<string, unknown>;
      errorMessage?: string;
    } = {}
  ): Promise<void> {
    const supabase = createClerkSupabaseClient(token);

    const { error } = await supabase
      .from('onboarding_events')
      .insert({
        onboarding_session_id: sessionId,
        tenant_id: tenantId,
        execution_id: options.executionId,
        trace_id: options.traceId,
        event_type: eventType,
        event_stage: eventStage,
        event_data: options.eventData || {},
        success,
        error_message: options.errorMessage,
        duration_ms: durationMs,
      });

    if (error) {
      this.logger.error('Failed to log onboarding event', { error, sessionId });
    }
  }
}

/**
 * Singleton instance
 */
export const onboardingObservabilityService = new OnboardingObservabilityService();
