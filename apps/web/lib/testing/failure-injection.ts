/**
 * Failure Injection System
 * 
 * Support random connector failures, timeout injection, malformed payloads, auth failures, Supabase failures, execution crashes, retry storms.
 */

import { createLogger, Logger } from '@/lib/utils/logger';

/**
 * Failure type
 */
export enum FailureType {
  CONNECTOR_FAILURE = 'connector_failure',
  TIMEOUT = 'timeout',
  MALFORMED_PAYLOAD = 'malformed_payload',
  AUTH_FAILURE = 'auth_failure',
  SUPABASE_FAILURE = 'supabase_failure',
  EXECUTION_CRASH = 'execution_crash',
  RETRY_STORM = 'retry_storm',
}

/**
 * Failure injection config
 */
export interface FailureInjectionConfig {
  enabled: boolean;
  failureRate: number; // 0-1
  failureTypes: FailureType[];
  randomSeed: number;
}

/**
 * Injected failure
 */
export interface InjectedFailure {
  type: FailureType;
  timestamp: number;
  details: string;
}

/**
 * Failure injection system
 */
export class FailureInjectionSystem {
  private logger: Logger;
  private config: FailureInjectionConfig;
  private injectedFailures: InjectedFailure[] = [];
  private randomSeed: number;

  constructor(config: Partial<FailureInjectionConfig> = {}) {
    this.logger = createLogger();
    this.config = {
      enabled: true,
      failureRate: 0.1,
      failureTypes: Object.values(FailureType),
      randomSeed: 42,
      ...config,
    };
    this.randomSeed = this.config.randomSeed;
  }

  /**
   * Inject random failure
   */
  injectFailure(): InjectedFailure | null {
    if (!this.config.enabled) {
      return null;
    }

    if (this.random() > this.config.failureRate) {
      return null;
    }

    const failureType = this.config.failureTypes[Math.floor(this.random() * this.config.failureTypes.length)];
    const failure: InjectedFailure = {
      type: failureType,
      timestamp: Date.now(),
      details: this.generateFailureDetails(failureType),
    };

    this.injectedFailures.push(failure);
    this.logger.warn('Failure injected', { failure });

    return failure;
  }

  /**
   * Inject specific failure type
   */
  injectSpecificFailure(type: FailureType): InjectedFailure {
    const failure: InjectedFailure = {
      type,
      timestamp: Date.now(),
      details: this.generateFailureDetails(type),
    };

    this.injectedFailures.push(failure);
    this.logger.warn('Specific failure injected', { failure });

    return failure;
  }

  /**
   * Inject connector failure
   */
  injectConnectorFailure(): InjectedFailure {
    return this.injectSpecificFailure(FailureType.CONNECTOR_FAILURE);
  }

  /**
   * Inject timeout
   */
  injectTimeout(): InjectedFailure {
    return this.injectSpecificFailure(FailureType.TIMEOUT);
  }

  /**
   * Inject malformed payload
   */
  injectMalformedPayload(): InjectedFailure {
    return this.injectSpecificFailure(FailureType.MALFORMED_PAYLOAD);
  }

  /**
   * Inject auth failure
   */
  injectAuthFailure(): InjectedFailure {
    return this.injectSpecificFailure(FailureType.AUTH_FAILURE);
  }

  /**
   * Inject Supabase failure
   */
  injectSupabaseFailure(): InjectedFailure {
    return this.injectSpecificFailure(FailureType.SUPABASE_FAILURE);
  }

  /**
   * Inject execution crash
   */
  injectExecutionCrash(): InjectedFailure {
    return this.injectSpecificFailure(FailureType.EXECUTION_CRASH);
  }

  /**
   * Inject retry storm
   */
  injectRetryStorm(): InjectedFailure {
    return this.injectSpecificFailure(FailureType.RETRY_STORM);
  }

  /**
   * Generate failure details
   */
  private generateFailureDetails(type: FailureType): string {
    const detailsMap: Record<FailureType, string> = {
      [FailureType.CONNECTOR_FAILURE]: 'Connector API returned error response',
      [FailureType.TIMEOUT]: 'Request timed out after 30 seconds',
      [FailureType.MALFORMED_PAYLOAD]: 'Received malformed JSON payload',
      [FailureType.AUTH_FAILURE]: 'Authentication credentials invalid or expired',
      [FailureType.SUPABASE_FAILURE]: 'Database query failed or connection lost',
      [FailureType.EXECUTION_CRASH]: 'Agent execution crashed unexpectedly',
      [FailureType.RETRY_STORM]: 'Multiple retry attempts triggered due to transient failures',
    };

    return detailsMap[type];
  }

  /**
   * Seeded random number generator
   */
  private random(): number {
    this.randomSeed = (this.randomSeed * 9301 + 49297) % 233280;
    return this.randomSeed / 233280;
  }

  /**
   * Get injected failures
   */
  getInjectedFailures(): InjectedFailure[] {
    return [...this.injectedFailures];
  }

  /**
   * Get failure statistics
   */
  getFailureStatistics(): {
    total: number;
    byType: Record<FailureType, number>;
  } {
    const byType: Record<FailureType, number> = {
      [FailureType.CONNECTOR_FAILURE]: 0,
      [FailureType.TIMEOUT]: 0,
      [FailureType.MALFORMED_PAYLOAD]: 0,
      [FailureType.AUTH_FAILURE]: 0,
      [FailureType.SUPABASE_FAILURE]: 0,
      [FailureType.EXECUTION_CRASH]: 0,
      [FailureType.RETRY_STORM]: 0,
    };

    for (const failure of this.injectedFailures) {
      byType[failure.type]++;
    }

    return {
      total: this.injectedFailures.length,
      byType,
    };
  }

  /**
   * Clear injected failures
   */
  clearFailures(): void {
    this.injectedFailures = [];
    this.logger.info('Injected failures cleared');
  }

  /**
   * Enable failure injection
   */
  enable(): void {
    this.config.enabled = true;
    this.logger.info('Failure injection enabled');
  }

  /**
   * Disable failure injection
   */
  disable(): void {
    this.config.enabled = false;
    this.logger.info('Failure injection disabled');
  }

  /**
   * Update config
   */
  updateConfig(config: Partial<FailureInjectionConfig>): void {
    Object.assign(this.config, config);
    this.logger.info('Failure injection config updated', { config });
  }

  /**
   * Get config
   */
  getConfig(): FailureInjectionConfig {
    return { ...this.config };
  }

  /**
   * Reset
   */
  reset(): void {
    this.clearFailures();
    this.randomSeed = this.config.randomSeed;
  }
}

/**
 * Singleton instance
 */
export const failureInjectionSystem = new FailureInjectionSystem();
