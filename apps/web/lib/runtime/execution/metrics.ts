/**
 * CLAUX Runtime Execution Engine - Metrics
 * 
 * Metrics collection and reporting.
 * No external dependencies - pure metrics logic.
 */

import type { ExecutionId, TaskId } from '../contracts';

/**
 * Metric Type
 */
export enum MetricType {
  COUNTER = 'counter',
  GAUGE = 'gauge',
  HISTOGRAM = 'histogram',
  SUMMARY = 'summary',
}

/**
 * Metric Value
 */
export interface MetricValue {
  readonly type: MetricType;
  readonly value: number;
  readonly timestamp: Date;
  readonly labels: Record<string, string>;
}

/**
 * Execution Metrics
 */
export interface ExecutionMetrics {
  readonly executionId: ExecutionId;
  readonly startTime: Date;
  readonly endTime?: Date;
  readonly duration: number;
  readonly tasksCompleted: number;
  readonly tasksFailed: number;
  readonly tasksCancelled: number;
  readonly tasksRetried: number;
  readonly checkpointsCreated: number;
}

/**
 * Task Metrics
 */
export interface TaskMetrics {
  readonly taskId: TaskId;
  readonly startTime: Date;
  readonly endTime?: Date;
  readonly duration: number;
  readonly status: string;
  readonly retryCount: number;
  readonly resourceUsage: {
    readonly cpu: number;
    readonly memory: number;
    readonly bandwidth: number;
  };
}

/**
 * Metrics Collector
 * 
 * Collects and reports execution metrics.
 */
export class MetricsCollector {
  private executionMetrics: Map<ExecutionId, ExecutionMetrics> = new Map();
  private taskMetrics: Map<TaskId, TaskMetrics> = new Map();
  private customMetrics: Map<string, MetricValue[]> = new Map();

  /**
   * Record execution metrics
   */
  recordExecutionMetrics(metrics: ExecutionMetrics): void {
    this.executionMetrics.set(metrics.executionId, metrics);
  }

  /**
   * Record task metrics
   */
  recordTaskMetrics(metrics: TaskMetrics): void {
    this.taskMetrics.set(metrics.taskId, metrics);
  }

  /**
   * Record custom metric
   */
  recordMetric(name: string, type: MetricType, value: number, labels: Record<string, string> = {}): void {
    const metric: MetricValue = {
      type,
      value,
      timestamp: new Date(),
      labels,
    };

    const metrics = this.customMetrics.get(name) || [];
    metrics.push(metric);
    this.customMetrics.set(name, metrics);
  }

  /**
   * Increment counter metric
   */
  incrementCounter(name: string, labels: Record<string, string> = {}, delta: number = 1): void {
    const metrics = this.customMetrics.get(name) || [];
    const lastValue = metrics.length > 0 ? metrics[metrics.length - 1].value : 0;
    this.recordMetric(name, MetricType.COUNTER, lastValue + delta, labels);
  }

  /**
   * Set gauge metric
   */
  setGauge(name: string, value: number, labels: Record<string, string> = {}): void {
    this.recordMetric(name, MetricType.GAUGE, value, labels);
  }

  /**
   * Record histogram metric
   */
  recordHistogram(name: string, value: number, labels: Record<string, string> = {}): void {
    this.recordMetric(name, MetricType.HISTOGRAM, value, labels);
  }

  /**
   * Get execution metrics
   */
  getExecutionMetrics(executionId: ExecutionId): ExecutionMetrics | undefined {
    return this.executionMetrics.get(executionId);
  }

  /**
   * Get all execution metrics
   */
  getAllExecutionMetrics(): readonly ExecutionMetrics[] {
    return Array.from(this.executionMetrics.values());
  }

  /**
   * Get task metrics
   */
  getTaskMetrics(taskId: TaskId): TaskMetrics | undefined {
    return this.taskMetrics.get(taskId);
  }

  /**
   * Get all task metrics
   */
  getAllTaskMetrics(): readonly TaskMetrics[] {
    return Array.from(this.taskMetrics.values());
  }

  /**
   * Get custom metric
   */
  getMetric(name: string): readonly MetricValue[] {
    return this.customMetrics.get(name) || [];
  }

  /**
   * Get all custom metrics
   */
  getAllMetrics(): Map<string, readonly MetricValue[]> {
    return new Map(this.customMetrics);
  }

  /**
   * Clear all metrics
   */
  clearAll(): void {
    this.executionMetrics.clear();
    this.taskMetrics.clear();
    this.customMetrics.clear();
  }

  /**
   * Clear execution metrics
   */
  clearExecutionMetrics(executionId: ExecutionId): void {
    this.executionMetrics.delete(executionId);
  }

  /**
   * Clear task metrics
   */
  clearTaskMetrics(taskId: TaskId): void {
    this.taskMetrics.delete(taskId);
  }

  /**
   * Clear custom metric
   */
  clearMetric(name: string): void {
    this.customMetrics.delete(name);
  }

  /**
   * Get metrics summary
   */
  getSummary(): {
    totalExecutions: number;
    totalTasks: number;
    totalCustomMetrics: number;
    metricNames: readonly string[];
  } {
    return {
      totalExecutions: this.executionMetrics.size,
      totalTasks: this.taskMetrics.size,
      totalCustomMetrics: this.customMetrics.size,
      metricNames: Array.from(this.customMetrics.keys()),
    };
  }

  /**
   * Export metrics as JSON
   */
  exportAsJSON(): string {
    const data = {
      executions: Array.from(this.executionMetrics.values()),
      tasks: Array.from(this.taskMetrics.values()),
      metrics: Object.fromEntries(this.customMetrics),
    };

    return JSON.stringify(data, null, 2);
  }
}
