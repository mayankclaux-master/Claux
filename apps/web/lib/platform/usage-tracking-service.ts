/**
 * Usage Tracking Service
 * 
 * Tracks execution usage, connector usage, storage usage, artifact usage, onboarding quota tracking.
 * Prepares for future Stripe integration, plan limits, and execution caps.
 */

import { createLogger, Logger } from '@/lib/utils/logger';

/**
 * Usage type
 */
export enum UsageType {
  EXECUTION = 'execution',
  CONNECTOR = 'connector',
  STORAGE = 'storage',
  ARTIFACT = 'artifact',
  ONBOARDING = 'onboarding',
}

/**
 * Usage record
 */
export interface UsageRecord {
  id: string;
  tenantId: string;
  type: UsageType;
  amount: number;
  unit: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

/**
 * Tenant usage summary
 */
export interface TenantUsageSummary {
  tenantId: string;
  executionCount: number;
  executionLimit: number;
  connectorCalls: number;
  connectorLimit: number;
  storageUsed: number;
  storageLimit: number;
  artifactCount: number;
  artifactLimit: number;
  onboardingQuotaUsed: number;
  onboardingQuotaLimit: number;
  periodStart: number;
  periodEnd: number;
}

/**
 * Usage tracking service
 */
export class UsageTrackingService {
  private logger: Logger;
  private usageRecords: Map<string, UsageRecord[]> = new Map();
  private tenantLimits: Map<string, Partial<TenantUsageSummary>> = new Map();

  constructor() {
    this.logger = createLogger();
  }

  /**
   * Track execution usage
   */
  trackExecution(tenantId: string, agentType: string, duration: number): void {
    this.recordUsage({
      id: crypto.randomUUID(),
      tenantId,
      type: UsageType.EXECUTION,
      amount: 1,
      unit: 'execution',
      timestamp: Date.now(),
      metadata: { agentType, duration },
    });
  }

  /**
   * Track connector usage
   */
  trackConnector(tenantId: string, provider: string, endpoint: string): void {
    this.recordUsage({
      id: crypto.randomUUID(),
      tenantId,
      type: UsageType.CONNECTOR,
      amount: 1,
      unit: 'call',
      timestamp: Date.now(),
      metadata: { provider, endpoint },
    });
  }

  /**
   * Track storage usage
   */
  trackStorage(tenantId: string, bytes: number, resourceType: string): void {
    this.recordUsage({
      id: crypto.randomUUID(),
      tenantId,
      type: UsageType.STORAGE,
      amount: bytes,
      unit: 'bytes',
      timestamp: Date.now(),
      metadata: { resourceType },
    });
  }

  /**
   * Track artifact usage
   */
  trackArtifact(tenantId: string, artifactType: string, size: number): void {
    this.recordUsage({
      id: crypto.randomUUID(),
      tenantId,
      type: UsageType.ARTIFACT,
      amount: 1,
      unit: 'artifact',
      timestamp: Date.now(),
      metadata: { artifactType, size },
    });
  }

  /**
   * Track onboarding quota usage
   */
  trackOnboarding(tenantId: string, stage: string): void {
    this.recordUsage({
      id: crypto.randomUUID(),
      tenantId,
      type: UsageType.ONBOARDING,
      amount: 1,
      unit: 'stage',
      timestamp: Date.now(),
      metadata: { stage },
    });
  }

  /**
   * Record usage
   */
  private recordUsage(record: UsageRecord): void {
    const tenantRecords = this.usageRecords.get(record.tenantId) || [];
    tenantRecords.push(record);
    this.usageRecords.set(record.tenantId, tenantRecords);
    this.logger.debug(`Usage recorded`, { record });
  }

  /**
   * Get tenant usage summary
   */
  getTenantUsage(tenantId: string, periodStart?: number, periodEnd?: number): TenantUsageSummary {
    const records = this.usageRecords.get(tenantId) || [];
    const limits = this.tenantLimits.get(tenantId) || {};

    const now = Date.now();
    const start = periodStart || now - 30 * 24 * 60 * 60 * 1000; // Default to 30 days ago
    const end = periodEnd || now;

    const periodRecords = records.filter(r => r.timestamp >= start && r.timestamp <= end);

    const executionCount = periodRecords.filter(r => r.type === UsageType.EXECUTION).length;
    const connectorCalls = periodRecords.filter(r => r.type === UsageType.CONNECTOR).length;
    const storageUsed = periodRecords
      .filter(r => r.type === UsageType.STORAGE)
      .reduce((sum, r) => sum + r.amount, 0);
    const artifactCount = periodRecords.filter(r => r.type === UsageType.ARTIFACT).length;
    const onboardingQuotaUsed = periodRecords.filter(r => r.type === UsageType.ONBOARDING).length;

    return {
      tenantId,
      executionCount,
      executionLimit: limits.executionLimit || 1000,
      connectorCalls,
      connectorLimit: limits.connectorLimit || 10000,
      storageUsed,
      storageLimit: limits.storageLimit || 10 * 1024 * 1024 * 1024, // 10GB
      artifactCount,
      artifactLimit: limits.artifactLimit || 1000,
      onboardingQuotaUsed,
      onboardingQuotaLimit: limits.onboardingQuotaLimit || 5,
      periodStart: start,
      periodEnd: end,
    };
  }

  /**
   * Set tenant limits
   */
  setTenantLimits(tenantId: string, limits: Partial<TenantUsageSummary>): void {
    const existing = this.tenantLimits.get(tenantId) || {};
    this.tenantLimits.set(tenantId, { ...existing, ...limits });
    this.logger.info(`Tenant limits updated`, { tenantId, limits });
  }

  /**
   * Check if tenant has exceeded limits
   */
  checkLimits(tenantId: string): {
    executionExceeded: boolean;
    connectorExceeded: boolean;
    storageExceeded: boolean;
    artifactExceeded: boolean;
    onboardingExceeded: boolean;
  } {
    const usage = this.getTenantUsage(tenantId);

    return {
      executionExceeded: usage.executionCount >= usage.executionLimit,
      connectorExceeded: usage.connectorCalls >= usage.connectorLimit,
      storageExceeded: usage.storageUsed >= usage.storageLimit,
      artifactExceeded: usage.artifactCount >= usage.artifactLimit,
      onboardingExceeded: usage.onboardingQuotaUsed >= usage.onboardingQuotaLimit,
    };
  }

  /**
   * Get platform-wide usage summary
   */
  getPlatformUsage(): {
    totalTenants: number;
    totalExecutions: number;
    totalConnectorCalls: number;
    totalStorageUsed: number;
    totalArtifacts: number;
  } {
    const tenantIds = Array.from(this.usageRecords.keys());
    const now = Date.now();
    const start = now - 30 * 24 * 60 * 60 * 1000; // 30 days

    let totalExecutions = 0;
    let totalConnectorCalls = 0;
    let totalStorageUsed = 0;
    let totalArtifacts = 0;

    tenantIds.forEach(tenantId => {
      const records = this.usageRecords.get(tenantId) || [];
      const periodRecords = records.filter(r => r.timestamp >= start);

      totalExecutions += periodRecords.filter(r => r.type === UsageType.EXECUTION).length;
      totalConnectorCalls += periodRecords.filter(r => r.type === UsageType.CONNECTOR).length;
      totalStorageUsed += periodRecords
        .filter(r => r.type === UsageType.STORAGE)
        .reduce((sum, r) => sum + r.amount, 0);
      totalArtifacts += periodRecords.filter(r => r.type === UsageType.ARTIFACT).length;
    });

    return {
      totalTenants: tenantIds.length,
      totalExecutions,
      totalConnectorCalls,
      totalStorageUsed,
      totalArtifacts,
    };
  }

  /**
   * Get usage records for tenant
   */
  getUsageRecords(tenantId: string, type?: UsageType): UsageRecord[] {
    const records = this.usageRecords.get(tenantId) || [];
    if (type) {
      return records.filter(r => r.type === type);
    }
    return records;
  }

  /**
   * Reset usage for tenant (for testing or manual correction)
   */
  resetTenantUsage(tenantId: string): void {
    this.usageRecords.delete(tenantId);
    this.logger.info(`Tenant usage reset`, { tenantId });
  }

  /**
   * Get all tenant IDs with usage data
   */
  getTenantIds(): string[] {
    return Array.from(this.usageRecords.keys());
  }
}

/**
 * Singleton instance
 */
export const usageTrackingService = new UsageTrackingService();
