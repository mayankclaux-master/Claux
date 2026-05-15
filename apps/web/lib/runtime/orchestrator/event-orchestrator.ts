/**
 * Event Orchestrator
 * 
 * Standardized event publishing with correlation chain management
 * Timeline reconstruction and distributed tracing support
 */

import type { UUID, ISODateTime } from '../types';
import { RuntimeService } from '../services';
import { RuntimeEvents } from '../constants/events';
import {
  OrchestratorConfig,
  OrchestratorContext,
  OrchestratorResult,
  createOrchestratorError,
  toOrchestratorResult,
} from './types';

/**
 * Event orchestrator
 * Standardized event publishing with correlation management
 */
export class EventOrchestrator {
  private runtime: RuntimeService;
  private config: OrchestratorConfig;

  constructor(runtime: RuntimeService, config: OrchestratorConfig) {
    this.runtime = runtime;
    this.config = config;
  }

  private createContext(operation: string): OrchestratorContext {
    return {
      tenantId: this.config.tenantId,
      orchestrator: 'event-orchestrator',
      operation,
      timestamp: new Date().toISOString() as ISODateTime,
    };
  }

  private logOperation(context: OrchestratorContext, data: Record<string, unknown>): void {
    if (this.config.enableAutoLogging) {
      // Log operation would be handled by runtime service
      console.log(`[${context.orchestrator}] ${context.operation}`, data);
    }
  }

  private generateCorrelationId(): string {
    return `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Publish execution started event
   */
  async publishExecutionStarted(
    executionId: UUID,
    correlationId?: string
  ): Promise<OrchestratorResult<void>> {
    const context = this.createContext('publishExecutionStarted');

    if (this.config.enableAutoLogging) {
      this.logOperation(context, { executionId });
    }

    const result = await this.runtime.event.publishEvent({
      tenant_id: this.config.tenantId,
      execution_id: executionId,
      event_name: RuntimeEvents.EXECUTION_STARTED,
      event_source: 'orchestrator',
      event_version: '1.0',
      payload: {},
      correlation_id: correlationId || this.generateCorrelationId(),
    });

    const orchestratorResult = toOrchestratorResult(result, context) as OrchestratorResult<void>;
    return orchestratorResult;
  }

  /**
   * Publish execution completed event
   */
  async publishExecutionCompleted(
    executionId: UUID,
    correlationId?: string,
    payload?: Record<string, unknown>
  ): Promise<OrchestratorResult<void>> {
    const context = this.createContext('publishExecutionCompleted');

    if (this.config.enableAutoLogging) {
      this.logOperation(context, { executionId });
    }

    const result = await this.runtime.event.publishEvent({
      tenant_id: this.config.tenantId,
      execution_id: executionId,
      event_name: RuntimeEvents.EXECUTION_COMPLETED,
      event_source: 'orchestrator',
      event_version: '1.0',
      payload: payload || {},
      correlation_id: correlationId || this.generateCorrelationId(),
    });

    const orchestratorResult = toOrchestratorResult(result, context) as OrchestratorResult<void>;
    return orchestratorResult;
  }

  /**
   * Publish execution failed event
   */
  async publishExecutionFailed(
    executionId: UUID,
    errorMessage: string,
    correlationId?: string
  ): Promise<OrchestratorResult<void>> {
    const context = this.createContext('publishExecutionFailed');

    if (this.config.enableAutoLogging) {
      this.logOperation(context, { executionId, errorMessage });
    }

    const result = await this.runtime.event.publishEvent({
      tenant_id: this.config.tenantId,
      execution_id: executionId,
      event_name: RuntimeEvents.EXECUTION_FAILED,
      event_source: 'event-orchestrator',
      event_version: '1.0',
      payload: { originalEvent: errorMessage },
      correlation_id: correlationId || this.generateCorrelationId(),
    });

    const orchestratorResult = toOrchestratorResult(result, context) as OrchestratorResult<void>;
    return orchestratorResult;
  }

  /**
   * Publish task started event
   */
  async publishTaskStarted(
    executionId: UUID,
    taskId: UUID,
    correlationId?: string
  ): Promise<OrchestratorResult<void>> {
    const context = this.createContext('publishTaskStarted');

    if (this.config.enableAutoLogging) {
      this.logOperation(context, { executionId, taskId });
    }

    const result = await this.runtime.event.publishEvent({
      tenant_id: this.config.tenantId,
      execution_id: executionId,
      event_name: RuntimeEvents.TASK_STARTED,
      event_source: 'orchestrator',
      event_version: '1.0',
      payload: {},
      correlation_id: correlationId || this.generateCorrelationId(),
    });

    const orchestratorResult = toOrchestratorResult(result, context) as OrchestratorResult<void>;
    return orchestratorResult;
  }

  /**
   * Publish task completed event
   */
  async publishTaskCompleted(
    executionId: UUID,
    taskId: UUID,
    correlationId?: string,
    payload?: Record<string, unknown>
  ): Promise<OrchestratorResult<void>> {
    const context = this.createContext('publishTaskCompleted');

    if (this.config.enableAutoLogging) {
      this.logOperation(context, { executionId, taskId });
    }

    const result = await this.runtime.event.publishEvent({
      tenant_id: this.config.tenantId,
      execution_id: executionId,
      event_name: RuntimeEvents.TASK_COMPLETED,
      event_source: 'event-orchestrator',
      event_version: '1.0',
      payload: { originalEvent: payload },
      correlation_id: correlationId || this.generateCorrelationId(),
    });

    const orchestratorResult = toOrchestratorResult(result, context) as OrchestratorResult<void>;
    return orchestratorResult;
  }

  /**
   * Publish task failed event
   */
  async publishTaskFailed(
    executionId: UUID,
    taskId: UUID,
    errorMessage: string,
    correlationId?: string
  ): Promise<OrchestratorResult<void>> {
    const context = this.createContext('publishTaskFailed');

    if (this.config.enableAutoLogging) {
      this.logOperation(context, { executionId, taskId, errorMessage });
    }

    const result = await this.runtime.event.publishEvent({
      tenant_id: this.config.tenantId,
      execution_id: executionId,
      event_name: RuntimeEvents.TASK_FAILED,
      event_source: 'orchestrator',
      event_version: '1.0',
      payload: { errorMessage },
      correlation_id: correlationId || this.generateCorrelationId(),
    });

    const orchestratorResult = toOrchestratorResult(result, context) as OrchestratorResult<void>;
    return orchestratorResult;
  }

  /**
   * Publish system event
   */
  async publishSystemEvent(
    executionId: UUID,
    eventName: string,
    payload: Record<string, unknown>,
    correlationId?: string
  ): Promise<OrchestratorResult<void>> {
    const context = this.createContext('publishSystemEvent');

    if (this.config.enableAutoLogging) {
      this.logOperation(context, { executionId, eventName });
    }

    const result = await this.runtime.event.publishEvent({
      tenant_id: this.config.tenantId,
      execution_id: executionId,
      event_name: `system.${eventName}`,
      event_source: 'orchestrator',
      event_version: '1.0',
      payload: payload,
      correlation_id: correlationId || this.generateCorrelationId(),
    });

    const orchestratorResult = toOrchestratorResult(result, context) as OrchestratorResult<void>;
    return orchestratorResult;
  }

  /**
   * Publish recovery event
   */
  async publishRecoveryEvent(
    executionId: UUID,
    strategy: string,
    correlationId?: string,
    payload?: Record<string, unknown>
  ): Promise<OrchestratorResult<void>> {
    const context = this.createContext('publishRecoveryEvent');

    if (this.config.enableAutoLogging) {
      this.logOperation(context, { executionId, strategy });
    }

    const result = await this.runtime.event.publishEvent({
      tenant_id: this.config.tenantId,
      execution_id: executionId,
      event_name: RuntimeEvents.RECOVERY_STARTED,
      event_source: 'orchestrator',
      event_version: '1.0',
      payload: { strategy, ...payload },
      correlation_id: correlationId || this.generateCorrelationId(),
    });

    const orchestratorResult = toOrchestratorResult(result, context) as OrchestratorResult<void>;
    return orchestratorResult;
  }

  /**
   * Stream execution timeline
   */
  async streamExecutionTimeline(
    executionId: UUID
  ): Promise<OrchestratorResult<readonly {
    readonly timestamp: ISODateTime;
    readonly eventName: string;
    readonly payload: Record<string, unknown>;
  }[]>> {
    const context = this.createContext('streamExecutionTimeline');

    const result = await this.runtime.event.streamExecutionEvents(executionId);

    if (!result.success) {
      return toOrchestratorResult(result, context);
    }

    const timeline = result.data.map((event: any) => ({
      timestamp: event.created_at,
      eventName: event.event_name,
      payload: event.event_payload as Record<string, unknown>,
    }));

    return {
      success: true,
      data: timeline,
      context,
    };
  }

}
