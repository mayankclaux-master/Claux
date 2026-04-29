// RPC Return Types for Phase 5 Integration

export type BootstrapTenantResult = {
  status: 'created' | 'already_exists';
  tenant_id: string;
  provisioning_status?: string;
};

export type CompleteOnboardingResult = {
  success: boolean;
  tenant_id: string;
  business_profile_id?: string;
};

export type AgentUpdateResult = {
  success: boolean;
  agent: string;
  status?: string;
  updated_at?: string;
};
