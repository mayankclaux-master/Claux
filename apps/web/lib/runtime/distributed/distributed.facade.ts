/**
 * CLAUX Runtime Distributed Layer - Distributed Facade
 * 
 * Simplified API for distributed runtime operations.
 * No external dependencies - pure facade semantics.
 */

import type { ClusterId, WorkerId, ExecutionId, WorkerMetadata } from './types';
import { DistributedRuntime, type DistributedRuntimeConfig } from './runtime/distributed-runtime';
import { DistributedRuntimeValidator } from './validation';
import { DistributedRuntimeMetricsCollector } from './metrics';

export class DistributedFacade {
  private runtime: DistributedRuntime;
  private validator: DistributedRuntimeValidator;
  private metrics: DistributedRuntimeMetricsCollector;

  constructor(config: DistributedRuntimeConfig) {
    this.runtime = new DistributedRuntime(config);
    this.validator = new DistributedRuntimeValidator();
    this.metrics = new DistributedRuntimeMetricsCollector();
  }

  async start(): Promise<void> {
    await this.runtime.start();
    this.metrics.incrementCounter('runtime.starts');
  }

  async stop(): Promise<void> {
    await this.runtime.stop();
    this.metrics.incrementCounter('runtime.stops');
  }

  async registerWorker(metadata: WorkerMetadata): Promise<void> {
    const validation = this.validator.validateWorkerConfig(metadata.workerId);
    if (!validation.valid) throw new Error(validation.errors.join(', '));
    
    await this.runtime.getWorkerRegistry().registerWorker(metadata);
    this.metrics.incrementCounter('worker.registrations');
  }

  getRuntime(): DistributedRuntime {
    return this.runtime;
  }

  getMetrics(): DistributedRuntimeMetricsCollector {
    return this.metrics;
  }
}
