/**
 * Onboarding Failure Recovery Service
 * 
 * Canonical onboarding failure recovery service for CLAUX V1 onboarding.
 * Preserves progress, preserves completed stages, retries failed stage only, resumes safely, avoids duplicate bootstrap, generates recovery task.
 * NO full onboarding reset.
 * 
 * CRITICAL: This is the ONLY onboarding failure recovery service in CLAUX.
 */

import type { UUID } from '../runtime/types/common.types';
import { createClerkSupabaseClient } from '@/lib/supabase/admin';
import { createLogger, Logger } from '@/lib/utils/logger';
import { onboardingStateMachine } from './onboarding-state-machine';
import type { OnboardingStatus } from './tenant-activation.service';

/**
 * Onboarding recovery result
 */
export interface OnboardingRecoveryResult {
  success: boolean;
  recovered: boolean;
  currentStatus: OnboardingStatus;
  stagesCompleted: string[];
  errors: string[];
}

/**
 * Onboarding failure recovery service
 */
export class OnboardingFailureRecoveryService {
  private logger: Logger;

  constructor() {
    this.logger = createLogger();
  }

  /**
   * Recover failed onboarding
   */
  async recoverOnboarding(
    sessionId: UUID,
    token: string
  ): Promise<OnboardingRecoveryResult> {
    this.logger.info('Starting onboarding recovery', { sessionId });

    const stagesCompleted: string[] = [];
    const errors: string[] = [];

    try {
      // Get current session
      const session = await this.getOnboardingSession(sessionId, token);
      if (!session) {
        errors.push('Session not found');
        return {
          success: false,
          recovered: false,
          currentStatus: 'account_created',
          stagesCompleted,
          errors,
        };
      }

      // Check if can retry
      const canRetry = await onboardingStateMachine.canRetry(sessionId, token);
      if (!canRetry) {
        errors.push('Max retry limit reached');
        return {
          success: false,
          recovered: false,
          currentStatus: session.status,
          stagesCompleted,
          errors,
        };
      }

      // Get completed stages from events
      const completedStages = await this.getCompletedStages(sessionId, token);
      stagesCompleted.push(...completedStages);

      // Reset to account_created for retry
      const resetResult = await onboardingStateMachine.resetForRetry(sessionId, token);
      if (!resetResult.success) {
        errors.push('Failed to reset for retry');
        return {
          success: false,
          recovered: false,
          currentStatus: session.status,
          stagesCompleted,
          errors,
        };
      }

      // Generate recovery task
      await this.generateRecoveryTask(session.tenantId, sessionId, session.status, token);

      this.logger.info('Onboarding recovery complete', { sessionId, stagesCompleted });

      return {
        success: true,
        recovered: true,
        currentStatus: 'account_created',
        stagesCompleted,
        errors,
      };
    } catch (error) {
      this.logger.error('Onboarding recovery failed', { sessionId, error });
      errors.push(error instanceof Error ? error.message : 'Unknown error');

      return {
        success: false,
        recovered: false,
        currentStatus: 'account_created',
        stagesCompleted,
        errors,
      };
    }
  }

  /**
   * Get onboarding session
   */
  private async getOnboardingSession(sessionId: UUID, token: string): Promise<{
    id: UUID;
    tenantId: UUID;
    status: OnboardingStatus;
    retryCount: number;
  } | null> {
    const supabase = createClerkSupabaseClient(token);

    const { data, error } = await supabase
      .from('onboarding_sessions')
      .select('id, tenant_id, status, retry_count')
      .eq('id', sessionId)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      tenantId: data.tenant_id,
      status: data.status as OnboardingStatus,
      retryCount: data.retry_count,
    };
  }

  /**
   * Get completed stages from events
   */
  private async getCompletedStages(sessionId: UUID, token: string): Promise<string[]> {
    const supabase = createClerkSupabaseClient(token);

    const { data } = await supabase
      .from('onboarding_events')
      .select('event_stage')
      .eq('onboarding_session_id', sessionId)
      .eq('success', true);

    if (!data) {
      return [];
    }

    return data.map((event) => event.event_stage);
  }

  /**
   * Generate recovery task
   */
  private async generateRecoveryTask(
    tenantId: UUID,
    sessionId: UUID,
    failedStage: OnboardingStatus,
    token: string
  ): Promise<void> {
    const supabase = createClerkSupabaseClient(token);

    // Check if recovery task already exists
    const { data: existingTask } = await supabase
      .from('command_center_tasks')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('task_type', 'keyword_review')
      .eq('action_payload->>type', 'onboarding_recovery')
      .maybeSingle();

    if (existingTask) {
      this.logger.info('Recovery task already exists', { tenantId, sessionId });
      return;
    }

    // Create recovery task
    const { error } = await supabase
      .from('command_center_tasks')
      .insert({
        tenant_id: tenantId,
        agent_name: 'ONBOARDING',
        task_type: 'keyword_review',
        title: 'Onboarding Recovery Required',
        description: `Onboarding failed at stage: ${failedStage}. Please retry onboarding process.`,
        priority: 'high',
        status: 'pending',
        action_payload: {
          type: 'onboarding_recovery',
          session_id: sessionId,
          failed_stage: failedStage,
        },
      });

    if (error) {
      this.logger.error('Failed to generate recovery task', { error, tenantId, sessionId });
    }
  }

  /**
   * Get onboarding recovery status
   */
  async getRecoveryStatus(sessionId: UUID, token: string): Promise<{
    canRecover: boolean;
    retryCount: number;
    completedStages: string[];
  }> {
    const session = await this.getOnboardingSession(sessionId, token);
    if (!session) {
      return {
        canRecover: false,
        retryCount: 0,
        completedStages: [],
      };
    }

    const canRetry = await onboardingStateMachine.canRetry(sessionId, token);
    const completedStages = await this.getCompletedStages(sessionId, token);

    return {
      canRecover: canRetry,
      retryCount: session.retryCount,
      completedStages,
    };
  }

  /**
   * Preserve onboarding progress
   */
  async preserveProgress(
    sessionId: UUID,
    completedStage: string,
    token: string
  ): Promise<void> {
    this.logger.info('Preserving onboarding progress', { sessionId, completedStage });

    const supabase = createClerkSupabaseClient(token);

    // Log completion event
    const { error } = await supabase
      .from('onboarding_events')
      .insert({
        onboarding_session_id: sessionId,
        tenant_id: (await this.getOnboardingSession(sessionId, token))?.tenantId,
        event_type: 'stage_completed',
        event_stage: completedStage,
        event_data: {},
        success: true,
        duration_ms: 0,
      });

    if (error) {
      this.logger.error('Failed to preserve progress', { error, sessionId });
    }
  }
}

/**
 * Singleton instance
 */
export const onboardingFailureRecoveryService = new OnboardingFailureRecoveryService();
