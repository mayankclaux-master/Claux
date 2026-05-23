/**
 * Feature Flag Service
 * 
 * Extended feature flag system supporting per-tenant flags, staged rollouts, connector enable/disable, onboarding gates, beta features, execution throttling.
 * Supports instant rollback and tenant-safe isolation.
 */

import { createLogger, Logger } from '@/lib/utils/logger';

/**
 * Feature flag type
 */
export enum FeatureFlagType {
  BOOLEAN = 'boolean',
  PERCENTAGE = 'percentage',
  TENANT_LIST = 'tenant_list',
  CONFIG = 'config',
}

/**
 * Feature flag scope
 */
export enum FeatureFlagScope {
  GLOBAL = 'global',
  PER_TENANT = 'per_tenant',
  STAGED = 'staged',
}

/**
 * Feature flag
 */
export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  type: FeatureFlagType;
  scope: FeatureFlagScope;
  enabled: boolean;
  value?: any;
  rolloutPercentage?: number;
  allowedTenants?: string[];
  deniedTenants?: string[];
  createdAt: number;
  updatedAt: number;
  createdBy: string;
}

/**
 * Feature flag service
 */
export class FeatureFlagService {
  private logger: Logger;
  private flags: Map<string, FeatureFlag> = new Map();

  constructor() {
    this.logger = createLogger();
    this.initializeDefaultFlags();
  }

  /**
   * Initialize default feature flags
   */
  private initializeDefaultFlags(): void {
    // Connector enable/disable flags
    this.setFlag({
      id: 'connector-dataforseo-enabled',
      name: 'DataForSEO Connector Enabled',
      description: 'Enable/disable DataForSEO connector',
      type: FeatureFlagType.BOOLEAN,
      scope: FeatureFlagScope.PER_TENANT,
      enabled: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: 'system',
    });

    this.setFlag({
      id: 'connector-serpapi-enabled',
      name: 'SerpAPI Connector Enabled',
      description: 'Enable/disable SerpAPI connector',
      type: FeatureFlagType.BOOLEAN,
      scope: FeatureFlagScope.PER_TENANT,
      enabled: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: 'system',
    });

    this.setFlag({
      id: 'connector-ga4-enabled',
      name: 'GA4 Connector Enabled',
      description: 'Enable/disable GA4 connector',
      type: FeatureFlagType.BOOLEAN,
      scope: FeatureFlagScope.PER_TENANT,
      enabled: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: 'system',
    });

    this.setFlag({
      id: 'connector-gsc-enabled',
      name: 'GSC Connector Enabled',
      description: 'Enable/disable GSC connector',
      type: FeatureFlagType.BOOLEAN,
      scope: FeatureFlagScope.PER_TENANT,
      enabled: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: 'system',
    });

    this.setFlag({
      id: 'connector-gbp-enabled',
      name: 'GBP Connector Enabled',
      description: 'Enable/disable GBP connector',
      type: FeatureFlagType.BOOLEAN,
      scope: FeatureFlagScope.PER_TENANT,
      enabled: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: 'system',
    });

    this.setFlag({
      id: 'connector-screaming-frog-enabled',
      name: 'Screaming Frog Connector Enabled',
      description: 'Enable/disable Screaming Frog connector',
      type: FeatureFlagType.BOOLEAN,
      scope: FeatureFlagScope.PER_TENANT,
      enabled: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: 'system',
    });

    this.setFlag({
      id: 'connector-openai-enabled',
      name: 'OpenAI Connector Enabled',
      description: 'Enable/disable OpenAI connector',
      type: FeatureFlagType.BOOLEAN,
      scope: FeatureFlagScope.PER_TENANT,
      enabled: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: 'system',
    });

    // Onboarding gates
    this.setFlag({
      id: 'onboarding-connector-setup-enabled',
      name: 'Onboarding Connector Setup Enabled',
      description: 'Enable connector setup stage in onboarding',
      type: FeatureFlagType.BOOLEAN,
      scope: FeatureFlagScope.GLOBAL,
      enabled: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: 'system',
    });

    this.setFlag({
      id: 'onboarding-auto-bootstrap-enabled',
      name: 'Onboarding Auto Bootstrap Enabled',
      description: 'Enable automatic tenant bootstrap during onboarding',
      type: FeatureFlagType.BOOLEAN,
      scope: FeatureFlagScope.GLOBAL,
      enabled: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: 'system',
    });

    // Beta features
    this.setFlag({
      id: 'beta-advanced-analytics',
      name: 'Advanced Analytics (Beta)',
      description: 'Enable advanced analytics features',
      type: FeatureFlagType.PERCENTAGE,
      scope: FeatureFlagScope.STAGED,
      enabled: true,
      rolloutPercentage: 10,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: 'system',
    });

    this.setFlag({
      id: 'beta-ai-insights',
      name: 'AI Insights (Beta)',
      description: 'Enable AI-powered insights',
      type: FeatureFlagType.PERCENTAGE,
      scope: FeatureFlagScope.STAGED,
      enabled: true,
      rolloutPercentage: 5,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: 'system',
    });

    // Execution throttling
    this.setFlag({
      id: 'execution-throttle-enabled',
      name: 'Execution Throttling Enabled',
      description: 'Enable execution throttling for tenant isolation',
      type: FeatureFlagType.BOOLEAN,
      scope: FeatureFlagScope.GLOBAL,
      enabled: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: 'system',
    });

    this.setFlag({
      id: 'execution-throttle-limit',
      name: 'Execution Throttle Limit',
      description: 'Maximum concurrent executions per tenant',
      type: FeatureFlagType.CONFIG,
      scope: FeatureFlagScope.PER_TENANT,
      enabled: true,
      value: 5,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: 'system',
    });
  }

  /**
   * Check if a feature flag is enabled for a tenant
   */
  isEnabled(flagId: string, tenantId?: string): boolean {
    const flag = this.flags.get(flagId);
    if (!flag) {
      this.logger.warn(`Feature flag not found: ${flagId}`);
      return false;
    }

    if (!flag.enabled) {
      return false;
    }

    // Global flags
    if (flag.scope === FeatureFlagScope.GLOBAL) {
      return true;
    }

    // Per-tenant flags
    if (flag.scope === FeatureFlagScope.PER_TENANT && tenantId) {
      // Check denied tenants first
      if (flag.deniedTenants && flag.deniedTenants.includes(tenantId)) {
        return false;
      }
      // Check allowed tenants
      if (flag.allowedTenants && flag.allowedTenants.length > 0) {
        return flag.allowedTenants.includes(tenantId);
      }
      // If no tenant list, default to enabled
      return true;
    }

    // Staged rollout flags
    if (flag.scope === FeatureFlagScope.STAGED && tenantId && flag.rolloutPercentage !== undefined) {
      // Hash tenant ID to get consistent percentage
      const hash = this.hashString(tenantId);
      const percentage = hash % 100;
      return percentage < flag.rolloutPercentage;
    }

    return false;
  }

  /**
   * Get feature flag value
   */
  getValue(flagId: string, tenantId?: string): any {
    if (!this.isEnabled(flagId, tenantId)) {
      return null;
    }

    const flag = this.flags.get(flagId);
    return flag?.value;
  }

  /**
   * Set or update a feature flag
   */
  setFlag(flag: FeatureFlag): void {
    const existing = this.flags.get(flag.id);
    if (existing) {
      flag.updatedAt = Date.now();
    }
    this.flags.set(flag.id, flag);
    this.logger.info(`Feature flag ${flag.id} ${existing ? 'updated' : 'created'}`, { flag });
  }

  /**
   * Delete a feature flag
   */
  deleteFlag(flagId: string): boolean {
    const deleted = this.flags.delete(flagId);
    if (deleted) {
      this.logger.info(`Feature flag ${flagId} deleted`);
    }
    return deleted;
  }

  /**
   * Get all feature flags
   */
  getAllFlags(): FeatureFlag[] {
    return Array.from(this.flags.values());
  }

  /**
   * Get feature flags for a tenant
   */
  getFlagsForTenant(tenantId: string): FeatureFlag[] {
    return Array.from(this.flags.values()).filter(flag => 
      flag.scope === FeatureFlagScope.GLOBAL || 
      (flag.scope === FeatureFlagScope.PER_TENANT && this.isEnabled(flag.id, tenantId)) ||
      (flag.scope === FeatureFlagScope.STAGED && this.isEnabled(flag.id, tenantId))
    );
  }

  /**
   * Enable connector for tenant
   */
  enableConnector(tenantId: string, connector: string): void {
    const flagId = `connector-${connector.toLowerCase()}-enabled`;
    const flag = this.flags.get(flagId);
    
    if (flag) {
      if (!flag.allowedTenants) {
        flag.allowedTenants = [];
      }
      if (!flag.allowedTenants.includes(tenantId)) {
        flag.allowedTenants.push(tenantId);
      }
      if (flag.deniedTenants) {
        flag.deniedTenants = flag.deniedTenants.filter(t => t !== tenantId);
      }
      flag.updatedAt = Date.now();
      this.logger.info(`Connector ${connector} enabled for tenant ${tenantId}`);
    }
  }

  /**
   * Disable connector for tenant
   */
  disableConnector(tenantId: string, connector: string): void {
    const flagId = `connector-${connector.toLowerCase()}-enabled`;
    const flag = this.flags.get(flagId);
    
    if (flag) {
      if (!flag.deniedTenants) {
        flag.deniedTenants = [];
      }
      if (!flag.deniedTenants.includes(tenantId)) {
        flag.deniedTenants.push(tenantId);
      }
      if (flag.allowedTenants) {
        flag.allowedTenants = flag.allowedTenants.filter(t => t !== tenantId);
      }
      flag.updatedAt = Date.now();
      this.logger.info(`Connector ${connector} disabled for tenant ${tenantId}`);
    }
  }

  /**
   * Instant rollback - disable flag immediately
   */
  rollbackFlag(flagId: string): void {
    const flag = this.flags.get(flagId);
    if (flag) {
      flag.enabled = false;
      flag.updatedAt = Date.now();
      this.logger.info(`Feature flag ${flagId} rolled back (disabled)`);
    }
  }

  /**
   * Hash string to number for percentage-based rollouts
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Get flag by ID
   */
  getFlag(flagId: string): FeatureFlag | undefined {
    return this.flags.get(flagId);
  }
}

/**
 * Singleton instance
 */
export const featureFlagService = new FeatureFlagService();
