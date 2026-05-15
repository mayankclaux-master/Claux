/**
 * Runtime Integration Layer
 * 
 * Integrate integration mesh with:
 * - RuntimeService
 * - ExecutionOrchestrator
 * - agent_events
 * - agent_logs
 */

import { RuntimeService } from '@/lib/runtime/services/runtime.service';
import { IntegrationRequest, IntegrationResponse, ExecutionReceipt } from '../contracts';
import { LogLevel } from '@/lib/runtime/types/log.types';

export interface RuntimeIntegrationConfig {
  runtime: RuntimeService;
  emitEvents: boolean;
  emitLogs: boolean;
}

export class RuntimeIntegration {
  private config: RuntimeIntegrationConfig;

  constructor(config: RuntimeIntegrationConfig) {
    this.config = config;
  }

  /**
   * Emit integration dispatch event
   */
  async emitDispatchEvent(request: IntegrationRequest, receipt: ExecutionReceipt): Promise<void> {
    if (!this.config.emitEvents) return;

    await this.config.runtime.event.publishEvent({
      tenant_id: request.tenantId,
      execution_id: request.executionId,
      event_name: 'integration_dispatch',
      event_source: 'integration_mesh',
      payload: {
        provider: request.provider,
        action: request.action,
        correlationId: request.correlationId,
        receipt,
      },
    });
  }

  /**
   * Emit integration completion event
   */
  async emitCompletionEvent(request: IntegrationRequest, response: IntegrationResponse): Promise<void> {
    if (!this.config.emitEvents) return;

    await this.config.runtime.event.publishEvent({
      tenant_id: request.tenantId,
      execution_id: request.executionId,
      event_name: 'integration_completion',
      event_source: 'integration_mesh',
      payload: {
        provider: request.provider,
        action: request.action,
        correlationId: request.correlationId,
        response,
      },
    });
  }

  /**
   * Emit integration failure event
   */
  async emitFailureEvent(request: IntegrationRequest, error: string): Promise<void> {
    if (!this.config.emitEvents) return;

    await this.config.runtime.event.publishEvent({
      tenant_id: request.tenantId,
      execution_id: request.executionId,
      event_name: 'integration_failure',
      event_source: 'integration_mesh',
      payload: {
        provider: request.provider,
        action: request.action,
        correlationId: request.correlationId,
        error,
      },
    });
  }

  /**
   * Log integration dispatch
   */
  async logDispatch(request: IntegrationRequest, receipt: ExecutionReceipt): Promise<void> {
    if (!this.config.emitLogs) return;

    await this.config.runtime.log.writeLog({
      execution_id: request.executionId,
      log_level: LogLevel.INFO,
      message: 'Integration dispatch',
      context: {
        provider: request.provider,
        action: request.action,
        correlationId: request.correlationId,
        receipt,
      },
    });
  }

  /**
   * Log integration completion
   */
  async logCompletion(request: IntegrationRequest, response: IntegrationResponse): Promise<void> {
    if (!this.config.emitLogs) return;

    await this.config.runtime.log.writeLog({
      execution_id: request.executionId,
      log_level: LogLevel.INFO,
      message: 'Integration completion',
      context: {
        provider: request.provider,
        action: request.action,
        correlationId: request.correlationId,
        response,
      },
    });
  }

  /**
   * Log integration failure
   */
  async logFailure(request: IntegrationRequest, error: string): Promise<void> {
    if (!this.config.emitLogs) return;

    await this.config.runtime.log.writeError(
      request.executionId,
      null,
      error,
      {
        provider: request.provider,
        action: request.action,
        correlationId: request.correlationId,
      }
    );
  }
}

/**
 * Create runtime integration instance
 */
export function createRuntimeIntegration(config: RuntimeIntegrationConfig): RuntimeIntegration {
  return new RuntimeIntegration(config);
}
