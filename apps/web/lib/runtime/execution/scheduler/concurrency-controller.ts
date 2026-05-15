/**
 * CLAUX Runtime Execution Engine - Concurrency Controller
 * 
 * Controls concurrency for task execution.
 * No external dependencies - pure concurrency control logic.
 */

import type { ConcurrencyControlState, ResourceUsage, ResourceLimits } from '../types';
import { ConcurrencyLimitExceededError, ResourceLimitExceededError } from '../errors';

/**
 * Concurrency Controller
 * 
 * Manages concurrency limits and resource usage during execution.
 */
export class ConcurrencyController {
  private maxConcurrency: number;
  private currentConcurrency: number;
  private queuedExecutions: number;
  private resourceLimits: ResourceLimits;
  private resourceUsage: ResourceUsage;

  constructor(maxConcurrency: number, resourceLimits?: ResourceLimits) {
    this.maxConcurrency = maxConcurrency;
    this.currentConcurrency = 0;
    this.queuedExecutions = 0;
    this.resourceLimits = resourceLimits || {
      maxCpu: 100,
      maxMemory: 1073741824, // 1 GB
      maxBandwidth: 104857600, // 100 MB/s
    };
    this.resourceUsage = {
      cpu: 0,
      memory: 0,
      bandwidth: 0,
    } as ResourceUsage;
  }

  /**
   * Request to start an execution
   */
  requestExecution(requiredResources?: Partial<ResourceUsage>): boolean {
    // Check concurrency limit
    if (this.currentConcurrency >= this.maxConcurrency) {
      return false;
    }

    // Check resource limits if resources specified
    if (requiredResources) {
      if (!this.checkResourceAvailability(requiredResources)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Start an execution
   */
  startExecution(requiredResources?: Partial<ResourceUsage>): void {
    if (!this.requestExecution(requiredResources)) {
      if (this.currentConcurrency >= this.maxConcurrency) {
        throw new ConcurrencyLimitExceededError(
          this.currentConcurrency,
          this.maxConcurrency
        );
      } else {
        throw new ResourceLimitExceededError(
          'unknown',
          0,
          0
        );
      }
    }

    this.currentConcurrency++;

    if (requiredResources) {
      this.resourceUsage = {
        cpu: this.resourceUsage.cpu + (requiredResources.cpu ?? 0),
        memory: this.resourceUsage.memory + (requiredResources.memory ?? 0),
        bandwidth: this.resourceUsage.bandwidth + (requiredResources.bandwidth ?? 0),
      };
    }
  }

  /**
   * Complete an execution
   */
  completeExecution(releasedResources?: Partial<ResourceUsage>): void {
    if (this.currentConcurrency <= 0) {
      throw new Error('No active executions to complete');
    }

    this.currentConcurrency--;

    if (releasedResources) {
      this.resourceUsage = {
        cpu: Math.max(0, this.resourceUsage.cpu - (releasedResources.cpu ?? 0)),
        memory: Math.max(0, this.resourceUsage.memory - (releasedResources.memory ?? 0)),
        bandwidth: Math.max(0, this.resourceUsage.bandwidth - (releasedResources.bandwidth ?? 0)),
      };
    }
  }

  /**
   * Queue an execution
   */
  queueExecution(): void {
    this.queuedExecutions++;
  }

  /**
   * Dequeue an execution
   */
  dequeueExecution(): void {
    if (this.queuedExecutions <= 0) {
      throw new Error('No queued executions to dequeue');
    }

    this.queuedExecutions--;
  }

  /**
   * Get current concurrency state
   */
  getState(): ConcurrencyControlState {
    return {
      activeExecutions: this.currentConcurrency,
      queuedExecutions: this.queuedExecutions,
      resourceUsage: { ...this.resourceUsage },
    };
  }

  /**
   * Get available concurrency slots
   */
  getAvailableSlots(): number {
    return this.maxConcurrency - this.currentConcurrency;
  }

  /**
   * Check if can start more executions
   */
  canStartMore(): boolean {
    return this.currentConcurrency < this.maxConcurrency;
  }

  /**
   * Get concurrency utilization percentage
   */
  getUtilization(): number {
    return (this.currentConcurrency / this.maxConcurrency) * 100;
  }

  /**
   * Set max concurrency
   */
  setMaxConcurrency(maxConcurrency: number): void {
    if (maxConcurrency < 1) {
      throw new Error('Max concurrency must be at least 1');
    }

    if (maxConcurrency < this.currentConcurrency) {
      throw new Error('Cannot set max concurrency below current concurrency');
    }

    this.maxConcurrency = maxConcurrency;
  }

  /**
   * Set resource limits
   */
  setResourceLimits(limits: ResourceLimits): void {
    this.resourceLimits = { ...this.resourceLimits, ...limits };
  }

  /**
   * Get resource limits
   */
  getResourceLimits(): ResourceLimits {
    return { ...this.resourceLimits };
  }

  /**
   * Get resource usage
   */
  getResourceUsage(): ResourceUsage {
    return { ...this.resourceUsage };
  }

  /**
   * Get resource utilization percentage
   */
  getResourceUtilization(): {
    cpu: number;
    memory: number;
    bandwidth: number;
  } {
    return {
      cpu: this.resourceLimits.maxCpu
        ? (this.resourceUsage.cpu / this.resourceLimits.maxCpu) * 100
        : 0,
      memory: this.resourceLimits.maxMemory
        ? (this.resourceUsage.memory / this.resourceLimits.maxMemory) * 100
        : 0,
      bandwidth: this.resourceLimits.maxBandwidth
        ? (this.resourceUsage.bandwidth / this.resourceLimits.maxBandwidth) * 100
        : 0,
    };
  }

  /**
   * Check resource availability
   */
  private checkResourceAvailability(required: Partial<ResourceUsage>): boolean {
    const requiredCpu = required.cpu ?? 0;
    const requiredMemory = required.memory ?? 0;
    const requiredBandwidth = required.bandwidth ?? 0;

    if (this.resourceLimits.maxCpu && this.resourceUsage.cpu + requiredCpu > this.resourceLimits.maxCpu) {
      return false;
    }

    if (this.resourceLimits.maxMemory && this.resourceUsage.memory + requiredMemory > this.resourceLimits.maxMemory) {
      return false;
    }

    if (this.resourceLimits.maxBandwidth && this.resourceUsage.bandwidth + requiredBandwidth > this.resourceLimits.maxBandwidth) {
      return false;
    }

    return true;
  }

  /**
   * Reset controller state
   */
  reset(): void {
    this.currentConcurrency = 0;
    this.queuedExecutions = 0;
    this.resourceUsage = {
      cpu: 0,
      memory: 0,
      bandwidth: 0,
    } as ResourceUsage;
  }

  /**
   * Wait for available slot (async)
   */
  async waitForSlot(timeoutMs: number = 30000): Promise<boolean> {
    const startTime = Date.now();

    while (!this.canStartMore() && Date.now() - startTime < timeoutMs) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return this.canStartMore();
  }

  /**
   * Throttle execution if resource usage is high
   */
  shouldThrottle(): boolean {
    const utilization = this.getResourceUtilization();
    const threshold = 80; // 80% utilization threshold

    return utilization.cpu > threshold ||
           utilization.memory > threshold ||
           utilization.bandwidth > threshold;
  }

  /**
   * Get recommended concurrency based on resource usage
   */
  getRecommendedConcurrency(): number {
    const utilization = this.getResourceUtilization();
    const minUtilization = Math.min(utilization.cpu, utilization.memory, utilization.bandwidth);

    if (minUtilization < 50) {
      return Math.min(this.maxConcurrency, this.currentConcurrency + 1);
    } else if (minUtilization > 80) {
      return Math.max(1, this.currentConcurrency - 1);
    }

    return this.currentConcurrency;
  }
}
