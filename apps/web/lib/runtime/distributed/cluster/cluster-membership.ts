/**
 * CLAUX Runtime Distributed Layer - Cluster Membership
 * 
 * Manages cluster membership and node lifecycle.
 * No external dependencies - pure membership semantics.
 */

import type { WorkerId, ClusterId, ClusterMembershipState, ClusterRole } from '../types';
import { ClusterMembershipState as ClusterMembershipStateEnum, ClusterRole as ClusterRoleEnum } from '../types';
import { MIN_CLUSTER_SIZE } from '../constants';
import { ClusterMembershipError } from '../errors';

/**
 * Cluster Membership Manager
 * 
 * Manages cluster membership and node lifecycle.
 */
export class ClusterMembershipManager {
  private members: Map<WorkerId, ClusterMember> = new Map();
  private pendingJoins: Set<WorkerId> = new Set();
  private pendingLeaves: Set<WorkerId> = new Set();
  private clusterId: ClusterId;
  private state: ClusterMembershipState;

  constructor(clusterId: ClusterId) {
    this.clusterId = clusterId;
    this.state = ClusterMembershipStateEnum.FORMING;
  }

  /**
   * Request worker join
   */
  async requestJoin(workerId: WorkerId): Promise<void> {
    if (this.members.has(workerId)) {
      throw new ClusterMembershipError(`Worker ${workerId} is already a member`, this.clusterId);
    }

    if (this.pendingJoins.has(workerId)) {
      throw new ClusterMembershipError(`Worker ${workerId} is already pending join`, this.clusterId);
    }

    this.pendingJoins.add(workerId);
  }

  /**
   * Complete worker join
   */
  completeJoin(workerId: WorkerId, role: ClusterRole = ClusterRoleEnum.FOLLOWER): void {
    if (!this.pendingJoins.has(workerId)) {
      throw new ClusterMembershipError(`Worker ${workerId} is not pending join`, this.clusterId);
    }

    const member: ClusterMember = {
      workerId,
      clusterId: this.clusterId,
      role,
      joinedAt: new Date(),
      status: 'active',
      lastSeen: new Date(),
    };

    this.members.set(workerId, member);
    this.pendingJoins.delete(workerId);

    this.updateClusterState();
  }

  /**
   * Request worker leave
   */
  async requestLeave(workerId: WorkerId): Promise<void> {
    if (!this.members.has(workerId)) {
      throw new ClusterMembershipError(`Worker ${workerId} is not a member`, this.clusterId);
    }

    if (this.pendingLeaves.has(workerId)) {
      throw new ClusterMembershipError(`Worker ${workerId} is already pending leave`, this.clusterId);
    }

    this.pendingLeaves.add(workerId);
  }

  /**
   * Complete worker leave
   */
  completeLeave(workerId: WorkerId): void {
    if (!this.members.has(workerId)) {
      throw new ClusterMembershipError(`Worker ${workerId} is not a member`, this.clusterId);
    }

    this.members.delete(workerId);
    this.pendingLeaves.delete(workerId);

    this.updateClusterState();
  }

  /**
   * Remove worker (forced removal)
   */
  removeWorker(workerId: WorkerId): void {
    this.members.delete(workerId);
    this.pendingJoins.delete(workerId);
    this.pendingLeaves.delete(workerId);

    this.updateClusterState();
  }

  /**
   * Get member info
   */
  getMember(workerId: WorkerId): ClusterMember | undefined {
    const member = this.members.get(workerId);
    return member ? { ...member } : undefined;
  }

  /**
   * Get all members
   */
  getAllMembers(): readonly ClusterMember[] {
    return Array.from(this.members.values()).map(m => ({ ...m }));
  }

  /**
   * Get members by role
   */
  getMembersByRole(role: ClusterRole): readonly ClusterMember[] {
    return Array.from(this.members.values())
      .filter(m => m.role === role)
      .map(m => ({ ...m }));
  }

  /**
   * Get member count
   */
  getMemberCount(): number {
    return this.members.size;
  }

  /**
   * Get cluster state
   */
  getClusterState(): ClusterMembershipState {
    return this.state;
  }

  /**
   * Update cluster state
   */
  private updateClusterState(): void {
    const memberCount = this.members.size;

    if (memberCount < MIN_CLUSTER_SIZE) {
      this.state = ClusterMembershipStateEnum.FORMING;
    } else if (memberCount >= MIN_CLUSTER_SIZE) {
      this.state = ClusterMembershipStateEnum.STABLE;
    } else {
      this.state = ClusterMembershipStateEnum.DEGRADED;
    }
  }

  /**
   * Update member role
   */
  updateMemberRole(workerId: WorkerId, role: ClusterRole): void {
    const member = this.members.get(workerId);
    if (!member) {
      throw new ClusterMembershipError(`Worker ${workerId} not found`, this.clusterId);
    }

    member.role = role;
  }

  /**
   * Update member status
   */
  updateMemberStatus(workerId: WorkerId, status: 'active' | 'draining' | 'unreachable'): void {
    const member = this.members.get(workerId);
    if (!member) {
      throw new ClusterMembershipError(`Worker ${workerId} not found`, this.clusterId);
    }

    member.status = status;
  }

  /**
   * Update member last seen
   */
  updateLastSeen(workerId: WorkerId): void {
    const member = this.members.get(workerId);
    if (member) {
      member.lastSeen = new Date();
    }
  }

  /**
   * Check if worker is member
   */
  isMember(workerId: WorkerId): boolean {
    return this.members.has(workerId);
  }

  /**
   * Check if worker is pending join
   */
  isPendingJoin(workerId: WorkerId): boolean {
    return this.pendingJoins.has(workerId);
  }

  /**
   * Check if worker is pending leave
   */
  isPendingLeave(workerId: WorkerId): boolean {
    return this.pendingLeaves.has(workerId);
  }

  /**
   * Get pending joins
   */
  getPendingJoins(): readonly WorkerId[] {
    return Array.from(this.pendingJoins);
  }

  /**
   * Get pending leaves
   */
  getPendingLeaves(): readonly WorkerId[] {
    return Array.from(this.pendingLeaves);
  }

  /**
   * Get membership statistics
   */
  getStatistics(): {
    totalMembers: number;
    activeMembers: number;
    drainingMembers: number;
    unreachableMembers: number;
    membersByRole: Map<ClusterRole, number>;
    clusterState: ClusterMembershipState;
  } {
    let active = 0;
    let draining = 0;
    let unreachable = 0;
    const roleCounts = new Map<ClusterRole, number>();

    for (const member of this.members.values()) {
      switch (member.status) {
        case 'active':
          active++;
          break;
        case 'draining':
          draining++;
          break;
        case 'unreachable':
          unreachable++;
          break;
      }

      const count = roleCounts.get(member.role) || 0;
      roleCounts.set(member.role, count + 1);
    }

    return {
      totalMembers: this.members.size,
      activeMembers: active,
      drainingMembers: draining,
      unreachableMembers: unreachable,
      membersByRole: roleCounts,
      clusterState: this.state,
    };
  }

  /**
   * Clear membership
   */
  clear(): void {
    this.members.clear();
    this.pendingJoins.clear();
    this.pendingLeaves.clear();
    this.state = ClusterMembershipStateEnum.FORMING;
  }
}

/**
 * Cluster Member
 */
interface ClusterMember {
  readonly workerId: WorkerId;
  readonly clusterId: ClusterId;
  role: ClusterRole;
  readonly joinedAt: Date;
  status: 'active' | 'draining' | 'unreachable';
  lastSeen: Date;
}
