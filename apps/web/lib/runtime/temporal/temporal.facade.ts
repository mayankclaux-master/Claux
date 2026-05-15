/**
 * CLAUX Runtime Temporal Layer - Temporal Facade
 * 
 * Simplified API for temporal operations.
 * No external dependencies - pure facade semantics.
 */

import { TemporalRuntime } from './runtime/temporal-runtime';
import { TemporalValidator } from './validation';
import { TemporalMetricsCollector } from './metrics';

/**
 * Temporal Facade
 * 
 * Simplified API for temporal operations.
 */
export class TemporalFacade {
  private runtime: TemporalRuntime;
  private validator: TemporalValidator;
  private metrics: TemporalMetricsCollector;

  constructor() {
    this.runtime = new TemporalRuntime();
    this.validator = new TemporalValidator();
    this.metrics = new TemporalMetricsCollector();
  }

  /**
   * Start temporal runtime
   */
  async start(): Promise<void> {
    await this.runtime.start();
    this.metrics.incrementCounter('runtime.starts');
  }

  /**
   * Stop temporal runtime
   */
  async stop(): Promise<void> {
    await this.runtime.stop();
    this.metrics.incrementCounter('runtime.stops');
  }

  /**
   * Get runtime
   */
  getRuntime(): TemporalRuntime {
    return this.runtime;
  }

  /**
   * Get validator
   */
  getValidator(): TemporalValidator {
    return this.validator;
  }

  /**
   * Get metrics
   */
  getMetrics(): TemporalMetricsCollector {
    return this.metrics;
  }
}
