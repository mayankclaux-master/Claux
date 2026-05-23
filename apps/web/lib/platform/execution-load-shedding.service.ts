/**
 * Execution Load Shedding Service
 * 
 * Canonical execution load shedding service for CLAUX V1 platform edge hardening.
 * Rejects excessive concurrent executions, tenant execution caps, system overload protection, graceful degradation, protects Vercel serverless limits.
 * 
 * CRITICAL: This is the ONLY execution load shedding service in CLAUX.
 */

import type { UUID } from '../runtime/types/common.types';
import { createLogger, Logger } from '@/lib/utils/logger';

/**
 * Load shedding config
 */
export interface LoadSheddingConfig {
  maxConcurrentExecutions: number; // global max
  maxTenantExecutions: number; // per tenant max
  systemOverloadThreshold: number; // CPU/memory threshold
  gracefulDegradationEnabled: boolean;
}

/**
 * Load shedding status
 */
export interface LoadSheddingStatus {
  globalConcurrent: number;
  tenantConcurrent: Map<UUID, number>;
  systemOverload: boolean;
  shedding: boolean;
  reason?: string;
}

/**
 * Execution load shedding service
 */
export class ExecutionLoadSheddingService {
  private logger: Logger;
  private activeExecutions: Map<UUID, Set<UUID>>; // tenantId -> executionIds
  private globalConcurrent: number;
  private systemOverload: boolean;
  private readonly DEFAULT_CONFIG: LoadSheddingConfig = {
    maxConcurrentExecutions: 50, // global max concurrent executions
    maxTenantExecutions: 5, // per tenant max concurrent executions
    systemOverloadThreshold: 80, // 80% CPU/memory
    gracefulDegradationEnabled: true,
  };

  constructor() {
    this.logger = createLogger();
    this.activeExecutions = new Map();
    this.globalConcurrent = 0;
    this.systemOverload = false;
  }

  /**
   * Request execution slot
   */
  requestExecution(tenantId: UUID, executionId: UUID): { allowed: boolean; reason?: string } {
    // Check system overload
    if (this.systemOverload) {
      return {
        allowed: false,
        reason: 'System overload detected',
      };
    }

    // Check global concurrent limit
    if (this.globalConcurrent >= this.DEFAULT_CONFIG.maxConcurrentExecutions) {
      return {
        allowed: false,
        reason: 'Global concurrent execution limit reached',
      };
    }

    // Check tenant concurrent limit
    const tenantExecutions = this.activeExecutions.get(tenantId) || new Set();
    if (tenantExecutions.size >= this.DEFAULT_CONFIG.maxTenantExecutions) {
      return {
        allowed: false,
        reason: 'Tenant concurrent execution limit reached',
      };
    }

    // Grant execution slot
    tenantExecutions.add(executionId);
    this.activeExecutions.set(tenantId, tenantExecutions);
    this.globalConcurrent++;

    this.logger.debug('Execution slot granted', { tenantId, executionId, globalConcurrent: this.globalConcurrent });

    return { allowed: true };
  }

  /**
   * Release execution slot
   */
  releaseExecution(tenantId: UUID, executionId: UUID): void {
    const tenantExecutions = this.activeExecutions.get(tenantId);
    if (tenantExecutions) {
      tenantExecutions.delete(executionId);
      if (tenantExecutions.size === 0) {
        this.activeExecutions.delete(tenantId);
      }
    }

    this.globalConcurrent = Math.max(0, this.globalConcurrent - 1);

    this.logger.debug('Execution slot released', { tenantId, executionId, globalConcurrent: this.globalConcurrent });
  }

  /**
   * Set system overload state
   */
  setSystemOverload(overload: boolean, reason?: string): void {
    this.systemOverload = overload;
    if (overload) {
      this.logger.warn('System overload triggered', { reason });
    } else {
      this.logger.info('System overload cleared');
    }
  }

  /**
   * Get load shedding status
   */
  getStatus(): LoadSheddingStatus {
    const tenantConcurrent = new Map<UUID, number>();
    for (const [tenantId, executions] of this.activeExecutions.entries()) {
      tenantConcurrent.set(tenantId, executions.size);
    }

    const shedding = this.systemOverload || 
                    this.globalConcurrent >= this.DEFAULT_CONFIG.maxConcurrentExecutions;

    return {
      globalConcurrent: this.globalConcurrent,
      tenantConcurrent,
      systemOverload: this.systemOverload,
      shedding,
      reason: this.systemOverload ? 'System overload' : 
              this.globalConcurrent >= this.DEFAULT_CONFIG.maxConcurrentExecutions ? 
              'Global limit reached' : undefined,
    };
  }

  /**
   * Get tenant execution count
   */
  getTenantExecutionCount(tenantId: UUID): number {
    return this.activeExecutions.get(tenantId)?.size || 0;
  }

  /**
   * Force shed all executions for tenant
   */
  forceShedTenant(tenantId: UUID): void {
    const count = this.activeExecutions.get(tenantId)?.size || 0;
    this.activeExecutions.delete(tenantId);
    this.globalConcurrent = Math.max(0, this.globalConcurrent - count);
    this.logger.warn('Tenant executions force shed', { tenantId, count });
  }

  /**
   * Force shed all executions
   */
  forceShedAll(): void {
    const count = this.globalConcurrent;
    this.activeExecutions.clear();
    this.globalConcurrent = 0;
    this.logger.warn('All executions force shed', { count });
  }

  /**
   * Enable graceful degradation
   */
  enableGracefulDegradation(): void {
    this.DEFAULT_CONFIG.gracefulDegradationEnabled = true;
    this.logger.info('Graceful degradation enabled');
  }

  /**
   * Disable graceful degradation
   */
  disableGracefulDegradation(): void {
    this.DEFAULT_CONFIG.gracefulDegradationEnabled = false;
    this.logger.info('Graceful degradation disabled');
  }

  /**
   * Update config
   */
  updateConfig(config: Partial<LoadSheddingConfig>): void {
    Object.assign(this.DEFAULT_CONFIG, config);
    this.logger.info('Load shedding config updated', { config });
  }

  /**
   * Get config
   */
  getConfig(): LoadSheddingConfig {
    return { ...this.DEFAULT_CONFIG };
  }

  /**
   * Check if system is healthy
   */
  isSystemHealthy(): boolean {
    return !this.systemOverload && 
           this.globalConcurrent < this.DEFAULT_CONFIG.maxConcurrentExecutions;
  }

  /**
   * Get load shedding statistics
   */
  getStatistics(): {
    globalConcurrent: number;
    globalUtilization: number;
    tenantCount: number;
    healthyTenants: number;
    overloadedTenants: number;
  } {
    const tenantCount = this.activeExecutions.size;
    let healthyTenants = 0;
    let overloadedTenants = 0;

    for (const executions of this.activeExecutions.values()) {
      if (executions.size >= this.DEFAULT_CONFIG.maxTenantExecutions) {
        overloadedTenants++;
      } else {
        healthyTenants++;
      }
    }

    const globalUtilization = (this.globalConcurrent / this.DEFAULT_CONFIG.maxConcurrentExecutions) * 100;

    return {
      globalConcurrent: this.globalConcurrent,
      globalUtilization,
      tenantCount,
      healthyTenants,
      overloadedTenants,
    };
  }
}

/**
 * Singleton instance
 */
export const executionLoadSheddingService = new ExecutionLoadSheddingService();
