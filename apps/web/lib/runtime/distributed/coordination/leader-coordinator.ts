/**
 * CLAUX Runtime Distributed Layer - Leader Coordinator
 * 
 * Coordinates leader election and leadership operations.
 * No external dependencies - pure coordination semantics.
 */

import type { ClusterId, WorkerId, ClusterRole, ConsensusProposal, ConsensusVote, ConsensusResult } from '../types';
import { ClusterRole as ClusterRoleEnum, ConsensusState } from '../types';
import { LEADER_ELECTION_TIMEOUT_MS, LEADER_HEARTBEAT_INTERVAL_MS, CONSENSUS_QUORUM_PERCENTAGE } from '../constants';
import { LeaderElectionError, ConsensusError, ConsensusTimeoutError } from '../errors';

/**
 * Leader Coordinator Configuration
 */
export interface LeaderCoordinatorConfig {
  readonly clusterId: ClusterId;
  readonly electionTimeoutMs: number;
  readonly heartbeatIntervalMs: number;
  readonly quorumPercentage: number;
}

/**
 * Leader Coordinator
 * 
 * Coordinates leader election and leadership operations.
 */
export class LeaderCoordinator {
  private config: LeaderCoordinatorConfig;
  private currentLeader: WorkerId | null = null;
  private currentEpoch: number = 0;
  private leaderHeartbeatTime: Date | null = null;
  private electionInProgress: boolean = false;
  private proposals: Map<string, ConsensusProposal> = new Map();
  private votes: Map<string, ConsensusVote[]> = new Map();

  constructor(config: Partial<LeaderCoordinatorConfig> = {}) {
    this.config = {
      clusterId: config.clusterId || 'default',
      electionTimeoutMs: config.electionTimeoutMs || LEADER_ELECTION_TIMEOUT_MS,
      heartbeatIntervalMs: config.heartbeatIntervalMs || LEADER_HEARTBEAT_INTERVAL_MS,
      quorumPercentage: config.quorumPercentage || CONSENSUS_QUORUM_PERCENTAGE,
    };
  }

  /**
   * Start leader election
   */
  async startElection(candidate: WorkerId): Promise<WorkerId> {
    if (this.electionInProgress) {
      throw new LeaderElectionError('Election already in progress', this.config.clusterId);
    }

    this.electionInProgress = true;

    try {
      // Create proposal
      const proposalId = this.generateProposalId();
      const proposal: ConsensusProposal = {
        proposalId,
        proposer: candidate,
        value: { action: 'elect_leader', candidate },
        epoch: this.currentEpoch + 1,
        timestamp: new Date(),
      };

      this.proposals.set(proposalId, proposal);

      // Seek consensus
      const result = await this.seekConsensus(proposal);

      if (result.agreed) {
        this.currentLeader = candidate;
        this.currentEpoch = proposal.epoch;
        this.leaderHeartbeatTime = new Date();
        return candidate;
      } else {
        throw new LeaderElectionError('Consensus not reached for leader election', this.config.clusterId);
      }
    } finally {
      this.electionInProgress = false;
    }
  }

  /**
   * Step down as leader
   */
  async stepDown(currentLeader: WorkerId): Promise<void> {
    if (this.currentLeader !== currentLeader) {
      throw new LeaderElectionError('Cannot step down: not the current leader', this.config.clusterId);
    }

    this.currentLeader = null;
    this.currentEpoch++;
    this.leaderHeartbeatTime = null;
  }

  /**
   * Update leader heartbeat
   */
  updateLeaderHeartbeat(leader: WorkerId): void {
    if (this.currentLeader !== leader) {
      throw new LeaderElectionError('Cannot update heartbeat: not the current leader', this.config.clusterId);
    }

    this.leaderHeartbeatTime = new Date();
  }

  /**
   * Check if leader heartbeat is valid
   */
  isLeaderHeartbeatValid(): boolean {
    if (!this.leaderHeartbeatTime || !this.currentLeader) {
      return false;
    }

    const elapsed = Date.now() - this.leaderHeartbeatTime.getTime();
    return elapsed < (this.config.heartbeatIntervalMs * 3);
  }

  /**
   * Get current leader
   */
  getCurrentLeader(): WorkerId | null {
    return this.currentLeader;
  }

  /**
   * Get current epoch
   */
  getCurrentEpoch(): number {
    return this.currentEpoch;
  }

  /**
   * Check if worker is leader
   */
  isLeader(workerId: WorkerId): boolean {
    return this.currentLeader === workerId;
  }

  /**
   * Get leader role for worker
   */
  getWorkerRole(workerId: WorkerId): ClusterRole {
    if (this.currentLeader === workerId) {
      return ClusterRoleEnum.LEADER;
    }
    return ClusterRoleEnum.FOLLOWER;
  }

  /**
   * Seek consensus on proposal
   */
  async seekConsensus(proposal: ConsensusProposal): Promise<ConsensusResult> {
    const votes: ConsensusVote[] = [];
    const startTime = Date.now();

    // Simulate consensus process
    // In production, this would collect votes from cluster members
    const agreed = await this.evaluateQuorum(proposal, votes);

    const result: ConsensusResult = {
      proposal,
      votes,
      state: agreed ? ConsensusState.AGREED : ConsensusState.DISAGREED,
      agreed,
      timestamp: new Date(),
    };

    this.votes.set(proposal.proposalId, votes);

    return result;
  }

  /**
   * Submit vote for proposal
   */
  submitVote(vote: ConsensusVote): void {
    const proposal = this.proposals.get(vote.proposalId);
    if (!proposal) {
      throw new ConsensusError(`Proposal ${vote.proposalId} not found`, this.config.clusterId);
    }

    const votes = this.votes.get(vote.proposalId) || [];
    votes.push(vote);
    this.votes.set(vote.proposalId, votes);
  }

  /**
   * Evaluate quorum for proposal
   */
  private async evaluateQuorum(proposal: ConsensusProposal, votes: ConsensusVote[]): Promise<boolean> {
    // Calculate quorum size
    const quorumSize = Math.ceil(this.config.quorumPercentage);
    
    // Check if we have enough votes
    const agreedVotes = votes.filter(v => v.decision).length;
    const totalVotes = votes.length;

    if (totalVotes === 0) {
      // Simulate auto-agreement for single-node clusters
      return true;
    }

    return agreedVotes >= quorumSize;
  }

  /**
   * Generate proposal ID
   */
  private generateProposalId(): string {
    return `proposal_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Check if election is in progress
   */
  isElectionInProgress(): boolean {
    return this.electionInProgress;
  }

  /**
   * Get election statistics
   */
  getStatistics(): {
    currentLeader: WorkerId | null;
    currentEpoch: number;
    heartbeatValid: boolean;
    electionInProgress: boolean;
    activeProposals: number;
  } {
    return {
      currentLeader: this.currentLeader,
      currentEpoch: this.currentEpoch,
      heartbeatValid: this.isLeaderHeartbeatValid(),
      electionInProgress: this.electionInProgress,
      activeProposals: this.proposals.size,
    };
  }

  /**
   * Reset coordinator
   */
  reset(): void {
    this.currentLeader = null;
    this.currentEpoch = 0;
    this.leaderHeartbeatTime = null;
    this.electionInProgress = false;
    this.proposals.clear();
    this.votes.clear();
  }

  /**
   * Get configuration
   */
  getConfig(): LeaderCoordinatorConfig {
    return { ...this.config };
  }

  /**
   * Set configuration
   */
  setConfig(config: Partial<LeaderCoordinatorConfig>): void {
    this.config = { ...this.config, ...config };
  }
}
