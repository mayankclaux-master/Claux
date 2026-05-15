/**
 * Recovery Validation
 * 
 * Validate:
 * - provider timeout recovery
 * - callback replay recovery
 * - worker restart recovery
 * - partial publish recovery
 * - retry recovery
 * - execution continuation recovery
 * 
 * MUST remain replay-safe.
 */

import { RuntimeService } from '@/lib/runtime/services/runtime.service';
import { LogLevel } from '@/lib/runtime/types/log.types';

export interface RecoveryValidationResult {
  valid: boolean;
  error?: string;
  recoveryAction?: string;
}

export class RecoveryValidation {
  private runtime: RuntimeService;

  constructor(runtime: RuntimeService) {
    this.runtime = runtime;
  }

  /**
   * Validate provider timeout recovery
   */
  async validateProviderTimeoutRecovery(executionId: string, provider: string): Promise<RecoveryValidationResult> {
    // Check if execution is in recoverable state
    const eventsResult = await this.runtime.event.getExecutionEvents(executionId);

    if (!eventsResult.success) {
      return { valid: false, error: 'Failed to fetch execution events' };
    }

    const events = eventsResult.data;
    const hasTimeoutEvent = events.some((e: any) => e.event_name === 'provider_timeout');

    if (!hasTimeoutEvent) {
      return { valid: false, error: 'No timeout event found' };
    }

    return { valid: true, recoveryAction: 'retry' };
  }

  /**
   * Validate callback replay recovery
   */
  async validateCallbackReplayRecovery(executionId: string, callbackId: string): Promise<RecoveryValidationResult> {
    // Check if callback is replay-safe
    const eventsResult = await this.runtime.event.getExecutionEvents(executionId);

    if (!eventsResult.success) {
      return { valid: false, error: 'Failed to fetch execution events' };
    }

    const events = eventsResult.data;
    const hasCallbackEvent = events.some((e: any) => e.event_name === 'integration_callback');

    if (!hasCallbackEvent) {
      return { valid: false, error: 'No callback event found' };
    }

    return { valid: true, recoveryAction: 'continue' };
  }

  /**
   * Validate worker restart recovery
   */
  async validateWorkerRestartRecovery(executionId: string): Promise<RecoveryValidationResult> {
    // Check if execution can be recovered after worker restart
    const eventsResult = await this.runtime.event.getExecutionEvents(executionId);

    if (!eventsResult.success) {
      return { valid: false, error: 'Failed to fetch execution events' };
    }

    const events = eventsResult.data;
    const lastEvent = events[events.length - 1];

    if (!lastEvent) {
      return { valid: false, error: 'No events found' };
    }

    // Check if last state is recoverable
    const recoverableStates = ['DISPATCHED', 'PROCESSING', 'CALLBACK_RECEIVED'];
    const isRecoverable = recoverableStates.includes(lastEvent.payload?.state as string);

    if (!isRecoverable) {
      return { valid: false, error: 'Execution not in recoverable state' };
    }

    return { valid: true, recoveryAction: 'resume' };
  }

  /**
   * Validate partial publish recovery
   */
  async validatePartialPublishRecovery(executionId: string, platform: string): Promise<RecoveryValidationResult> {
    // Check if partial publish can be recovered
    const eventsResult = await this.runtime.event.getExecutionEvents(executionId);

    if (!eventsResult.success) {
      return { valid: false, error: 'Failed to fetch execution events' };
    }

    const events = eventsResult.data;
    const hasPartialPublishEvent = events.some((e: any) => e.event_name === 'partial_publish_failure');

    if (!hasPartialPublishEvent) {
      return { valid: false, error: 'No partial publish failure event found' };
    }

    return { valid: true, recoveryAction: 'retry_partial' };
  }

  /**
   * Validate retry recovery
   */
  async validateRetryRecovery(executionId: string, retryCount: number, maxRetries: number): Promise<RecoveryValidationResult> {
    // Check if retry is within limits
    if (retryCount >= maxRetries) {
      return { valid: false, error: 'Max retries exceeded' };
    }

    return { valid: true, recoveryAction: 'retry' };
  }

  /**
   * Validate execution continuation recovery
   */
  async validateExecutionContinuationRecovery(executionId: string): Promise<RecoveryValidationResult> {
    // Check if execution continuation is safe
    const eventsResult = await this.runtime.event.getExecutionEvents(executionId);

    if (!eventsResult.success) {
      return { valid: false, error: 'Failed to fetch execution events' };
    }

    const events = eventsResult.data;
    const hasContinuationEvent = events.some((e: any) => e.event_name === 'execution_continuation');

    if (!hasContinuationEvent) {
      return { valid: false, error: 'No continuation event found' };
    }

    return { valid: true, recoveryAction: 'continue' };
  }

  /**
   * Execute recovery action
   */
  async executeRecovery(executionId: string, recoveryAction: string, tenantId: string): Promise<void> {
    await this.runtime.event.publishEvent({
      tenant_id: tenantId,
      execution_id: executionId,
      event_name: 'recovery_executed',
      event_source: 'recovery_validation',
      payload: {
        recoveryAction,
        timestamp: new Date().toISOString(),
      },
    });

    await this.runtime.log.writeLog({
      execution_id: executionId,
      log_level: LogLevel.INFO,
      message: `Recovery executed: ${recoveryAction}`,
      context: {
        recoveryAction,
      },
    });
  }
}

export function createRecoveryValidation(runtime: RuntimeService): RecoveryValidation {
  return new RecoveryValidation(runtime);
}
