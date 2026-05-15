/**
 * CLAUX Runtime Governance Layer - Facade
 */

import { PolicyEngine } from './policy-engine';
import { TenantPolicyManager } from './tenant-policy';
import { RateLimitManager } from './rate-limiting';
import { CostGovernanceManager } from './cost-governance';
import { ResourceQuotaManager } from './resource-quotas';
import { CompliancePolicyManager } from './compliance-policies';
import { AuditPolicyManager } from './audit-policies';
import { PolicyInheritanceManager } from './policy-inheritance';

/**
 * Governance Facade
 */
export class GovernanceFacade {
  readonly policyEngine: PolicyEngine;
  readonly tenantPolicy: TenantPolicyManager;
  readonly rateLimiting: RateLimitManager;
  readonly costGovernance: CostGovernanceManager;
  readonly resourceQuotas: ResourceQuotaManager;
  readonly compliance: CompliancePolicyManager;
  readonly audit: AuditPolicyManager;
  readonly inheritance: PolicyInheritanceManager;

  constructor() {
    this.policyEngine = new PolicyEngine();
    this.tenantPolicy = new TenantPolicyManager();
    this.rateLimiting = new RateLimitManager();
    this.costGovernance = new CostGovernanceManager();
    this.resourceQuotas = new ResourceQuotaManager();
    this.compliance = new CompliancePolicyManager();
    this.audit = new AuditPolicyManager();
    this.inheritance = new PolicyInheritanceManager();
  }
}
