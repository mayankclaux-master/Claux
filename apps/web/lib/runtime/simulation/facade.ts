/**
 * CLAUX Runtime Simulation Layer - Facade
 */

import { DryRunManager } from './dry-run';
import { DeterministicSimulationManager } from './deterministic-simulation';
import { ReplaySimulationManager } from './replay-simulation';
import { PolicySimulationManager } from './policy-simulation';
import { ResourceSimulationManager } from './resource-simulation';
import { FaultInjectionManager } from './fault-injection';
import { TimeTravelManager } from './time-travel';
import { SyntheticGraphManager } from './synthetic-graphs';

/**
 * Simulation Facade
 */
export class SimulationFacade {
  readonly dryRun: DryRunManager;
  readonly deterministic: DeterministicSimulationManager;
  readonly replay: ReplaySimulationManager;
  readonly policy: PolicySimulationManager;
  readonly resources: ResourceSimulationManager;
  readonly faults: FaultInjectionManager;
  readonly timeTravel: TimeTravelManager;
  readonly synthetic: SyntheticGraphManager;

  constructor() {
    this.dryRun = new DryRunManager();
    this.deterministic = new DeterministicSimulationManager();
    this.replay = new ReplaySimulationManager();
    this.policy = new PolicySimulationManager();
    this.resources = new ResourceSimulationManager();
    this.faults = new FaultInjectionManager();
    this.timeTravel = new TimeTravelManager();
    this.synthetic = new SyntheticGraphManager();
  }
}
