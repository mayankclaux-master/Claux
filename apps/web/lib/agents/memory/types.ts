/**
 * CLAUX Agent Memory Model Types
 * 
 * This file defines the agent memory model including:
 * - working memory
 * - episodic memory
 * - semantic memory
 * - execution memory
 * - replay memory
 * - checkpoint semantics
 * - shared memory access
 * - isolation boundaries
 * - persistence semantics
 * - memory ownership
 * - memory routing semantics
 * - memory synchronization semantics
 * - memory replay semantics
 */

import { CanonicalAgentType } from '../system/types';

/**
 * Memory type
 */
export enum MemoryType {
  /**
   * WORKING - Short-term working memory
   */
  WORKING = 'working',

  /**
   * EPISODIC - Episode-based memory
   */
  EPISODIC = 'episodic',

  /**
   * SEMANTIC - Semantic knowledge memory
   */
  SEMANTIC = 'semantic',

  /**
   * EXECUTION - Execution state memory
   */
  EXECUTION = 'execution',

  /**
   * REPLAY - Replay history memory
   */
  REPLAY = 'replay',

  /**
   * CHECKPOINT - Checkpoint state memory
   */
  CHECKPOINT = 'checkpoint',
}

/**
 * Memory access mode
 */
export enum MemoryAccessMode {
  /**
   * READ_ONLY - Read-only access
   */
  READ_ONLY = 'read_only',

  /**
   * READ_WRITE - Read-write access
   */
  READ_WRITE = 'read_write',

  /**
   * WRITE_ONLY - Write-only access
   */
  WRITE_ONLY = 'write_only',

  /**
   * NO_ACCESS - No access
   */
  NO_ACCESS = 'no_access',
}

/**
 * Memory isolation level
 */
export enum MemoryIsolationLevel {
  /**
   * AGENT_ISOLATED - Memory isolated to agent
   */
  AGENT_ISOLATED = 'agent_isolated',

  /**
   * SESSION_ISOLATED - Memory isolated to session
   */
  SESSION_ISOLATED = 'session_isolated',

  /**
   * WORKFLOW_ISOLATED - Memory isolated to workflow
   */
  WORKFLOW_ISOLATED = 'workflow_isolated',

  /**
   * TASK_BOUNDARY - Memory isolated to task boundary
   */
  TASK_BOUNDARY = 'task_boundary',

  /**
   * SYSTEM_BOUNDARY - Memory isolated to system boundary
   */
  SYSTEM_BOUNDARY = 'system_boundary',

  /**
   * SHARED - Shared memory
   */
  SHARED = 'shared',
}

/**
 * Persistence mode
 */
export enum PersistenceMode {
  /**
   * VOLATILE - Volatile memory (not persisted)
   */
  VOLATILE = 'volatile',

  /**
   * TRANSIENT - Transient memory (short-lived persistence)
   */
  TRANSIENT = 'transient',

  /**
   * PERSISTENT - Persistent memory (long-lived persistence)
   */
  PERSISTENT = 'persistent',

  /**
   * IMMUTABLE - Immutable memory (never changes)
   */
  IMMUTABLE = 'immutable',
}

/**
 * Memory ownership type
 */
export enum MemoryOwnershipType {
  /**
   * EXCLUSIVE - Exclusive ownership
   */
  EXCLUSIVE = 'exclusive',

  /**
   * SHARED - Shared ownership
   */
  SHARED = 'shared',

  /**
   * DELEGATED - Delegated ownership
   */
  DELEGATED = 'delegated',

  /**
   * NONE - No ownership
   */
  NONE = 'none',
}

/**
 * Memory entry
 */
export interface MemoryEntry {
  /**
   * Memory identifier
   */
  readonly memoryId: string;

  /**
   * Memory type
   */
  readonly memoryType: MemoryType;

  /**
   * Owner agent type
   */
  readonly owner: CanonicalAgentType;

  /**
   * Memory data
   */
  readonly data: Readonly<Record<string, unknown>>;

  /**
   * Timestamp
   */
  readonly timestamp: number;

  /**
   * Isolation level
   */
  readonly isolationLevel: MemoryIsolationLevel;

  /**
   * Persistence mode
   */
  readonly persistenceMode: PersistenceMode;
}

/**
 * Memory access permission
 */
export interface MemoryAccessPermission {
  /**
   * Agent type
   */
  readonly agentType: CanonicalAgentType;

  /**
   * Memory type
   */
  readonly memoryType: MemoryType;

  /**
   * Access mode
   */
  readonly accessMode: MemoryAccessMode;

  /**
   * Isolation level
   */
  readonly isolationLevel: MemoryIsolationLevel;
}

/**
 * Memory ownership
 */
export interface MemoryOwnership {
  /**
   * Owner agent type
   */
  readonly owner: CanonicalAgentType;

  /**
   * Memory type
   */
  readonly memoryType: MemoryType;

  /**
   * Ownership type
   */
  readonly ownershipType: MemoryOwnershipType;

  /**
   * Shared with
   */
  readonly sharedWith?: readonly CanonicalAgentType[];
}

/**
 * Memory routing rule
 */
export interface MemoryRoutingRule {
  /**
   * Source agent type
   */
  readonly source: CanonicalAgentType;

  /**
   * Target agent type
   */
  readonly target: CanonicalAgentType;

  /**
   * Memory type
   */
  readonly memoryType: MemoryType;

  /**
   * Routing condition
   */
  readonly condition: string;

  /**
   * Transformation
   */
  readonly transformation?: string;
}

/**
 * Memory synchronization rule
 */
export interface MemorySynchronizationRule {
  /**
   * Memory type
   */
  readonly memoryType: MemoryType;

  /**
   * Participating agent types
   */
  readonly participants: readonly CanonicalAgentType[];

  /**
   * Synchronization mode
   */
  readonly synchronizationMode: 'immediate' | 'eventual' | 'on_demand';

  /**
   * Consistency level
   */
  readonly consistencyLevel: 'strict' | 'causal' | 'eventual';
}

/**
 * Memory replay semantics
 */
export interface MemoryReplaySemantics {
  /**
   * Memory type
   */
  readonly memoryType: MemoryType;

  /**
   * Replayable
   */
  readonly replayable: boolean;

  /**
   * Replay scope
   */
  readonly replayScope: 'agent' | 'session' | 'workflow' | 'system';

  /**
   * Replay preservation
   */
  readonly replayPreservation: 'full' | 'partial' | 'metadata_only';
}

/**
 * Agent memory model
 */
export interface AgentMemoryModel {
  /**
   * Agent type
   */
  readonly agentType: CanonicalAgentType;

  /**
   * Memory ownership
   */
  readonly memoryOwnership: readonly MemoryOwnership[];

  /**
   * Memory access permissions
   */
  readonly memoryAccessPermissions: readonly MemoryAccessPermission[];

  /**
   * Checkpoint semantics
   */
  readonly checkpointSemantics: {
    /**
     * Checkpointable memory types
     */
    readonly checkpointableMemoryTypes: readonly MemoryType[];

    /**
     * Checkpoint frequency
     */
    readonly checkpointFrequency: number;

    /**
     * Checkpoint retention
     */
    readonly checkpointRetention: number;
  };
}
