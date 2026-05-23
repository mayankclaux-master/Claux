/**
 * Feature Flag Foundation
 * 
 * Simple feature flag system for CLAUX V1.
 * Environment-driven, tenant-driven optional override, no third-party service.
 * 
 * CRITICAL: This is the ONLY feature flag system in CLAUX.
 */

/**
 * Feature flag definition
 */
export interface FeatureFlag {
  readonly key: string;
  readonly enabled: boolean;
  readonly description: string;
}

/**
 * Feature flag override
 */
export interface FeatureFlagOverride {
  readonly tenantId: string;
  readonly flagKey: string;
  readonly enabled: boolean;
}

/**
 * Default feature flags
 */
const DEFAULT_FLAGS: Record<string, FeatureFlag> = {
  // Agent features
  'agent.aria.enabled': {
    key: 'agent.aria.enabled',
    enabled: true,
    description: 'Enable ARIA agent',
  },
  'agent.scribe.enabled': {
    key: 'agent.scribe.enabled',
    enabled: true,
    description: 'Enable SCRIBE agent',
  },
  'agent.publish.enabled': {
    key: 'agent.publish.enabled',
    enabled: true,
    description: 'Enable PUBLISH agent',
  },
  'agent.pulse.enabled': {
    key: 'agent.pulse.enabled',
    enabled: true,
    description: 'Enable PULSE agent',
  },
  'agent.locl.enabled': {
    key: 'agent.locl.enabled',
    enabled: true,
    description: 'Enable LOCL agent',
  },
  'agent.repute.enabled': {
    key: 'agent.repute.enabled',
    enabled: true,
    description: 'Enable REPUTE agent',
  },
  'agent.linx.enabled': {
    key: 'agent.linx.enabled',
    enabled: true,
    description: 'Enable LINX agent',
  },
  'agent.prism.enabled': {
    key: 'agent.prism.enabled',
    enabled: true,
    description: 'Enable PRISM agent',
  },
  'agent.core.enabled': {
    key: 'agent.core.enabled',
    enabled: true,
    description: 'Enable CORE agent',
  },

  // Connector features
  'connector.dataforseo.enabled': {
    key: 'connector.dataforseo.enabled',
    enabled: true,
    description: 'Enable DataForSEO connector',
  },
  'connector.serpapi.enabled': {
    key: 'connector.serpapi.enabled',
    enabled: true,
    description: 'Enable SerpAPI connector',
  },
  'connector.screaming-frog.enabled': {
    key: 'connector.screaming-frog.enabled',
    enabled: true,
    description: 'Enable Screaming Frog connector',
  },
  'connector.google-analytics.enabled': {
    key: 'connector.google-analytics.enabled',
    enabled: true,
    description: 'Enable Google Analytics connector',
  },
  'connector.google-search-console.enabled': {
    key: 'connector.google-search-console.enabled',
    enabled: true,
    description: 'Enable Google Search Console connector',
  },
  'connector.google-business-profile.enabled': {
    key: 'connector.google-business-profile.enabled',
    enabled: true,
    description: 'Enable Google Business Profile connector',
  },
  'connector.openai.enabled': {
    key: 'connector.openai.enabled',
    enabled: true,
    description: 'Enable OpenAI connector',
  },

  // Runtime features
  'runtime.execution.enabled': {
    key: 'runtime.execution.enabled',
    enabled: true,
    description: 'Enable runtime execution',
  },
  'runtime.tasks.enabled': {
    key: 'runtime.tasks.enabled',
    enabled: true,
    description: 'Enable runtime tasks',
  },
  'runtime.command-center.enabled': {
    key: 'runtime.command-center.enabled',
    enabled: true,
    description: 'Enable command center',
  },

  // Dashboard features
  'dashboard.rankings.enabled': {
    key: 'dashboard.rankings.enabled',
    enabled: true,
    description: 'Enable rankings dashboard',
  },
  'dashboard.reports.enabled': {
    key: 'dashboard.reports.enabled',
    enabled: true,
    description: 'Enable reports dashboard',
  },
  'dashboard.agents.enabled': {
    key: 'dashboard.agents.enabled',
    enabled: true,
    description: 'Enable agents dashboard',
  },
  'dashboard.command-center.enabled': {
    key: 'dashboard.command-center.enabled',
    enabled: true,
    description: 'Enable command center dashboard',
  },
};

/**
 * In-memory tenant overrides (for single-instance deployment)
 * For production, this should be stored in database
 */
const tenantOverrides = new Map<string, Map<string, boolean>>();

/**
 * Get feature flag value
 */
export function getFeatureFlag(key: string, tenantId?: string): boolean {
  // Check tenant override first
  if (tenantId) {
    const overrides = tenantOverrides.get(tenantId);
    if (overrides && overrides.has(key)) {
      return overrides.get(key)!;
    }
  }

  // Check environment variable override
  const envValue = process.env[`FEATURE_FLAG_${key.toUpperCase().replace(/\./g, '_')}`];
  if (envValue !== undefined) {
    return envValue === 'true' || envValue === '1';
  }

  // Check default flag
  const flag = DEFAULT_FLAGS[key];
  return flag?.enabled ?? false;
}

/**
 * Check if feature flag is enabled
 */
export function isFeatureEnabled(key: string, tenantId?: string): boolean {
  return getFeatureFlag(key, tenantId);
}

/**
 * Set tenant override for feature flag
 */
export function setTenantOverride(tenantId: string, flagKey: string, enabled: boolean): void {
  if (!tenantOverrides.has(tenantId)) {
    tenantOverrides.set(tenantId, new Map());
  }
  tenantOverrides.get(tenantId)!.set(flagKey, enabled);
}

/**
 * Clear tenant override for feature flag
 */
export function clearTenantOverride(tenantId: string, flagKey: string): void {
  const overrides = tenantOverrides.get(tenantId);
  if (overrides) {
    overrides.delete(flagKey);
  }
}

/**
 * Clear all tenant overrides
 */
export function clearAllTenantOverrides(tenantId: string): void {
  tenantOverrides.delete(tenantId);
}

/**
 * Get all feature flags
 */
export function getAllFeatureFlags(): Record<string, FeatureFlag> {
  return { ...DEFAULT_FLAGS };
}

/**
 * Get feature flag definition
 */
export function getFeatureFlagDefinition(key: string): FeatureFlag | null {
  return DEFAULT_FLAGS[key] || null;
}

/**
 * Enable feature flag (runtime override)
 */
export function enableFeatureFlag(key: string): void {
  if (DEFAULT_FLAGS[key]) {
    DEFAULT_FLAGS[key] = { ...DEFAULT_FLAGS[key], enabled: true };
  }
}

/**
 * Disable feature flag (runtime override)
 */
export function disableFeatureFlag(key: string): void {
  if (DEFAULT_FLAGS[key]) {
    DEFAULT_FLAGS[key] = { ...DEFAULT_FLAGS[key], enabled: false };
  }
}

/**
 * Agent feature flag helpers
 */
export const AgentFlags = {
  isAriaEnabled: (tenantId?: string) => isFeatureEnabled('agent.aria.enabled', tenantId),
  isScribeEnabled: (tenantId?: string) => isFeatureEnabled('agent.scribe.enabled', tenantId),
  isPublishEnabled: (tenantId?: string) => isFeatureEnabled('agent.publish.enabled', tenantId),
  isPulseEnabled: (tenantId?: string) => isFeatureEnabled('agent.pulse.enabled', tenantId),
  isLoclEnabled: (tenantId?: string) => isFeatureEnabled('agent.locl.enabled', tenantId),
  isReputeEnabled: (tenantId?: string) => isFeatureEnabled('agent.repute.enabled', tenantId),
  isLinxEnabled: (tenantId?: string) => isFeatureEnabled('agent.linx.enabled', tenantId),
  isPrismEnabled: (tenantId?: string) => isFeatureEnabled('agent.prism.enabled', tenantId),
  isCoreEnabled: (tenantId?: string) => isFeatureEnabled('agent.core.enabled', tenantId),
};

/**
 * Connector feature flag helpers
 */
export const ConnectorFlags = {
  isDataForSEOEnabled: (tenantId?: string) => isFeatureEnabled('connector.dataforseo.enabled', tenantId),
  isSerpAPIEnabled: (tenantId?: string) => isFeatureEnabled('connector.serpapi.enabled', tenantId),
  isScreamingFrogEnabled: (tenantId?: string) => isFeatureEnabled('connector.screaming-frog.enabled', tenantId),
  isGoogleAnalyticsEnabled: (tenantId?: string) => isFeatureEnabled('connector.google-analytics.enabled', tenantId),
  isGoogleSearchConsoleEnabled: (tenantId?: string) => isFeatureEnabled('connector.google-search-console.enabled', tenantId),
  isGoogleBusinessProfileEnabled: (tenantId?: string) => isFeatureEnabled('connector.google-business-profile.enabled', tenantId),
  isOpenAIEnabled: (tenantId?: string) => isFeatureEnabled('connector.openai.enabled', tenantId),
};

/**
 * Runtime feature flag helpers
 */
export const RuntimeFlags = {
  isExecutionEnabled: (tenantId?: string) => isFeatureEnabled('runtime.execution.enabled', tenantId),
  isTasksEnabled: (tenantId?: string) => isFeatureEnabled('runtime.tasks.enabled', tenantId),
  isCommandCenterEnabled: (tenantId?: string) => isFeatureEnabled('runtime.command-center.enabled', tenantId),
};

/**
 * Dashboard feature flag helpers
 */
export const DashboardFlags = {
  isRankingsEnabled: (tenantId?: string) => isFeatureEnabled('dashboard.rankings.enabled', tenantId),
  isReportsEnabled: (tenantId?: string) => isFeatureEnabled('dashboard.reports.enabled', tenantId),
  isAgentsEnabled: (tenantId?: string) => isFeatureEnabled('dashboard.agents.enabled', tenantId),
  isCommandCenterEnabled: (tenantId?: string) => isFeatureEnabled('dashboard.command-center.enabled', tenantId),
};
