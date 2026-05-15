/**
 * CLAUX Agent Memory Model Definition
 * 
 * This file defines the canonical memory model for each agent.
 */

import {
  AgentMemoryModel,
  MemoryOwnership,
  MemoryAccessPermission,
  MemoryType,
  MemoryOwnershipType,
  MemoryAccessMode,
  MemoryIsolationLevel,
  PersistenceMode,
} from './types';
import { CanonicalAgentType } from '../system/types';

/**
 * PLANNER memory model
 */
export const PLANNER_MEMORY_MODEL: AgentMemoryModel = {
  agentType: CanonicalAgentType.PLANNER,
  memoryOwnership: [
    {
      owner: CanonicalAgentType.PLANNER,
      memoryType: MemoryType.WORKING,
      ownershipType: MemoryOwnershipType.EXCLUSIVE,
    },
    {
      owner: CanonicalAgentType.PLANNER,
      memoryType: MemoryType.EPISODIC,
      ownershipType: MemoryOwnershipType.EXCLUSIVE,
    },
    {
      owner: CanonicalAgentType.PLANNER,
      memoryType: MemoryType.SEMANTIC,
      ownershipType: MemoryOwnershipType.SHARED,
      sharedWith: [CanonicalAgentType.SIMULATOR, CanonicalAgentType.ANALYZER],
    },
    {
      owner: CanonicalAgentType.PLANNER,
      memoryType: MemoryType.EXECUTION,
      ownershipType: MemoryOwnershipType.EXCLUSIVE,
    },
    {
      owner: CanonicalAgentType.PLANNER,
      memoryType: MemoryType.REPLAY,
      ownershipType: MemoryOwnershipType.EXCLUSIVE,
    },
  ],
  memoryAccessPermissions: [
    {
      agentType: CanonicalAgentType.PLANNER,
      memoryType: MemoryType.WORKING,
      accessMode: MemoryAccessMode.READ_WRITE,
      isolationLevel: MemoryIsolationLevel.AGENT_ISOLATED,
    },
    {
      agentType: CanonicalAgentType.PLANNER,
      memoryType: MemoryType.EPISODIC,
      accessMode: MemoryAccessMode.READ_WRITE,
      isolationLevel: MemoryIsolationLevel.SESSION_ISOLATED,
    },
    {
      agentType: CanonicalAgentType.PLANNER,
      memoryType: MemoryType.SEMANTIC,
      accessMode: MemoryAccessMode.READ_WRITE,
      isolationLevel: MemoryIsolationLevel.SHARED,
    },
    {
      agentType: CanonicalAgentType.EXECUTOR,
      memoryType: MemoryType.EXECUTION,
      accessMode: MemoryAccessMode.READ_ONLY,
      isolationLevel: MemoryIsolationLevel.WORKFLOW_ISOLATED,
    },
  ],
  checkpointSemantics: {
    checkpointableMemoryTypes: [MemoryType.WORKING, MemoryType.EXECUTION],
    checkpointFrequency: 60,
    checkpointRetention: 3600,
  },
};

/**
 * EXECUTOR memory model
 */
export const EXECUTOR_MEMORY_MODEL: AgentMemoryModel = {
  agentType: CanonicalAgentType.EXECUTOR,
  memoryOwnership: [
    {
      owner: CanonicalAgentType.EXECUTOR,
      memoryType: MemoryType.WORKING,
      ownershipType: MemoryOwnershipType.EXCLUSIVE,
    },
    {
      owner: CanonicalAgentType.EXECUTOR,
      memoryType: MemoryType.EXECUTION,
      ownershipType: MemoryOwnershipType.EXCLUSIVE,
    },
    {
      owner: CanonicalAgentType.EXECUTOR,
      memoryType: MemoryType.REPLAY,
      ownershipType: MemoryOwnershipType.EXCLUSIVE,
    },
    {
      owner: CanonicalAgentType.EXECUTOR,
      memoryType: MemoryType.CHECKPOINT,
      ownershipType: MemoryOwnershipType.EXCLUSIVE,
    },
  ],
  memoryAccessPermissions: [
    {
      agentType: CanonicalAgentType.EXECUTOR,
      memoryType: MemoryType.WORKING,
      accessMode: MemoryAccessMode.READ_WRITE,
      isolationLevel: MemoryIsolationLevel.AGENT_ISOLATED,
    },
    {
      agentType: CanonicalAgentType.EXECUTOR,
      memoryType: MemoryType.EXECUTION,
      accessMode: MemoryAccessMode.READ_WRITE,
      isolationLevel: MemoryIsolationLevel.TASK_BOUNDARY,
    },
    {
      agentType: CanonicalAgentType.PLANNER,
      memoryType: MemoryType.EXECUTION,
      accessMode: MemoryAccessMode.READ_ONLY,
      isolationLevel: MemoryIsolationLevel.WORKFLOW_ISOLATED,
    },
  ],
  checkpointSemantics: {
    checkpointableMemoryTypes: [MemoryType.WORKING, MemoryType.EXECUTION],
    checkpointFrequency: 30,
    checkpointRetention: 1800,
  },
};

/**
 * VALIDATOR memory model
 */
export const VALIDATOR_MEMORY_MODEL: AgentMemoryModel = {
  agentType: CanonicalAgentType.VALIDATOR,
  memoryOwnership: [
    {
      owner: CanonicalAgentType.VALIDATOR,
      memoryType: MemoryType.WORKING,
      ownershipType: MemoryOwnershipType.EXCLUSIVE,
    },
    {
      owner: CanonicalAgentType.VALIDATOR,
      memoryType: MemoryType.EPISODIC,
      ownershipType: MemoryOwnershipType.EXCLUSIVE,
    },
    {
      owner: CanonicalAgentType.VALIDATOR,
      memoryType: MemoryType.SEMANTIC,
      ownershipType: MemoryOwnershipType.SHARED,
      sharedWith: [CanonicalAgentType.GOVERNOR],
    },
    {
      owner: CanonicalAgentType.VALIDATOR,
      memoryType: MemoryType.EXECUTION,
      ownershipType: MemoryOwnershipType.EXCLUSIVE,
    },
  ],
  memoryAccessPermissions: [
    {
      agentType: CanonicalAgentType.VALIDATOR,
      memoryType: MemoryType.WORKING,
      accessMode: MemoryAccessMode.READ_WRITE,
      isolationLevel: MemoryIsolationLevel.AGENT_ISOLATED,
    },
    {
      agentType: CanonicalAgentType.VALIDATOR,
      memoryType: MemoryType.EXECUTION,
      accessMode: MemoryAccessMode.READ_WRITE,
      isolationLevel: MemoryIsolationLevel.WORKFLOW_ISOLATED,
    },
    {
      agentType: CanonicalAgentType.GOVERNOR,
      memoryType: MemoryType.SEMANTIC,
      accessMode: MemoryAccessMode.READ_ONLY,
      isolationLevel: MemoryIsolationLevel.SHARED,
    },
  ],
  checkpointSemantics: {
    checkpointableMemoryTypes: [MemoryType.WORKING],
    checkpointFrequency: 120,
    checkpointRetention: 7200,
  },
};

/**
 * GOVERNOR memory model
 */
export const GOVERNOR_MEMORY_MODEL: AgentMemoryModel = {
  agentType: CanonicalAgentType.GOVERNOR,
  memoryOwnership: [
    {
      owner: CanonicalAgentType.GOVERNOR,
      memoryType: MemoryType.WORKING,
      ownershipType: MemoryOwnershipType.EXCLUSIVE,
    },
    {
      owner: CanonicalAgentType.GOVERNOR,
      memoryType: MemoryType.SEMANTIC,
      ownershipType: MemoryOwnershipType.EXCLUSIVE,
    },
    {
      owner: CanonicalAgentType.GOVERNOR,
      memoryType: MemoryType.EXECUTION,
      ownershipType: MemoryOwnershipType.EXCLUSIVE,
    },
    {
      owner: CanonicalAgentType.GOVERNOR,
      memoryType: MemoryType.REPLAY,
      ownershipType: MemoryOwnershipType.EXCLUSIVE,
    },
  ],
  memoryAccessPermissions: [
    {
      agentType: CanonicalAgentType.GOVERNOR,
      memoryType: MemoryType.WORKING,
      accessMode: MemoryAccessMode.READ_WRITE,
      isolationLevel: MemoryIsolationLevel.AGENT_ISOLATED,
    },
    {
      agentType: CanonicalAgentType.GOVERNOR,
      memoryType: MemoryType.SEMANTIC,
      accessMode: MemoryAccessMode.READ_WRITE,
      isolationLevel: MemoryIsolationLevel.SYSTEM_BOUNDARY,
    },
  ],
  checkpointSemantics: {
    checkpointableMemoryTypes: [MemoryType.SEMANTIC, MemoryType.EXECUTION],
    checkpointFrequency: 300,
    checkpointRetention: 86400,
  },
};

/**
 * ANALYZER memory model
 */
export const ANALYZER_MEMORY_MODEL: AgentMemoryModel = {
  agentType: CanonicalAgentType.ANALYZER,
  memoryOwnership: [
    {
      owner: CanonicalAgentType.ANALYZER,
      memoryType: MemoryType.WORKING,
      ownershipType: MemoryOwnershipType.EXCLUSIVE,
    },
    {
      owner: CanonicalAgentType.ANALYZER,
      memoryType: MemoryType.EPISODIC,
      ownershipType: MemoryOwnershipType.EXCLUSIVE,
    },
    {
      owner: CanonicalAgentType.ANALYZER,
      memoryType: MemoryType.SEMANTIC,
      ownershipType: MemoryOwnershipType.EXCLUSIVE,
    },
  ],
  memoryAccessPermissions: [
    {
      agentType: CanonicalAgentType.ANALYZER,
      memoryType: MemoryType.WORKING,
      accessMode: MemoryAccessMode.READ_WRITE,
      isolationLevel: MemoryIsolationLevel.AGENT_ISOLATED,
    },
    {
      agentType: CanonicalAgentType.PLANNER,
      memoryType: MemoryType.SEMANTIC,
      accessMode: MemoryAccessMode.READ_ONLY,
      isolationLevel: MemoryIsolationLevel.SHARED,
    },
  ],
  checkpointSemantics: {
    checkpointableMemoryTypes: [MemoryType.SEMANTIC],
    checkpointFrequency: 600,
    checkpointRetention: 43200,
  },
};

/**
 * ROUTER memory model
 */
export const ROUTER_MEMORY_MODEL: AgentMemoryModel = {
  agentType: CanonicalAgentType.ROUTER,
  memoryOwnership: [
    {
      owner: CanonicalAgentType.ROUTER,
      memoryType: MemoryType.WORKING,
      ownershipType: MemoryOwnershipType.EXCLUSIVE,
    },
    {
      owner: CanonicalAgentType.ROUTER,
      memoryType: MemoryType.EXECUTION,
      ownershipType: MemoryOwnershipType.EXCLUSIVE,
    },
    {
      owner: CanonicalAgentType.ROUTER,
      memoryType: MemoryType.CHECKPOINT,
      ownershipType: MemoryOwnershipType.EXCLUSIVE,
    },
  ],
  memoryAccessPermissions: [
    {
      agentType: CanonicalAgentType.ROUTER,
      memoryType: MemoryType.WORKING,
      accessMode: MemoryAccessMode.READ_WRITE,
      isolationLevel: MemoryIsolationLevel.AGENT_ISOLATED,
    },
    {
      agentType: CanonicalAgentType.ROUTER,
      memoryType: MemoryType.EXECUTION,
      accessMode: MemoryAccessMode.READ_WRITE,
      isolationLevel: MemoryIsolationLevel.SESSION_ISOLATED,
    },
  ],
  checkpointSemantics: {
    checkpointableMemoryTypes: [MemoryType.WORKING, MemoryType.EXECUTION],
    checkpointFrequency: 30,
    checkpointRetention: 1800,
  },
};

/**
 * SIMULATOR memory model
 */
export const SIMULATOR_MEMORY_MODEL: AgentMemoryModel = {
  agentType: CanonicalAgentType.SIMULATOR,
  memoryOwnership: [
    {
      owner: CanonicalAgentType.SIMULATOR,
      memoryType: MemoryType.WORKING,
      ownershipType: MemoryOwnershipType.EXCLUSIVE,
    },
    {
      owner: CanonicalAgentType.SIMULATOR,
      memoryType: MemoryType.EPISODIC,
      ownershipType: MemoryOwnershipType.EXCLUSIVE,
    },
    {
      owner: CanonicalAgentType.SIMULATOR,
      memoryType: MemoryType.SEMANTIC,
      ownershipType: MemoryOwnershipType.SHARED,
      sharedWith: [CanonicalAgentType.PLANNER],
    },
    {
      owner: CanonicalAgentType.SIMULATOR,
      memoryType: MemoryType.REPLAY,
      ownershipType: MemoryOwnershipType.EXCLUSIVE,
    },
  ],
  memoryAccessPermissions: [
    {
      agentType: CanonicalAgentType.SIMULATOR,
      memoryType: MemoryType.WORKING,
      accessMode: MemoryAccessMode.READ_WRITE,
      isolationLevel: MemoryIsolationLevel.AGENT_ISOLATED,
    },
    {
      agentType: CanonicalAgentType.PLANNER,
      memoryType: MemoryType.REPLAY,
      accessMode: MemoryAccessMode.READ_ONLY,
      isolationLevel: MemoryIsolationLevel.WORKFLOW_ISOLATED,
    },
  ],
  checkpointSemantics: {
    checkpointableMemoryTypes: [MemoryType.WORKING, MemoryType.REPLAY],
    checkpointFrequency: 120,
    checkpointRetention: 7200,
  },
};

/**
 * RECOVERER memory model
 */
export const RECOVERER_MEMORY_MODEL: AgentMemoryModel = {
  agentType: CanonicalAgentType.RECOVERER,
  memoryOwnership: [
    {
      owner: CanonicalAgentType.RECOVERER,
      memoryType: MemoryType.WORKING,
      ownershipType: MemoryOwnershipType.EXCLUSIVE,
    },
    {
      owner: CanonicalAgentType.RECOVERER,
      memoryType: MemoryType.EXECUTION,
      ownershipType: MemoryOwnershipType.EXCLUSIVE,
    },
    {
      owner: CanonicalAgentType.RECOVERER,
      memoryType: MemoryType.CHECKPOINT,
      ownershipType: MemoryOwnershipType.EXCLUSIVE,
    },
    {
      owner: CanonicalAgentType.RECOVERER,
      memoryType: MemoryType.REPLAY,
      ownershipType: MemoryOwnershipType.EXCLUSIVE,
    },
  ],
  memoryAccessPermissions: [
    {
      agentType: CanonicalAgentType.RECOVERER,
      memoryType: MemoryType.WORKING,
      accessMode: MemoryAccessMode.READ_WRITE,
      isolationLevel: MemoryIsolationLevel.AGENT_ISOLATED,
    },
    {
      agentType: CanonicalAgentType.RECOVERER,
      memoryType: MemoryType.CHECKPOINT,
      accessMode: MemoryAccessMode.READ_WRITE,
      isolationLevel: MemoryIsolationLevel.SYSTEM_BOUNDARY,
    },
  ],
  checkpointSemantics: {
    checkpointableMemoryTypes: [MemoryType.EXECUTION, MemoryType.CHECKPOINT],
    checkpointFrequency: 60,
    checkpointRetention: 86400,
  },
};

/**
 * OBSERVER memory model
 */
export const OBSERVER_MEMORY_MODEL: AgentMemoryModel = {
  agentType: CanonicalAgentType.OBSERVER,
  memoryOwnership: [
    {
      owner: CanonicalAgentType.OBSERVER,
      memoryType: MemoryType.WORKING,
      ownershipType: MemoryOwnershipType.EXCLUSIVE,
    },
    {
      owner: CanonicalAgentType.OBSERVER,
      memoryType: MemoryType.EXECUTION,
      ownershipType: MemoryOwnershipType.EXCLUSIVE,
    },
    {
      owner: CanonicalAgentType.OBSERVER,
      memoryType: MemoryType.REPLAY,
      ownershipType: MemoryOwnershipType.EXCLUSIVE,
    },
    {
      owner: CanonicalAgentType.OBSERVER,
      memoryType: MemoryType.CHECKPOINT,
      ownershipType: MemoryOwnershipType.EXCLUSIVE,
    },
  ],
  memoryAccessPermissions: [
    {
      agentType: CanonicalAgentType.OBSERVER,
      memoryType: MemoryType.WORKING,
      accessMode: MemoryAccessMode.READ_WRITE,
      isolationLevel: MemoryIsolationLevel.AGENT_ISOLATED,
    },
    {
      agentType: CanonicalAgentType.OBSERVER,
      memoryType: MemoryType.EXECUTION,
      accessMode: MemoryAccessMode.READ_WRITE,
      isolationLevel: MemoryIsolationLevel.SYSTEM_BOUNDARY,
    },
  ],
  checkpointSemantics: {
    checkpointableMemoryTypes: [MemoryType.EXECUTION, MemoryType.REPLAY],
    checkpointFrequency: 30,
    checkpointRetention: 3600,
  },
};

/**
 * Map of agent types to memory models
 */
export const AGENT_MEMORY_MODELS: Readonly<Record<CanonicalAgentType, AgentMemoryModel>> = {
  [CanonicalAgentType.PLANNER]: PLANNER_MEMORY_MODEL,
  [CanonicalAgentType.EXECUTOR]: EXECUTOR_MEMORY_MODEL,
  [CanonicalAgentType.VALIDATOR]: VALIDATOR_MEMORY_MODEL,
  [CanonicalAgentType.GOVERNOR]: GOVERNOR_MEMORY_MODEL,
  [CanonicalAgentType.ANALYZER]: ANALYZER_MEMORY_MODEL,
  [CanonicalAgentType.ROUTER]: ROUTER_MEMORY_MODEL,
  [CanonicalAgentType.SIMULATOR]: SIMULATOR_MEMORY_MODEL,
  [CanonicalAgentType.RECOVERER]: RECOVERER_MEMORY_MODEL,
  [CanonicalAgentType.OBSERVER]: OBSERVER_MEMORY_MODEL,
};

/**
 * Get memory model by agent type
 */
export function getMemoryModel(agentType: CanonicalAgentType): AgentMemoryModel {
  return AGENT_MEMORY_MODELS[agentType];
}
