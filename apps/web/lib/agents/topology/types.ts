/**
 * CLAUX Agent Topology Types
 * 
 * This file defines the agent topology including:
 * - agent hierarchy
 * - peer relationships
 * - delegation semantics
 * - orchestration authority
 * - execution authority
 * - planning authority
 * - governance authority
 * - supervision semantics
 * - escalation chains
 * - distributed coordination rules
 */

import { CanonicalAgentType } from '../system/types';

/**
 * Relationship type between agents
 */
export enum RelationshipType {
  /**
   * HIERARCHY - Parent-child relationship
   */
  HIERARCHY = 'hierarchy',

  /**
   * PEER - Equal peer relationship
   */
  PEER = 'peer',

  /**
   * SUPERVISOR - Supervisor-supervisee relationship
   */
  SUPERVISOR = 'supervisor',

  /**
   * DELEGATOR - Delegator-delegatee relationship
   */
  DELEGATOR = 'delegator',
}

/**
 * Authority type
 */
export enum AuthorityType {
  /**
   * ORCHESTRATION - Authority to orchestrate
   */
  ORCHESTRATION = 'orchestration',

  /**
   * EXECUTION - Authority to execute
   */
  EXECUTION = 'execution',

  /**
   * PLANNING - Authority to plan
   */
  PLANNING = 'planning',

  /**
   * GOVERNANCE - Authority to govern
   */
  GOVERNANCE = 'governance',
}

/**
 * Decision mode
 */
export enum DecisionMode {
  /**
   * CENTRALIZED - Decisions made centrally
   */
  CENTRALIZED = 'centralized',

  /**
   * DECENTRALIZED - Decisions made decentrally
   */
  DECENTRALIZED = 'decentralized',

  /**
   * HYBRID - Hybrid decision making
   */
  HYBRID = 'hybrid',
}

/**
 * Arbitration mode
 */
export enum ArbitrationMode {
  /**
   * FIRST_WINS - First to claim wins
   */
  FIRST_WINS = 'first_wins',

  /**
   * MAJORITY_VOTE - Majority vote decides
   */
  MAJORITY_VOTE = 'majority_vote',

  /**
   * AUTHORITY_DECIDES - Authority agent decides
   */
  AUTHORITY_DECIDES = 'authority_decides',

  /**
   * CONSENSUS - Consensus required
   */
  CONSENSUS = 'consensus',
}

/**
 * Agent relationship
 */
export interface AgentRelationship {
  /**
   * Source agent
   */
  readonly source: CanonicalAgentType;

  /**
   * Target agent
   */
  readonly target: CanonicalAgentType;

  /**
   * Relationship type
   */
  readonly type: RelationshipType;

  /**
   * Authority types
   */
  readonly authorities: readonly AuthorityType[];
}

/**
 * Agent hierarchy level
 */
export enum HierarchyLevel {
  /**
   * STRATEGIC - Strategic level
   */
  STRATEGIC = 'strategic',

  /**
   * TACTICAL - Tactical level
   */
  TACTICAL = 'tactical',

  /**
   * OPERATIONAL - Operational level
   */
  OPERATIONAL = 'operational',
}

/**
 * Agent hierarchy node
 */
export interface HierarchyNode {
  /**
   * Agent type
   */
  readonly agentType: CanonicalAgentType;

  /**
   * Hierarchy level
   */
  readonly level: HierarchyLevel;

  /**
   * Parent agent types
   */
  readonly parents: readonly CanonicalAgentType[];

  /**
   * Child agent types
   */
  readonly children: readonly CanonicalAgentType[];
}

/**
 * Delegation semantics
 */
export interface DelegationSemantics {
  /**
   * Delegator agent type
   */
  readonly delegator: CanonicalAgentType;

  /**
   * Delegatee agent type
   */
  readonly delegatee: CanonicalAgentType;

  /**
   * Delegation scope
   */
  readonly scope: string;

  /**
   * Delegation authority
   */
  readonly authority: AuthorityType;

  /**
   * Delegation duration
   */
  readonly duration?: number;

  /**
   * Revocable
   */
  readonly revocable: boolean;
}

/**
 * Escalation chain
 */
export interface EscalationChain {
  /**
   * Source agent type
   */
  readonly source: CanonicalAgentType;

  /**
   * Escalation path
   */
  readonly path: readonly CanonicalAgentType[];

  /**
   * Escalation trigger
   */
  readonly trigger: string;

  /**
   * Escalation timeout
   */
  readonly timeout?: number;
}

/**
 * Supervision semantics
 */
export interface SupervisionSemantics {
  /**
   * Supervisor agent type
   */
  readonly supervisor: CanonicalAgentType;

  /**
   * Supervisee agent types
   */
  readonly supervisees: readonly CanonicalAgentType[];

  /**
   * Supervision scope
   */
  readonly scope: string;

  /**
   * Intervention threshold
   */
  readonly interventionThreshold: number;
}

/**
 * Distributed coordination rule
 */
export interface DistributedCoordinationRule {
  /**
   * Rule identifier
   */
  readonly ruleId: string;

  /**
   * Participating agent types
   */
  readonly participants: readonly CanonicalAgentType[];

  /**
   * Decision mode
   */
  readonly decisionMode: DecisionMode;

  /**
   * Arbitration mode
   */
  readonly arbitrationMode: ArbitrationMode;

  /**
   * Coordination scope
   */
  readonly scope: string;

  /**
   * Consistency requirements
   */
  readonly consistencyRequirements: readonly string[];
}

/**
 * Agent topology
 */
export interface AgentTopology {
  /**
   * Relationships
   */
  readonly relationships: readonly AgentRelationship[];

  /**
   * Hierarchy
   */
  readonly hierarchy: readonly HierarchyNode[];

  /**
   * Delegation semantics
   */
  readonly delegationSemantics: readonly DelegationSemantics[];

  /**
   * Escalation chains
   */
  readonly escalationChains: readonly EscalationChain[];

  /**
   * Supervision semantics
   */
  readonly supervisionSemantics: readonly SupervisionSemantics[];

  /**
   * Distributed coordination rules
   */
  readonly distributedCoordinationRules: readonly DistributedCoordinationRule[];
}
