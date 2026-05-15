/**
 * CLAUX Runtime Execution Engine - Worker Runtime
 * 
 * Manages worker execution context.
 * No external dependencies - pure worker runtime logic.
 */

import type { TaskId, RuntimeEvent } from '../../contracts';
import type { ResourceUsage } from '../types';

/**
 * Worker Runtime Context
 */
export interface WorkerRuntimeContext {
  readonly workerId: string;
  readonly taskId: TaskId;
  readonly startTime: Date;
  endTime?: Date;
  resourceUsage: ResourceUsage;
  metadata: Record<string, unknown>;
}

/**
 * Worker Runtime
 * 
 * Manages the runtime context for worker execution.
 */
export class WorkerRuntime {
  private context: WorkerRuntimeContext;
  private eventHandlers: Map<string, (event: RuntimeEvent) => void> = new Map();

  constructor(workerId: string, taskId: TaskId) {
    this.context = {
      workerId,
      taskId,
      startTime: new Date(),
      resourceUsage: {
        cpu: 0,
        memory: 0,
        bandwidth: 0,
      },
      metadata: {},
    };
  }

  /**
   * Get worker context
   */
  getContext(): WorkerRuntimeContext {
    return this.context;
  }

  /**
   * Get worker ID
   */
  getWorkerId(): string {
    return this.context.workerId;
  }

  /**
   * Get task ID
   */
  getTaskId(): TaskId {
    return this.context.taskId;
  }

  /**
   * Get resource usage
   */
  getResourceUsage(): ResourceUsage {
    return { ...this.context.resourceUsage };
  }

  /**
   * Update resource usage
   */
  updateResourceUsage(usage: Partial<ResourceUsage>): void {
    this.context.resourceUsage = {
      cpu: usage.cpu ?? this.context.resourceUsage.cpu,
      memory: usage.memory ?? this.context.resourceUsage.memory,
      bandwidth: usage.bandwidth ?? this.context.resourceUsage.bandwidth,
    };
  }

  /**
   * Get worker duration
   */
  getDuration(): number {
    const endTime = this.context.endTime || new Date();
    return endTime.getTime() - this.context.startTime.getTime();
  }

  /**
   * Complete worker
   */
  complete(): void {
    this.context.endTime = new Date();
  }

  /**
   * Set metadata
   */
  setMetadata(key: string, value: unknown): void {
    this.context.metadata[key] = value;
  }

  /**
   * Get metadata
   */
  getMetadata(key: string): unknown {
    return this.context.metadata[key];
  }

  /**
   * Get all metadata
   */
  getAllMetadata(): Record<string, unknown> {
    return { ...this.context.metadata };
  }

  /**
   * Register event handler
   */
  on(eventType: string, handler: (event: RuntimeEvent) => void): void {
    this.eventHandlers.set(eventType, handler);
  }

  /**
   * Unregister event handler
   */
  off(eventType: string): void {
    this.eventHandlers.delete(eventType);
  }

  /**
   * Emit event
   */
  emit(event: RuntimeEvent): void {
    const handler = this.eventHandlers.get(event.eventType);
    if (handler) {
      handler(event);
    }
  }

  /**
   * Check if worker is active
   */
  isActive(): boolean {
    return this.context.endTime === undefined;
  }

  /**
   * Get worker summary
   */
  getSummary(): {
    workerId: string;
    taskId: TaskId;
    duration: number;
    isActive: boolean;
    resourceUsage: ResourceUsage;
  } {
    return {
      workerId: this.context.workerId,
      taskId: this.context.taskId,
      duration: this.getDuration(),
      isActive: this.isActive(),
      resourceUsage: this.getResourceUsage(),
    };
  }
}
