/**
 * CLAUX Runtime Distributed Layer - Constants
 * 
 * Configuration constants for distributed runtime coordination.
 * No external dependencies - pure distributed semantics.
 */

/**
 * Default heartbeat interval in milliseconds
 */
export const DEFAULT_HEARTBEAT_INTERVAL_MS = 5000;

/**
 * Default heartbeat timeout in milliseconds
 */
export const DEFAULT_HEARTBEAT_TIMEOUT_MS = 15000;

/**
 * Default lease duration in milliseconds
 */
export const DEFAULT_LEASE_DURATION_MS = 30000;

/**
 * Default lease renewal interval in milliseconds
 */
export const DEFAULT_LEASE_RENEWAL_INTERVAL_MS = 20000;

/**
 * Default lease grace period in milliseconds
 */
export const DEFAULT_LEASE_GRACE_PERIOD_MS = 5000;

/**
 * Default failover timeout in milliseconds
 */
export const DEFAULT_FAILOVER_TIMEOUT_MS = 30000;

/**
 * Default partition count
 */
export const DEFAULT_PARTITION_COUNT = 32;

/**
 * Default cluster size
 */
export const DEFAULT_CLUSTER_SIZE = 10;

/**
 * Default rebalance interval in milliseconds
 */
export const DEFAULT_REBALANCE_INTERVAL_MS = 60000;

/**
 * Default consensus timeout in milliseconds
 */
export const DEFAULT_CONSENSUS_TIMEOUT_MS = 10000;

/**
 * Default drain timeout in milliseconds
 */
export const DEFAULT_DRAIN_TIMEOUT_MS = 120000;

/**
 * Default worker join timeout in milliseconds
 */
export const DEFAULT_WORKER_JOIN_TIMEOUT_MS = 30000;

/**
 * Maximum lease renewals
 */
export const MAX_LEASE_RENEWALS = 1000;

/**
 * Maximum partition assignments per worker
 */
export const MAX_PARTITIONS_PER_WORKER = 16;

/**
 * Maximum executions per worker
 */
export const MAX_EXECUTIONS_PER_WORKER = 100;

/**
 * Maximum concurrent failovers
 */
export const MAX_CONCURRENT_FAILOVERS = 10;

/**
 * Minimum cluster size for stability
 */
export const MIN_CLUSTER_SIZE = 3;

/**
 * Maximum cluster size
 */
export const MAX_CLUSTER_SIZE = 100;

/**
 * Resource utilization thresholds
 */
export const RESOURCE_UTILIZATION_THRESHOLDS = {
  HEALTHY: 0.7,
  DEGRADED: 0.85,
  UNHEALTHY: 0.95,
} as const;

/**
 * CPU utilization thresholds
 */
export const CPU_UTILIZATION_THRESHOLDS = {
  HEALTHY: 0.7,
  DEGRADED: 0.85,
  UNHEALTHY: 0.95,
} as const;

/**
 * Memory utilization thresholds
 */
export const MEMORY_UTILIZATION_THRESHOLDS = {
  HEALTHY: 0.7,
  DEGRADED: 0.85,
  UNHEALTHY: 0.95,
} as const;

/**
 * Concurrency utilization thresholds
 */
export const CONCURRENCY_UTILIZATION_THRESHOLDS = {
  HEALTHY: 0.7,
  DEGRADED: 0.85,
  UNHEALTHY: 0.95,
} as const;

/**
 * Heartbeat jitter percentage
 */
export const HEARTBEAT_JITTER_PERCENTAGE = 0.1;

/**
 * Lease jitter percentage
 */
export const LEASE_JITTER_PERCENTAGE = 0.05;

/**
 * Consensus quorum percentage
 */
export const CONSENSUS_QUORUM_PERCENTAGE = 0.51;

/**
 * Leader election timeout in milliseconds
 */
export const LEADER_ELECTION_TIMEOUT_MS = 30000;

/**
 * Leader heartbeat interval in milliseconds
 */
export const LEADER_HEARTBEAT_INTERVAL_MS = 5000;

/**
 * Partition rebalance threshold
 */
export const PARTITION_REBALANCE_THRESHOLD = 0.2;

/**
 * Execution migration timeout in milliseconds
 */
export const EXECUTION_MIGRATION_TIMEOUT_MS = 60000;

/**
 * Checkpoint preservation timeout in milliseconds
 */
export const CHECKPOINT_PRESERVATION_TIMEOUT_MS = 30000;

/**
 * Replay migration timeout in milliseconds
 */
export const REPLAY_MIGRATION_TIMEOUT_MS = 60000;

/**
 * Worker capability matching strictness
 */
export const CAPABILITY_MATCHING_STRICTNESS = {
  EXACT: 'exact',
  MINIMUM: 'minimum',
  PREFERRED: 'preferred',
} as const;

/**
 * Load balancing weights
 */
export const LOAD_BALANCING_WEIGHTS = {
  CPU: 0.3,
  MEMORY: 0.3,
  CONCURRENCY: 0.2,
  LOCALITY: 0.1,
  CAPABILITY: 0.1,
} as const;

/**
 * Cluster stability threshold
 */
export const CLUSTER_STABILITY_THRESHOLD = 0.9;

/**
 * Cluster recovery timeout in milliseconds
 */
export const CLUSTER_RECOVERY_TIMEOUT_MS = 120000;

/**
 * Partition assignment timeout in milliseconds
 */
export const PARTITION_ASSIGNMENT_TIMEOUT_MS = 30000;

/**
 * Ownership transfer timeout in milliseconds
 */
export const OWNERSHIP_TRANSFER_TIMEOUT_MS = 30000;

/**
 * Epoch increment value
 */
export const EPOCH_INCREMENT = 1;

/**
 * Initial epoch value
 */
export const INITIAL_EPOCH = 1;

/**
 * Maximum epoch value before rollover
 */
export const MAX_EPOCH = Number.MAX_SAFE_INTEGER;

/**
 * Default retry interval for distributed operations
 */
export const DEFAULT_RETRY_INTERVAL_MS = 1000;

/**
 * Maximum retry attempts for distributed operations
 */
export const MAX_RETRY_ATTEMPTS = 3;

/**
 * Retry backoff multiplier
 */
export const RETRY_BACKOFF_MULTIPLIER = 2;

/**
 * Retry jitter percentage
 */
export const RETRY_JITTER_PERCENTAGE = 0.1;
