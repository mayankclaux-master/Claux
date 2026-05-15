/**
 * CLAUX Runtime Intelligence Layer - Dynamic Retry
 * 
 * Dynamic retry optimization.
 * No ML providers - pure semantic intelligence.
 */

import type { DynamicRetryConfiguration } from './types';
import { DynamicRetryError } from './errors';
import { DEFAULT_RETRY_CONFIG } from './constants';

/**
 * Dynamic Retry Manager
 */
export class DynamicRetryManager {
  private configurations: Map<string, DynamicRetryConfiguration> = new Map();
  private attemptHistory: Map<string, number[]> = new Map();

  /**
   * Get retry configuration
   */
  getRetryConfiguration(executionId: string): DynamicRetryConfiguration {
    return this.configurations.get(executionId) || this.defaultConfiguration();
  }

  /**
   * Set retry configuration
   */
  setRetryConfiguration(executionId: string, config: DynamicRetryConfiguration): void {
    this.configurations.set(executionId, config);
  }

  /**
   * Calculate retry delay
   */
  calculateRetryDelay(executionId: string, attempt: number): number {
    const config = this.getRetryConfiguration(executionId);
    let delay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1);

    if (config.jitterEnabled) {
      delay = this.applyJitter(delay);
    }

    if (config.adaptiveDelay) {
      delay = this.applyAdaptiveDelay(executionId, attempt, delay);
    }

    return Math.min(delay, config.maxDelay);
  }

  /**
   * Apply jitter
   */
  private applyJitter(delay: number): number {
    const jitter = delay * 0.1;
    return delay + (Math.random() * 2 - 1) * jitter;
  }

  /**
   * Apply adaptive delay
   */
  private applyAdaptiveDelay(executionId: string, attempt: number, delay: number): number {
    const history = this.attemptHistory.get(executionId) || [];
    const successRate = this.calculateSuccessRate(history);

    if (successRate < 0.3) {
      return delay * 1.5;
    } else if (successRate > 0.7) {
      return delay * 0.8;
    }

    return delay;
  }

  /**
   * Calculate success rate
   */
  private calculateSuccessRate(history: readonly number[]): number {
    if (history.length === 0) return 0.5;
    const successes = history.filter(h => h === 1).length;
    return successes / history.length;
  }

  /**
   * Record attempt result
   */
  recordAttempt(executionId: string, success: boolean): void {
    const history = this.attemptHistory.get(executionId) || [];
    history.push(success ? 1 : 0);

    // Keep only last 10 attempts
    if (history.length > 10) {
      history.shift();
    }

    this.attemptHistory.set(executionId, history);
  }

  /**
   * Get attempt history
   */
  getAttemptHistory(executionId: string): readonly number[] {
    return this.attemptHistory.get(executionId) || [];
  }

  /**
   * Clear configuration
   */
  clearConfiguration(executionId: string): void {
    this.configurations.delete(executionId);
  }

  /**
   * Clear attempt history
   */
  clearAttemptHistory(executionId: string): void {
    this.attemptHistory.delete(executionId);
  }

  /**
   * Clear all
   */
  clear(): void {
    this.configurations.clear();
    this.attemptHistory.clear();
  }

  /**
   * Default configuration
   */
  private defaultConfiguration(): DynamicRetryConfiguration {
    return {
      baseDelay: DEFAULT_RETRY_CONFIG.BASE_DELAY_MS,
      maxDelay: DEFAULT_RETRY_CONFIG.MAX_DELAY_MS,
      backoffMultiplier: DEFAULT_RETRY_CONFIG.BACKOFF_MULTIPLIER,
      jitterEnabled: DEFAULT_RETRY_CONFIG.JITTER_ENABLED,
      adaptiveDelay: DEFAULT_RETRY_CONFIG.ADAPTIVE_DELAY,
    };
  }
}
