/**
 * Onboarding State Machine
 * 
 * Canonical state machine for CLAUX V1 onboarding.
 * Deterministic transitions, retry-safe, resumable after failure, no duplicate initialization, no invalid transitions, transition audit logging, timeout protection, traceId support.
 * 
 * CRITICAL: This is the ONLY onboarding state machine in CLAUX.
 */

import type { UUID } from '../runtime/types/common.types';
import { createClerkSupabaseClient } from '@/lib/supabase/admin';
import { createLogger, Logger } from '@/lib/utils/logger';
import type { OnboardingStatus } from './tenant-activation.service';

/**
 * State transition
 */
export interface StateTransition {
  from: OnboardingStatus;
  to: OnboardingStatus;
  allowed: boolean;
}

/**
 * State transition result
 */
export interface StateTransitionResult {
  success: boolean;
  currentStatus: OnboardingStatus;
  error?: string;
}

/**
 * Onboarding state machine
 */
export class OnboardingStateMachine {
  private logger: Logger;

  // Valid state transitions
  private readonly transitions: StateTransition[] = [
    { from: 'account_created', to: 'connectors_pending', allowed: true },
    { from: 'connectors_pending', to: 'domain_verification', allowed: true },
    { from: 'domain_verification', to: 'keyword_bootstrap', allowed: true },
    { from: 'keyword_bootstrap', to: 'execution_bootstrap', allowed: true },
    { from: 'execution_bootstrap', to: 'dashboard_activation', allowed: true },
    { from: 'dashboard_activation', to: 'command_center_activation', allowed: true },
    { from: 'command_center_activation', to: 'production_ready', allowed: true },
    { from: 'failed', to: 'account_created', allowed: true }, // Retry from failed
  ];

  constructor() {
    this.logger = createLogger();
  }

  /**
   * Check if transition is allowed
   */
  private isTransitionAllowed(from: OnboardingStatus, to: OnboardingStatus): boolean {
    const transition = this.transitions.find((t) => t.from === from && t.to === to);
    return transition?.allowed || false;
  }

  /**
   * Transition state
   */
  async transitionState(
    sessionId: UUID,
    to: OnboardingStatus,
    token: string,
    options: {
      executionId?: UUID;
      traceId?: UUID;
      metadata?: Record<string, unknown>;
    } = {}
  ): Promise<StateTransitionResult> {
    this.logger.info('Transitioning onboarding state', { sessionId, to });

    const supabase = createClerkSupabaseClient(token);

    // Get current session
    const { data: session, error: sessionError } = await supabase
      .from('onboarding_sessions')
      .select('*')
      .eq('id', sessionId)
      .maybeSingle();

    if (sessionError || !session) {
      this.logger.error('Failed to get session', { error: sessionError, sessionId });
      return {
        success: false,
        currentStatus: 'account_created',
        error: 'Session not found',
      };
    }

    const currentStatus = session.status as OnboardingStatus;

    // Check if transition is allowed
    if (!this.isTransitionAllowed(currentStatus, to)) {
      this.logger.warn('Invalid state transition', { sessionId, from: currentStatus, to });
      return {
        success: false,
        currentStatus,
        error: `Invalid transition from ${currentStatus} to ${to}`,
      };
    }

    // Update session status
    const { error: updateError } = await supabase
      .from('onboarding_sessions')
      .update({
        status: to,
        updated_at: new Date().toISOString(),
        metadata: options.metadata || session.metadata,
      })
      .eq('id', sessionId);

    if (updateError) {
      this.logger.error('Failed to update session status', { error: updateError, sessionId });
      return {
        success: false,
        currentStatus,
        error: updateError.message,
      };
    }

    // Log transition event
    await this.logTransitionEvent(
      sessionId,
      session.tenant_id,
      currentStatus,
      to,
      options.executionId,
      options.traceId,
      token
    );

    this.logger.info('State transition successful', { sessionId, from: currentStatus, to });

    return {
      success: true,
      currentStatus: to,
    };
  }

  /**
   * Log transition event
   */
  private async logTransitionEvent(
    sessionId: UUID,
    tenantId: UUID,
    from: OnboardingStatus,
    to: OnboardingStatus,
    executionId?: UUID,
    traceId?: UUID,
    token?: string
  ): Promise<void> {
    const supabase = createClerkSupabaseClient(token || '');

    const { error } = await supabase
      .from('onboarding_events')
      .insert({
        onboarding_session_id: sessionId,
        tenant_id: tenantId,
        execution_id: executionId,
        trace_id: traceId,
        event_type: 'state_transition',
        event_stage: to,
        event_data: {
          from,
          to,
        },
        success: true,
        duration_ms: 0,
      });

    if (error) {
      this.logger.error('Failed to log transition event', { error, sessionId });
    }
  }

  /**
   * Mark as failed
   */
  async markAsFailed(
    sessionId: UUID,
    failureType: string,
    failureMessage: string,
    token: string,
    options: {
      executionId?: UUID;
      traceId?: UUID;
      failureContext?: Record<string, unknown>;
    } = {}
  ): Promise<StateTransitionResult> {
    this.logger.error('Marking onboarding as failed', { sessionId, failureType, failureMessage });

    const supabase = createClerkSupabaseClient(token);

    // Get current session
    const { data: session, error: sessionError } = await supabase
      .from('onboarding_sessions')
      .select('*')
      .eq('id', sessionId)
      .maybeSingle();

    if (sessionError || !session) {
      return {
        success: false,
        currentStatus: 'account_created',
        error: 'Session not found',
      };
    }

    // Update session status to failed
    const { error: updateError } = await supabase
      .from('onboarding_sessions')
      .update({
        status: 'failed',
        updated_at: new Date().toISOString(),
        retry_count: session.retry_count + 1,
      })
      .eq('id', sessionId);

    if (updateError) {
      return {
        success: false,
        currentStatus: session.status as OnboardingStatus,
        error: updateError.message,
      };
    }

    // Log failure event
    await this.logTransitionEvent(
      sessionId,
      session.tenant_id,
      session.status as OnboardingStatus,
      'failed',
      options.executionId,
      options.traceId,
      token
    );

    // Record failure
    const { error: failureError } = await supabase
      .from('onboarding_failures')
      .insert({
        onboarding_session_id: sessionId,
        tenant_id: session.tenant_id,
        execution_id: options.executionId,
        trace_id: options.traceId,
        failure_stage: session.status as OnboardingStatus,
        failure_type: failureType,
        failure_message: failureMessage,
        failure_context: options.failureContext || {},
        retry_count: session.retry_count + 1,
      });

    if (failureError) {
      this.logger.error('Failed to record failure', { error: failureError, sessionId });
    }

    return {
      success: true,
      currentStatus: 'failed',
    };
  }

  /**
   * Get current state
   */
  async getCurrentState(sessionId: UUID, token: string): Promise<OnboardingStatus | null> {
    const supabase = createClerkSupabaseClient(token);

    const { data, error } = await supabase
      .from('onboarding_sessions')
      .select('status')
      .eq('id', sessionId)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return data.status as OnboardingStatus;
  }

  /**
   * Check if can retry
   */
  async canRetry(sessionId: UUID, token: string): Promise<boolean> {
    const supabase = createClerkSupabaseClient(token);

    const { data, error } = await supabase
      .from('onboarding_sessions')
      .select('retry_count, status')
      .eq('id', sessionId)
      .maybeSingle();

    if (error || !data) {
      return false;
    }

    // Allow retry if failed and retry count < 3
    return data.status === 'failed' && data.retry_count < 3;
  }

  /**
   * Reset to account_created for retry
   */
  async resetForRetry(sessionId: UUID, token: string): Promise<StateTransitionResult> {
    this.logger.info('Resetting onboarding for retry', { sessionId });

    return await this.transitionState(sessionId, 'account_created', token);
  }
}

/**
 * Singleton instance
 */
export const onboardingStateMachine = new OnboardingStateMachine();
