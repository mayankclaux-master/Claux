/**
 * Connector Circuit Breaker Service
 * 
 * Canonical connector circuit breaker service for CLAUX V1 platform edge hardening.
 * Detects repeated connector failures, pauses unhealthy connectors, exponential cooldown, prevents connector flood collapse, protects execution pipelines.
 * Per connector: failure threshold, cooldown state, recovery state, degraded mode.
 * 
 * CRITICAL: This is the ONLY connector circuit breaker service in CLAUX.
 */

import type { UUID } from '../runtime/types/common.types';
import { createLogger, Logger } from '@/lib/utils/logger';

/**
 * Circuit breaker state
 */
export type CircuitBreakerState = 'closed' | 'open' | 'half_open' | 'degraded';

/**
 * Circuit breaker config
 */
export interface CircuitBreakerConfig {
  failureThreshold: number; // failures before opening
  successThreshold: number; // successes before closing
  cooldownMs: number; // base cooldown time
  maxCooldownMs: number; // maximum cooldown time
  degradedThreshold: number; // failures before degraded mode
}

/**
 * Circuit breaker status
 */
export interface CircuitBreakerStatus {
  state: CircuitBreakerState;
  failureCount: number;
  successCount: number;
  lastFailureAt: number;
  lastSuccessAt: number;
  cooldownUntil: number;
  reason?: string;
}

/**
 * Connector circuit breaker service
 */
export class ConnectorCircuitBreakerService {
  private logger: Logger;
  private circuitBreakers: Map<string, CircuitBreakerStatus>;
  private readonly DEFAULT_CONFIG: CircuitBreakerConfig = {
    failureThreshold: 5,
    successThreshold: 3,
    cooldownMs: 60 * 1000, // 1 minute
    maxCooldownMs: 10 * 60 * 1000, // 10 minutes
    degradedThreshold: 3,
  };

  constructor() {
    this.logger = createLogger();
    this.circuitBreakers = new Map();
  }

  /**
   * Record connector success
   */
  recordSuccess(tenantId: UUID, provider: string): void {
    const key = this.getKey(tenantId, provider);
    const status = this.getStatusInternal(key);

    status.successCount++;
    status.lastSuccessAt = Date.now();

    // Check if we can close the circuit
    if (status.state === 'half_open' && status.successCount >= this.DEFAULT_CONFIG.successThreshold) {
      status.state = 'closed';
      status.failureCount = 0;
      status.successCount = 0;
      status.cooldownUntil = 0;
      status.reason = undefined;
      this.logger.info('Circuit breaker closed', { tenantId, provider });
    } else if (status.state === 'degraded' && status.successCount >= this.DEFAULT_CONFIG.successThreshold) {
      status.state = 'closed';
      status.failureCount = 0;
      status.successCount = 0;
      status.reason = undefined;
      this.logger.info('Circuit breaker recovered from degraded', { tenantId, provider });
    }

    this.circuitBreakers.set(key, status);
  }

  /**
   * Record connector failure
   */
  recordFailure(tenantId: UUID, provider: string, reason?: string): void {
    const key = this.getKey(tenantId, provider);
    const status = this.getStatusInternal(key);

    status.failureCount++;
    status.lastFailureAt = Date.now();
    status.reason = reason;

    // Check if we need to open the circuit
    if (status.failureCount >= this.DEFAULT_CONFIG.failureThreshold) {
      const cooldown = this.calculateCooldown(status.failureCount);
      status.state = 'open';
      status.cooldownUntil = Date.now() + cooldown;
      status.successCount = 0;
      this.logger.warn('Circuit breaker opened', { tenantId, provider, cooldown, reason });
    } else if (status.failureCount >= this.DEFAULT_CONFIG.degradedThreshold) {
      status.state = 'degraded';
      this.logger.warn('Circuit breaker degraded', { tenantId, provider, failureCount: status.failureCount });
    }

    this.circuitBreakers.set(key, status);
  }

  /**
   * Check if connector is allowed to execute
   */
  canExecute(tenantId: UUID, provider: string): { allowed: boolean; state: CircuitBreakerState; reason?: string } {
    const key = this.getKey(tenantId, provider);
    const status = this.getStatusInternal(key);

    // Check if circuit is open and cooldown has expired
    if (status.state === 'open' && Date.now() > status.cooldownUntil) {
      status.state = 'half_open';
      status.successCount = 0;
      this.circuitBreakers.set(key, status);
      this.logger.info('Circuit breaker half-open', { tenantId, provider });
    }

    const allowed = status.state !== 'open';
    return {
      allowed,
      state: status.state,
      reason: status.reason,
    };
  }

  /**
   * Get circuit breaker status
   */
  getStatus(tenantId: UUID, provider: string): CircuitBreakerStatus {
    const key = this.getKey(tenantId, provider);
    return this.getStatusInternal(key);
  }

  /**
   * Reset circuit breaker
   */
  reset(tenantId: UUID, provider: string): void {
    const key = this.getKey(tenantId, provider);
    this.circuitBreakers.delete(key);
    this.logger.info('Circuit breaker reset', { tenantId, provider });
  }

  /**
   * Get all circuit breaker statuses
   */
  getAllStatuses(): Map<string, CircuitBreakerStatus> {
    return new Map(this.circuitBreakers);
  }

  /**
   * Get circuit breaker status (internal)
   */
  private getStatusInternal(key: string): CircuitBreakerStatus {
    const existing = this.circuitBreakers.get(key);
    if (existing) {
      return existing;
    }

    return {
      state: 'closed',
      failureCount: 0,
      successCount: 0,
      lastFailureAt: 0,
      lastSuccessAt: 0,
      cooldownUntil: 0,
    };
  }

  /**
   * Calculate exponential cooldown
   */
  private calculateCooldown(failureCount: number): number {
    const exponential = Math.pow(2, failureCount - this.DEFAULT_CONFIG.failureThreshold);
    const cooldown = this.DEFAULT_CONFIG.cooldownMs * exponential;
    return Math.min(cooldown, this.DEFAULT_CONFIG.maxCooldownMs);
  }

  /**
   * Generate key
   */
  private getKey(tenantId: UUID, provider: string): string {
    return `${tenantId}:${provider}`;
  }

  /**
   * Force open circuit breaker
   */
  forceOpen(tenantId: UUID, provider: string, reason: string, cooldownMs?: number): void {
    const key = this.getKey(tenantId, provider);
    const status = this.getStatusInternal(key);

    status.state = 'open';
    status.failureCount = this.DEFAULT_CONFIG.failureThreshold;
    status.cooldownUntil = Date.now() + (cooldownMs ?? this.DEFAULT_CONFIG.cooldownMs);
    status.reason = reason;
    status.successCount = 0;

    this.circuitBreakers.set(key, status);
    this.logger.warn('Circuit breaker force opened', { tenantId, provider, reason });
  }

  /**
   * Force close circuit breaker
   */
  forceClose(tenantId: UUID, provider: string): void {
    const key = this.getKey(tenantId, provider);
    const status = this.getStatusInternal(key);

    status.state = 'closed';
    status.failureCount = 0;
    status.successCount = 0;
    status.cooldownUntil = 0;
    status.reason = undefined;

    this.circuitBreakers.set(key, status);
    this.logger.info('Circuit breaker force closed', { tenantId, provider });
  }

  /**
   * Get circuit breaker statistics
   */
  getStatistics(): {
    total: number;
    closed: number;
    open: number;
    halfOpen: number;
    degraded: number;
  } {
    let closed = 0;
    let open = 0;
    let halfOpen = 0;
    let degraded = 0;

    for (const status of this.circuitBreakers.values()) {
      switch (status.state) {
        case 'closed':
          closed++;
          break;
        case 'open':
          open++;
          break;
        case 'half_open':
          halfOpen++;
          break;
        case 'degraded':
          degraded++;
          break;
      }
    }

    return {
      total: this.circuitBreakers.size,
      closed,
      open,
      halfOpen,
      degraded,
    };
  }
}

/**
 * Singleton instance
 */
export const connectorCircuitBreakerService = new ConnectorCircuitBreakerService();
