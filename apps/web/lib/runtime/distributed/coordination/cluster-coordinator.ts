/**
 * CLAUX Runtime Distributed Layer - Cluster Coordinator
 * 
 * Coordinates cluster-wide operations and state.
 * No external dependencies - pure coordination semantics.
 */

import type { ClusterId, WorkerId, ClusterInfo, ClusterRole, ClusterMetadata, PartitionId, ClusterTopology } from '../types';
import { ClusterMembershipState } from '../types';
import { DEFAULT_CLUSTER_SIZE, MIN_CLUSTER_SIZE, CLUSTER_STABILITY_THRESHOLD } from '../constants';
import { ClusterFormationError, ClusterNotFoundError, LeaderElectionError } from '../errors';

/**
 * Cluster Coordinator Configuration
 */
export interface ClusterCoordinatorConfig {
  readonly clusterId: ClusterId;
  readonly expectedSize: number;
  readonly stabilityThreshold: number;
  readonly leaderElectionTimeoutMs: number;
}

/**
 * Cluster Coordinator
 * 
 * Coordinates cluster-wide operations including formation, stability monitoring, and leader coordination.
 */
export class ClusterCoordinator {
  private config: ClusterCoordinatorConfig;
  private clusterInfo: ClusterInfo;
  private pendingJoins: Set<WorkerId> = new Set();
  private pendingLeaves: Set<WorkerId> = new Set();

  constructor(config: Partial<ClusterCoordinatorConfig> = {}) {
    this.config = {
      clusterId: config.clusterId || 'default',
      expectedSize: config.expectedSize || DEFAULT_CLUSTER_SIZE,
      stabilityThreshold: config.stabilityThreshold || CLUSTER_STABILITY_THRESHOLD,
      leaderElectionTimeoutMs: config.leaderElectionTimeoutMs || 30000,
    };

    this.clusterInfo = this.initializeCluster();
  }

  /**
   * Initialize cluster
   */
  private initializeCluster(): ClusterInfo {
    return {
      metadata: {
        clusterId: this.config.clusterId,
        formationTime: new Date(),
        expectedSize: this.config.expectedSize,
        actualSize: 0,
      },
      state: ClusterMembershipState.FORMING,
      members: [],
      partitions: [],
      topology: {
        nodes: [],
        edges: [],
      },
    };
  }

  /**
   * Join cluster
   */
  async joinCluster(workerId: WorkerId): Promise<void> {
    if (this.clusterInfo.members.includes(workerId)) {
      throw new Error(`Worker ${workerId} is already a member of the cluster`);
    }

    this.pendingJoins.add(workerId);
    await this.evaluateClusterState();
  }

  /**
   * Leave cluster
   */
  async leaveCluster(workerId: WorkerId): Promise<void> {
    if (!this.clusterInfo.members.includes(workerId)) {
      throw new Error(`Worker ${workerId} is not a member of the cluster`);
    }

    this.pendingLeaves.add(workerId);
    await this.evaluateClusterState();
  }

  /**
   * Get cluster info
   */
  getClusterInfo(): ClusterInfo {
    return { ...this.clusterInfo };
  }

  /**
   * Get cluster members
   */
  getMembers(): readonly WorkerId[] {
    return [...this.clusterInfo.members];
  }

  /**
   * Get cluster leader
   */
  getLeader(): WorkerId | undefined {
    return this.clusterInfo.leader;
  }

  /**
   * Get cluster state
   */
  getClusterState(): ClusterMembershipState {
    return this.clusterInfo.state;
  }

  /**
   * Check if cluster is stable
   */
  isStable(): boolean {
    if (this.clusterInfo.state !== ClusterMembershipState.STABLE) {
      return false;
    }

    const actualSize = this.clusterInfo.members.length;
    const expectedSize = this.config.expectedSize;
    const sizeRatio = actualSize / expectedSize;

    return sizeRatio >= this.config.stabilityThreshold;
  }

  /**
   * Check if cluster can accept new members
   */
  canAcceptMembers(): boolean {
    return this.clusterInfo.members.length < this.config.expectedSize;
  }

  /**
   * Evaluate cluster state
   */
  private async evaluateClusterState(): Promise<void> {
    // Process pending joins
    for (const workerId of this.pendingJoins) {
      this.clusterInfo.members.push(workerId);
      this.clusterInfo.metadata.actualSize = this.clusterInfo.members.length;
      this.pendingJoins.delete(workerId);
    }

    // Process pending leaves
    for (const workerId of this.pendingLeaves) {
      const index = this.clusterInfo.members.indexOf(workerId);
      if (index !== -1) {
        this.clusterInfo.members.splice(index, 1);
        this.clusterInfo.metadata.actualSize = this.clusterInfo.members.length;

        // If leader left, trigger re-election
        if (this.clusterInfo.leader === workerId) {
          this.clusterInfo.leader = undefined;
        }
      }
      this.pendingLeaves.delete(workerId);
    }

    // Update cluster state based on membership
    await this.updateClusterState();
  }

  /**
   * Update cluster state
   */
  private async updateClusterState(): Promise<void> {
    const memberCount = this.clusterInfo.members.length;

    if (memberCount < MIN_CLUSTER_SIZE) {
      this.clusterInfo.state = ClusterMembershipState.FORMING;
    } else if (memberCount >= this.config.expectedSize) {
      this.clusterInfo.state = ClusterMembershipState.STABLE;
      // Elect leader if none
      if (!this.clusterInfo.leader) {
        await this.electLeader();
      }
    } else {
      this.clusterInfo.state = ClusterMembershipState.DEGRADED;
    }
  }

  /**
   * Elect cluster leader
   */
  private async electLeader(): Promise<void> {
    if (this.clusterInfo.members.length === 0) {
      throw new LeaderElectionError('Cannot elect leader with no members', this.config.clusterId);
    }

    // Simple leader election: first member becomes leader
    // In production, this would use a proper consensus algorithm
    this.clusterInfo.leader = this.clusterInfo.members[0];
  }

  /**
   * Update topology
   */
  updateTopology(topology: ClusterInfo['topology']): void {
    this.clusterInfo.topology = topology;
  }

  /**
   * Get topology
   */
  getTopology(): ClusterInfo['topology'] {
    return { ...this.clusterInfo.topology };
  }

  /**
   * Set cluster state
   */
  setClusterState(state: ClusterMembershipState): void {
    this.clusterInfo.state = state;
  }

  /**
   * Force leader election
   */
  async forceLeaderElection(): Promise<WorkerId> {
    await this.electLeader();
    return this.clusterInfo.leader!;
  }

  /**
   * Validate cluster formation
   */
  validateFormation(): boolean {
    return this.clusterInfo.members.length >= MIN_CLUSTER_SIZE;
  }

  /**
   * Get cluster statistics
   */
  getStatistics(): {
    memberCount: number;
    leader: WorkerId | undefined;
    state: ClusterMembershipState;
    stability: number;
    formationTime: Date;
  } {
    const sizeRatio = this.clusterInfo.members.length / this.config.expectedSize;
    const stability = Math.min(sizeRatio, 1.0);

    return {
      memberCount: this.clusterInfo.members.length,
      leader: this.clusterInfo.leader,
      state: this.clusterInfo.state,
      stability,
      formationTime: this.clusterInfo.metadata.formationTime,
    };
  }

  /**
   * Reset cluster
   */
  reset(): void {
    this.clusterInfo = this.initializeCluster();
    this.pendingJoins.clear();
    this.pendingLeaves.clear();
  }

  /**
   * Get configuration
   */
  getConfig(): ClusterCoordinatorConfig {
    return { ...this.config };
  }

  /**
   * Set configuration
   */
  setConfig(config: Partial<ClusterCoordinatorConfig>): void {
    this.config = { ...this.config, ...config };
  }
}
