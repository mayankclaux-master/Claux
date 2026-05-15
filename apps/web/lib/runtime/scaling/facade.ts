/**
 * CLAUX Runtime Scaling Layer - Facade
 */

import { PredictiveScalingManager } from './predictive-scaling';
import { QueueScalingManager } from './queue-scaling';
import { ResourceAwareSchedulingManager } from './resource-aware-scheduling';
import { WorkerAffinityManager } from './worker-affinity';
import { WorkloadBalancingManager } from './workload-balancing';
import { DynamicConcurrencyManager } from './dynamic-concurrency';
import { BackpressurePropagationManager } from './backpressure-propagation';
import { RuntimeElasticityManager } from './runtime-elasticity';
import { ScalePoliciesManager } from './scale-policies';
import { ScaleStabilizationManager } from './scale-stabilization';

/**
 * Scaling Facade
 */
export class ScalingFacade {
  readonly predictive: PredictiveScalingManager;
  readonly queue: QueueScalingManager;
  readonly scheduling: ResourceAwareSchedulingManager;
  readonly affinity: WorkerAffinityManager;
  readonly balancing: WorkloadBalancingManager;
  readonly concurrency: DynamicConcurrencyManager;
  readonly backpressure: BackpressurePropagationManager;
  readonly elasticity: RuntimeElasticityManager;
  readonly policies: ScalePoliciesManager;
  readonly stabilization: ScaleStabilizationManager;

  constructor() {
    this.predictive = new PredictiveScalingManager();
    this.queue = new QueueScalingManager();
    this.scheduling = new ResourceAwareSchedulingManager();
    this.affinity = new WorkerAffinityManager();
    this.balancing = new WorkloadBalancingManager();
    this.concurrency = new DynamicConcurrencyManager();
    this.backpressure = new BackpressurePropagationManager();
    this.elasticity = new RuntimeElasticityManager();
    this.policies = new ScalePoliciesManager();
    this.stabilization = new ScaleStabilizationManager();
  }
}
