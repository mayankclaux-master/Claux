/**
 * Integration Feature Flags
 * 
 * Phase Z5 - Real Execution Cutover
 * Per-agent flags for safe incremental migration to integration mesh dispatcher.
 */

export interface IntegrationFeatureFlags {
  useIntegrationMesh: boolean;
  fallbackToDirectProvider: boolean;
  enableCallbackContinuation: boolean;
}

export interface AgentFeatureFlags {
  aria: IntegrationFeatureFlags;
  scribe: IntegrationFeatureFlags;
  locl: IntegrationFeatureFlags;
  linx: IntegrationFeatureFlags;
  repute: IntegrationFeatureFlags;
  ampli: IntegrationFeatureFlags;
  prism: IntegrationFeatureFlags;
  pulse: IntegrationFeatureFlags;
}

// Default flags - all disabled for safety
const defaultFlags: IntegrationFeatureFlags = {
  useIntegrationMesh: false,
  fallbackToDirectProvider: true,
  enableCallbackContinuation: false,
};

// Phase Z5: Dispatch execution flags for Wave 1 agents (PRISM, PULSE, REPUTE)
export const ENABLE_PRISM_DISPATCH_EXECUTION = process.env.ENABLE_PRISM_DISPATCH_EXECUTION === 'true';
export const ENABLE_PULSE_DISPATCH_EXECUTION = process.env.ENABLE_PULSE_DISPATCH_EXECUTION === 'true';
export const ENABLE_REPUTE_DISPATCH_EXECUTION = process.env.ENABLE_REPUTE_DISPATCH_EXECUTION === 'true';

// Phase Z5 Wave 2: Dispatch execution flags for ARIA, LINX, LOCL
export const ENABLE_ARIA_DISPATCH_EXECUTION = process.env.ENABLE_ARIA_DISPATCH_EXECUTION === 'true';
export const ENABLE_LINX_DISPATCH_EXECUTION = process.env.ENABLE_LINX_DISPATCH_EXECUTION === 'true';
export const ENABLE_LOCL_DISPATCH_EXECUTION = process.env.ENABLE_LOCL_DISPATCH_EXECUTION === 'true';

// Phase Z5 Wave 3: Dispatch execution flags for SCRIBE, AMPLI
export const ENABLE_SCRIBE_DISPATCH_EXECUTION = process.env.ENABLE_SCRIBE_DISPATCH_EXECUTION === 'true';
export const ENABLE_AMPLI_DISPATCH_EXECUTION = process.env.ENABLE_AMPLI_DISPATCH_EXECUTION === 'true';

// Tenant-specific feature flags (can be overridden per tenant)
export const getAgentFeatureFlags = (tenantId: string): AgentFeatureFlags => {
  // TODO: Load from database or environment variables
  // For now, return default flags with Phase Z5 dispatch execution flags
  
  return {
    aria: { 
      ...defaultFlags, 
      useIntegrationMesh: ENABLE_ARIA_DISPATCH_EXECUTION,
      enableCallbackContinuation: ENABLE_ARIA_DISPATCH_EXECUTION,
    },
    scribe: { 
      ...defaultFlags, 
      useIntegrationMesh: ENABLE_SCRIBE_DISPATCH_EXECUTION,
      enableCallbackContinuation: ENABLE_SCRIBE_DISPATCH_EXECUTION,
    },
    locl: { 
      ...defaultFlags, 
      useIntegrationMesh: ENABLE_LOCL_DISPATCH_EXECUTION,
      enableCallbackContinuation: ENABLE_LOCL_DISPATCH_EXECUTION,
    },
    linx: { 
      ...defaultFlags, 
      useIntegrationMesh: ENABLE_LINX_DISPATCH_EXECUTION,
      enableCallbackContinuation: ENABLE_LINX_DISPATCH_EXECUTION,
    },
    repute: { 
      ...defaultFlags, 
      useIntegrationMesh: ENABLE_REPUTE_DISPATCH_EXECUTION,
      enableCallbackContinuation: ENABLE_REPUTE_DISPATCH_EXECUTION,
    },
    ampli: { 
      ...defaultFlags, 
      useIntegrationMesh: ENABLE_AMPLI_DISPATCH_EXECUTION,
      enableCallbackContinuation: ENABLE_AMPLI_DISPATCH_EXECUTION,
    },
    prism: { 
      ...defaultFlags, 
      useIntegrationMesh: ENABLE_PRISM_DISPATCH_EXECUTION,
      enableCallbackContinuation: ENABLE_PRISM_DISPATCH_EXECUTION,
    },
    pulse: { 
      ...defaultFlags, 
      useIntegrationMesh: ENABLE_PULSE_DISPATCH_EXECUTION,
      enableCallbackContinuation: ENABLE_PULSE_DISPATCH_EXECUTION,
    },
  };
};

// Check if agent should use integration mesh
export const shouldUseIntegrationMesh = (tenantId: string, agentName: string): boolean => {
  const flags = getAgentFeatureFlags(tenantId);
  const agentFlags = flags[agentName.toLowerCase() as keyof AgentFeatureFlags];
  return agentFlags?.useIntegrationMesh || false;
};

// Check if agent should fallback to direct provider
export const shouldFallbackToDirectProvider = (tenantId: string, agentName: string): boolean => {
  const flags = getAgentFeatureFlags(tenantId);
  const agentFlags = flags[agentName.toLowerCase() as keyof AgentFeatureFlags];
  return agentFlags?.fallbackToDirectProvider || false;
};

// Check if callback continuation is enabled
export const isCallbackContinuationEnabled = (tenantId: string, agentName: string): boolean => {
  const flags = getAgentFeatureFlags(tenantId);
  const agentFlags = flags[agentName.toLowerCase() as keyof AgentFeatureFlags];
  return agentFlags?.enableCallbackContinuation || false;
};

// Enable integration mesh for a specific agent and tenant
export const enableIntegrationMeshForAgent = (tenantId: string, agentName: string): void => {
  // TODO: Persist to database
  console.log(`[Feature Flag] Enabling integration mesh for ${agentName} in tenant ${tenantId}`);
};

// Disable integration mesh for a specific agent and tenant
export const disableIntegrationMeshForAgent = (tenantId: string, agentName: string): void => {
  // TODO: Persist to database
  console.log(`[Feature Flag] Disabling integration mesh for ${agentName} in tenant ${tenantId}`);
};

// Enable callback continuation for a specific agent and tenant
export const enableCallbackContinuationForAgent = (tenantId: string, agentName: string): void => {
  // TODO: Persist to database
  console.log(`[Feature Flag] Enabling callback continuation for ${agentName} in tenant ${tenantId}`);
};

// Phase Z5: Check if agent dispatch execution is enabled
export const isDispatchExecutionEnabled = (agentName: string): boolean => {
  switch (agentName.toLowerCase()) {
    case 'prism':
      return ENABLE_PRISM_DISPATCH_EXECUTION;
    case 'pulse':
      return ENABLE_PULSE_DISPATCH_EXECUTION;
    case 'repute':
      return ENABLE_REPUTE_DISPATCH_EXECUTION;
    case 'aria':
      return ENABLE_ARIA_DISPATCH_EXECUTION;
    case 'linx':
      return ENABLE_LINX_DISPATCH_EXECUTION;
    case 'locl':
      return ENABLE_LOCL_DISPATCH_EXECUTION;
    case 'scribe':
      return ENABLE_SCRIBE_DISPATCH_EXECUTION;
    case 'ampli':
      return ENABLE_AMPLI_DISPATCH_EXECUTION;
    default:
      return false;
  }
};
