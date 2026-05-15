/**
 * CLAUX Runtime Isolation Layer - Facade
 */

import { TenantBoundaryManager } from './tenant-boundaries';
import { NamespaceIsolationManager } from './namespace-isolation';
import { ResourceIsolationManager } from './resource-isolation';
import { QuotaEnforcementManager } from './quota-enforcement';
import { SchedulingFairnessManager } from './scheduling-fairness';
import { CrossTenantProtectionManager } from './cross-tenant-protection';
import { TenantReplayManager } from './tenant-replay';
import { TenantCheckpointManager } from './tenant-checkpoints';
import { TenantMetricsManager } from './tenant-metrics';

/**
 * Isolation Facade
 */
export class IsolationFacade {
  readonly boundaries: TenantBoundaryManager;
  readonly namespaces: NamespaceIsolationManager;
  readonly resources: ResourceIsolationManager;
  readonly quotas: QuotaEnforcementManager;
  readonly fairness: SchedulingFairnessManager;
  readonly protection: CrossTenantProtectionManager;
  readonly replay: TenantReplayManager;
  readonly checkpoints: TenantCheckpointManager;
  readonly metrics: TenantMetricsManager;

  constructor() {
    this.boundaries = new TenantBoundaryManager();
    this.namespaces = new NamespaceIsolationManager();
    this.resources = new ResourceIsolationManager();
    this.quotas = new QuotaEnforcementManager();
    this.fairness = new SchedulingFairnessManager();
    this.protection = new CrossTenantProtectionManager();
    this.replay = new TenantReplayManager();
    this.checkpoints = new TenantCheckpointManager();
    this.metrics = new TenantMetricsManager();
  }
}
