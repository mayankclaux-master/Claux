/**
 * CLAUX Runtime Persistence Layer - Facade
 */

import { StateDurabilityManager } from './state-durability';
// Distributed and temporal persistence removed in Phase 2A.2 - V1 prohibits distributed systems
// import { DistributedSnapshotManager } from './distributed-snapshots';
import { ReplayPersistenceManager } from './replay-persistence';
// import { TemporalArchivalManager } from './temporal-archival';
import { ColdStorageManager } from './cold-storage';
import { RetentionPoliciesManager } from './retention-policies';
import { TieredStorageManager } from './tiered-storage';

/**
 * Persistence Facade
 */
export class PersistenceFacade {
  readonly state: StateDurabilityManager;
  // readonly snapshots: DistributedSnapshotManager;
  readonly replay: ReplayPersistenceManager;
  // readonly archival: TemporalArchivalManager;
  readonly coldStorage: ColdStorageManager;
  readonly retention: RetentionPoliciesManager;
  readonly tiered: TieredStorageManager;

  constructor() {
    this.state = new StateDurabilityManager();
    // this.snapshots = new DistributedSnapshotManager();
    this.replay = new ReplayPersistenceManager();
    // this.archival = new TemporalArchivalManager();
    this.coldStorage = new ColdStorageManager();
    this.retention = new RetentionPoliciesManager();
    this.tiered = new TieredStorageManager();
  }
}
