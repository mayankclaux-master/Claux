/**
 * Runtime Service
 * 
 * Facade service that composes all runtime services
 * Single entry point for runtime operations with dependency injection
 */

import type { UUID } from '../types';
import { ExecutionService, ExecutionServiceConfig } from './execution.service';
import { TaskService, TaskServiceConfig } from './task.service';
import { EventService, EventServiceConfig } from './event.service';
import { LogService, LogServiceConfig } from './log.service';
import { MetricsService, MetricsServiceConfig } from './metrics.service';
import { ServiceConfig } from './types';

/**
 * Runtime service configuration
 */
export interface RuntimeServiceConfig extends ServiceConfig {
  readonly maxExecutionRetries?: number;
  readonly maxTaskRetries?: number;
}

/**
 * Runtime service
 * Facade that composes all runtime services
 * Provides single entry point for runtime operations
 */
export class RuntimeService {
  public readonly execution: ExecutionService;
  public readonly task: TaskService;
  public readonly event: EventService;
  public readonly log: LogService;
  public readonly metrics: MetricsService;
  private config: RuntimeServiceConfig;

  constructor(config: RuntimeServiceConfig) {
    this.config = config;

    // Initialize all services with shared config
    this.execution = new ExecutionService({
      tenantId: config.tenantId,
      maxRetries: config.maxExecutionRetries || 3,
      logOperations: config.logOperations,
      enableMetrics: config.enableMetrics,
    });

    this.task = new TaskService({
      tenantId: config.tenantId,
      maxRetries: config.maxTaskRetries || 3,
      logOperations: config.logOperations,
      enableMetrics: config.enableMetrics,
    });

    this.event = new EventService({
      tenantId: config.tenantId,
      logOperations: config.logOperations,
      enableMetrics: config.enableMetrics,
    });

    this.log = new LogService({
      tenantId: config.tenantId,
      logOperations: config.logOperations,
      enableMetrics: config.enableMetrics,
    });

    this.metrics = new MetricsService({
      tenantId: config.tenantId,
      logOperations: config.logOperations,
      enableMetrics: config.enableMetrics,
    });
  }

  /**
   * Get tenant ID
   */
  get tenantId(): UUID {
    return this.config.tenantId;
  }

  /**
   * Reset all service pools
   * Useful for testing or connection reset
   */
  async reset(): Promise<void> {
    // If services have reset methods, call them here
    // Currently no reset methods needed
  }

  /**
   * Get service health status
   */
  async healthCheck(): Promise<{
    execution: boolean;
    task: boolean;
    event: boolean;
    log: boolean;
    metrics: boolean;
  }> {
    // Simple health check - all services should be available
    return {
      execution: true,
      task: true,
      event: true,
      log: true,
      metrics: true,
    };
  }
}

/**
 * Create runtime service instance
 * Factory function for easy initialization
 */
export function createRuntimeService(config: RuntimeServiceConfig): RuntimeService {
  return new RuntimeService(config);
}
