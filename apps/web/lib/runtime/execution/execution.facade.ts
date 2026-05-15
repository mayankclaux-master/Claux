/**
 * CLAUX Runtime Execution Engine - Facade
 * 
 * Facade for the execution engine providing a simplified API.
 * No external dependencies - pure facade logic.
 */

import type { ExecutionId } from '../contracts';
import type { DAG } from './types';
import { WorkflowEngine } from './engine';
import { MetricsCollector } from './metrics';
import { Validator } from './validation';

/**
 * Execution Facade Configuration
 */
export interface ExecutionFacadeConfig {
  readonly maxConcurrency: number;
  readonly checkpointIntervalMs: number;
  readonly retryMaxAttempts: number;
  readonly cancellationTimeoutMs: number;
}

/**
 * Execution Facade
 * 
 * Simplified API for workflow execution.
 */
export class ExecutionFacade {
  private workflowEngines: Map<ExecutionId, WorkflowEngine> = new Map();
  private metricsCollector: MetricsCollector;
  private validator: Validator;
  private config: ExecutionFacadeConfig;

  constructor(config?: ExecutionFacadeConfig) {
    this.config = config || {
      maxConcurrency: 10,
      checkpointIntervalMs: 60000,
      retryMaxAttempts: 3,
      cancellationTimeoutMs: 30000,
    };

    this.metricsCollector = new MetricsCollector();
    this.validator = new Validator();
  }

  /**
   * Execute workflow
   */
  async executeWorkflow(executionId: ExecutionId, dag: DAG): Promise<{
    executionId: ExecutionId;
    status: string;
    duration: number;
  }> {
    const workflowEngine = new WorkflowEngine(executionId, dag, this.config);
    this.workflowEngines.set(executionId, workflowEngine);

    const startTime = Date.now();
    const result = await workflowEngine.execute();
    const duration = Date.now() - startTime;

    // Record metrics
    this.metricsCollector.recordExecutionMetrics({
      executionId: result.executionId,
      startTime: new Date(startTime),
      endTime: new Date(),
      duration,
      tasksCompleted: result.tasksCompleted,
      tasksFailed: result.tasksFailed,
      tasksCancelled: result.tasksCancelled,
      tasksRetried: result.retriesAttempted,
      checkpointsCreated: result.checkpointsCreated,
    });

    return {
      executionId: result.executionId,
      status: result.status,
      duration,
    };
  }

  /**
   * Cancel workflow execution
   */
  async cancelWorkflow(executionId: ExecutionId, reason: string): Promise<void> {
    const workflowEngine = this.workflowEngines.get(executionId);
    if (!workflowEngine) {
      throw new Error(`Execution ${executionId} not found`);
    }

    await workflowEngine.cancel(reason);
  }

  /**
   * Pause workflow execution
   */
  pauseWorkflow(executionId: ExecutionId): void {
    const workflowEngine = this.workflowEngines.get(executionId);
    if (!workflowEngine) {
      throw new Error(`Execution ${executionId} not found`);
    }

    workflowEngine.pause();
  }

  /**
   * Resume workflow execution
   */
  resumeWorkflow(executionId: ExecutionId): void {
    const workflowEngine = this.workflowEngines.get(executionId);
    if (!workflowEngine) {
      throw new Error(`Execution ${executionId} not found`);
    }

    workflowEngine.resume();
  }

  /**
   * Get workflow status
   */
  getWorkflowStatus(executionId: ExecutionId): string {
    const workflowEngine = this.workflowEngines.get(executionId);
    if (!workflowEngine) {
      throw new Error(`Execution ${executionId} not found`);
    }

    return workflowEngine.getStatus();
  }

  /**
   * Get workflow progress
   */
  getWorkflowProgress(executionId: ExecutionId): number {
    const workflowEngine = this.workflowEngines.get(executionId);
    if (!workflowEngine) {
      throw new Error(`Execution ${executionId} not found`);
    }

    return workflowEngine.getProgress();
  }

  /**
   * Get workflow statistics
   */
  getWorkflowStatistics(executionId: ExecutionId) {
    const workflowEngine = this.workflowEngines.get(executionId);
    if (!workflowEngine) {
      throw new Error(`Execution ${executionId} not found`);
    }

    return workflowEngine.getStatistics();
  }

  /**
   * Validate DAG
   */
  validateDAG(dag: DAG): {
    isValid: boolean;
    errors: readonly string[];
    warnings: readonly string[];
  } {
    return this.validator.validateDAG(dag);
  }

  /**
   * Get metrics
   */
  getMetrics(): {
    totalExecutions: number;
    totalTasks: number;
    totalCustomMetrics: number;
    metricNames: readonly string[];
  } {
    return this.metricsCollector.getSummary();
  }

  /**
   * Get execution metrics
   */
  getExecutionMetrics(executionId: ExecutionId) {
    return this.metricsCollector.getExecutionMetrics(executionId);
  }

  /**
   * Get all execution metrics
   */
  getAllExecutionMetrics() {
    return this.metricsCollector.getAllExecutionMetrics();
  }

  /**
   * Clear execution
   */
  clearExecution(executionId: ExecutionId): void {
    this.workflowEngines.delete(executionId);
    this.metricsCollector.clearExecutionMetrics(executionId);
  }

  /**
   * Clear all executions
   */
  clearAllExecutions(): void {
    this.workflowEngines.clear();
    this.metricsCollector.clearAll();
  }

  /**
   * Get configuration
   */
  getConfig(): ExecutionFacadeConfig {
    return { ...this.config };
  }

  /**
   * Set configuration
   */
  setConfig(config: Partial<ExecutionFacadeConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get metrics collector
   */
  getMetricsCollector(): MetricsCollector {
    return this.metricsCollector;
  }

  /**
   * Get validator
   */
  getValidator(): Validator {
    return this.validator;
  }
}
