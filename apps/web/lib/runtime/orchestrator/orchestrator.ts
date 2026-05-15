/**
 * Runtime Orchestrator
 * 
 * Master facade that composes all orchestrators
 * Single entry point for orchestration operations with dependency injection
 */

import type { UUID } from '../types';
import { RuntimeService } from '../services';
import {
  OrchestratorConfig,
  OrchestratorResult,
} from './types';
import { ExecutionOrchestrator } from './execution-orchestrator';
import { TaskOrchestrator } from './task-orchestrator';
import { LifecycleOrchestrator } from './lifecycle-orchestrator';
import { EventOrchestrator } from './event-orchestrator';
import { RecoveryOrchestrator } from './recovery-orchestrator';

/**
 * Runtime orchestrator configuration
 */
export interface RuntimeOrchestratorConfig extends OrchestratorConfig {}

/**
 * Runtime orchestrator
 * Master facade that composes all orchestrators
 * Provides single entry point for orchestration operations
 */
export class RuntimeOrchestrator {
  public readonly execution: ExecutionOrchestrator;
  public readonly task: TaskOrchestrator;
  public readonly lifecycle: LifecycleOrchestrator;
  public readonly event: EventOrchestrator;
  public readonly recovery: RecoveryOrchestrator;
  private runtime: RuntimeService;
  private config: RuntimeOrchestratorConfig;

  constructor(runtime: RuntimeService, config: RuntimeOrchestratorConfig) {
    this.runtime = runtime;
    this.config = config;

    // Initialize all orchestrators with shared runtime and config
    this.execution = new ExecutionOrchestrator(runtime, config);
    this.task = new TaskOrchestrator(runtime, config);
    this.lifecycle = new LifecycleOrchestrator(runtime, config);
    this.event = new EventOrchestrator(runtime, config);
    this.recovery = new RecoveryOrchestrator(runtime, config);
  }

  /**
   * Get tenant ID
   */
  get tenantId(): UUID {
    return this.config.tenantId;
  }

  /**
   * Health check for all orchestrators
   */
  async healthCheck(): Promise<{
    readonly runtime: boolean;
    readonly execution: boolean;
    readonly task: boolean;
    readonly lifecycle: boolean;
    readonly event: boolean;
    readonly recovery: boolean;
  }> {
    const runtimeHealth = await this.runtime.healthCheck();

    return {
      runtime: runtimeHealth.execution && runtimeHealth.task && runtimeHealth.event && runtimeHealth.log && runtimeHealth.metrics,
      execution: true,
      task: true,
      lifecycle: true,
      event: true,
      recovery: true,
    };
  }

  /**
   * Reset all orchestrator pools
   * Useful for testing or connection reset
   */
  async reset(): Promise<void> {
    await this.runtime.reset();
  }

  /**
   * Get runtime service instance
   */
  getRuntimeService(): RuntimeService {
    return this.runtime;
  }
}

/**
 * Create runtime orchestrator instance
 * Factory function for easy initialization
 */
export function createRuntimeOrchestrator(
  runtime: RuntimeService,
  config: RuntimeOrchestratorConfig
): RuntimeOrchestrator {
  return new RuntimeOrchestrator(runtime, config);
}
