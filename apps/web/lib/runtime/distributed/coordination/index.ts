/**
 * CLAUX Runtime Distributed Layer - Coordination Module
 * 
 * Coordination engines for distributed runtime operations.
 * No external dependencies - pure coordination semantics.
 */

export { ClusterCoordinator, type ClusterCoordinatorConfig } from './cluster-coordinator';
export { LeaderCoordinator, type LeaderCoordinatorConfig } from './leader-coordinator';
export { PartitionCoordinator, type PartitionCoordinatorConfig } from './partition-coordinator';
export { OwnershipCoordinator, type OwnershipCoordinatorConfig } from './ownership-coordinator';
export { FailoverCoordinator, type FailoverCoordinatorConfig } from './failover-coordinator';
export { LeaseCoordinator, type LeaseCoordinatorConfig } from './lease-coordinator';
