/**
 * CLAUX Runtime Distributed Layer - Cluster Consensus
 * 
 * Provides semantic consensus interfaces without full Raft/Paxos implementation.
 * No external dependencies - pure consensus semantics.
 */

import type { WorkerId, ClusterId, ConsensusProposal, ConsensusVote, ConsensusResult } from '../types';
import { CONSENSUS_QUORUM_PERCENTAGE, DEFAULT_CONSENSUS_TIMEOUT_MS } from '../constants';
import { ConsensusError } from '../errors';

/**
 * Cluster Consensus Manager
 * 
 * Provides semantic consensus interfaces without full Raft/Paxos implementation.
 */
export class ClusterConsensusManager {
  private clusterId: ClusterId;
  private currentEpoch: number = 0;
  private proposals: Map<string, ConsensusProposal> = new Map();
  private votes: Map<string, Map<WorkerId, ConsensusVote>> = new Map();
  private acceptedProposals: ConsensusProposal[] = [];

  constructor(clusterId: ClusterId) {
    this.clusterId = clusterId;
  }

  /**
   * Propose consensus
   */
  async propose(proposal: ConsensusProposal): Promise<string> {
    const proposalId = this.generateProposalId();
    const proposalWithId: ConsensusProposal = {
      ...proposal,
      proposalId,
      epoch: this.currentEpoch,
      timestamp: new Date(),
    };

    this.proposals.set(proposalId, proposalWithId);
    this.votes.set(proposalId, new Map());

    return proposalId;
  }

  /**
   * Vote on proposal
   */
  async vote(proposalId: string, workerId: WorkerId, vote: ConsensusVote): Promise<void> {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) {
      throw new ConsensusError(`Proposal ${proposalId} not found`, proposalId);
    }

    const proposalVotes = this.votes.get(proposalId) || new Map();
    proposalVotes.set(workerId, vote);
    this.votes.set(proposalId, proposalVotes);

    // Check if consensus reached
    this.checkConsensus(proposalId);
  }

  /**
   * Get proposal
   */
  getProposal(proposalId: string): ConsensusProposal | undefined {
    const proposal = this.proposals.get(proposalId);
    return proposal ? { ...proposal } : undefined;
  }

  /**
   * Get votes for proposal
   */
  getVotes(proposalId: string): Map<WorkerId, ConsensusVote> {
    const votes = this.votes.get(proposalId);
    return votes ? new Map(votes) : new Map();
  }

  /**
   * Get consensus result
   */
  getResult(proposalId: string): ConsensusResult | undefined {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) return undefined;

    const votes = this.votes.get(proposalId) || new Map();
    const votesArray = Array.from(votes.values());

    const approveCount = votesArray.filter(v => v.decision === 'approve').length;
    const rejectCount = votesArray.filter(v => v.decision === 'reject').length;
    const totalVotes = votesArray.length;

    return {
      proposal,
      votes: votesArray,
      state: approveCount >= CONSENSUS_QUORUM_PERCENTAGE ? 'agreed' as any : 'disagreed' as any,
      agreed: approveCount >= CONSENSUS_QUORUM_PERCENTAGE,
      timestamp: new Date(),
    };
  }

  /**
   * Check if consensus is reached
   */
  private checkConsensus(proposalId: string): void {
    const result = this.getResult(proposalId);
    if (!result) return;

    if (result.agreed) {
      const proposal = this.proposals.get(proposalId);
      if (proposal) {
        this.acceptedProposals.push(proposal);
      }
    }
  }

  /**
   * Get accepted proposals
   */
  getAcceptedProposals(): readonly ConsensusProposal[] {
    return [...this.acceptedProposals];
  }

  /**
   * Increment epoch
   */
  incrementEpoch(): void {
    this.currentEpoch++;
  }

  /**
   * Get current epoch
   */
  getCurrentEpoch(): number {
    return this.currentEpoch;
  }

  /**
   * Get consensus statistics
   */
  getStatistics(): {
    currentEpoch: number;
    totalProposals: number;
    acceptedProposals: number;
    pendingProposals: number;
    averageVotesPerProposal: number;
  } {
    let totalVotes = 0;

    for (const votes of this.votes.values()) {
      totalVotes += votes.size;
    }

    const avgVotes = this.proposals.size > 0 ? totalVotes / this.proposals.size : 0;

    return {
      currentEpoch: this.currentEpoch,
      totalProposals: this.proposals.size,
      acceptedProposals: this.acceptedProposals.length,
      pendingProposals: this.proposals.size - this.acceptedProposals.length,
      averageVotesPerProposal: avgVotes,
    };
  }

  /**
   * Generate proposal ID
   */
  private generateProposalId(): string {
    return `proposal_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Clear consensus
   */
  clear(): void {
    this.proposals.clear();
    this.votes.clear();
    this.acceptedProposals = [];
    this.currentEpoch = 0;
  }
}
