/**
 * CLAUX Agent Capability System Types
 * 
 * This file defines the agent capability system including:
 * - planning
 * - execution
 * - validation
 * - governance
 * - analysis
 * - routing
 * - simulation
 * - recovery
 * - optimization
 * - observability
 * - coordination
 * - communication
 * 
 * Capabilities must be:
 * - composable
 * - permissioned
 * - replay-safe
 * - runtime-safe
 */

import { CanonicalAgentType } from '../system/types';

/**
 * Capability type
 */
export enum CapabilityType {
  /**
   * PLANNING - Planning capability
   */
  PLANNING = 'planning',

  /**
   * EXECUTION - Execution capability
   */
  EXECUTION = 'execution',

  /**
   * VALIDATION - Validation capability
   */
  VALIDATION = 'validation',

  /**
   * GOVERNANCE - Governance capability
   */
  GOVERNANCE = 'governance',

  /**
   * ANALYSIS - Analysis capability
   */
  ANALYSIS = 'analysis',

  /**
   * ROUTING - Routing capability
   */
  ROUTING = 'routing',

  /**
   * SIMULATION - Simulation capability
   */
  SIMULATION = 'simulation',

  /**
   * RECOVERY - Recovery capability
   */
  RECOVERY = 'recovery',

  /**
   * OPTIMIZATION - Optimization capability
   */
  OPTIMIZATION = 'optimization',

  /**
   * OBSERVABILITY - Observability capability
   */
  OBSERVABILITY = 'observability',

  /**
   * COORDINATION - Coordination capability
   */
  COORDINATION = 'coordination',

  /**
   * COMMUNICATION - Communication capability
   */
  COMMUNICATION = 'communication',
}

/**
 * Capability permission level
 */
export enum CapabilityPermission {
  /**
   * GRANTED - Permission granted
   */
  GRANTED = 'granted',

  /**
   * DENIED - Permission denied
   */
  DENIED = 'denied',

  /**
   * CONDITIONAL - Permission conditional
   */
  CONDITIONAL = 'conditional',

  /**
   * ESCALATION_REQUIRED - Escalation required
   */
  ESCALATION_REQUIRED = 'escalation_required',
}

/**
 * Capability safety level
 */
export enum CapabilitySafetyLevel {
  /**
   * SAFE - Safe capability
   */
  SAFE = 'safe',

  /**
   * CONDITIONALLY_SAFE - Conditionally safe
   */
  CONDITIONALLY_SAFE = 'conditionally_safe',

  /**
   * REQUIRES_VALIDATION - Requires validation
   */
  REQUIRES_VALIDATION = 'requires_validation',

  /**
   * REQUIRES_GOVERNANCE - Requires governance
   */
  REQUIRES_GOVERNANCE = 'requires_governance',
}

/**
 * Capability contract
 */
export interface CapabilityContract {
  /**
   * Capability type
   */
  readonly capabilityType: CapabilityType;

  /**
   * Capability description
   */
  readonly description: string;

  /**
   * Safety level
   */
  readonly safetyLevel: CapabilitySafetyLevel;

  /**
   * Replay safe
   */
  readonly replaySafe: boolean;

  /**
   * Runtime safe
   */
  readonly runtimeSafe: boolean;

  /**
   * Composable
   */
  readonly composable: boolean;

  /**
   * Required permissions
   */
  readonly requiredPermissions: readonly string[];
}

/**
 * Agent capability permission
 */
export interface AgentCapabilityPermission {
  /**
   * Agent type
   */
  readonly agentType: CanonicalAgentType;

  /**
   * Capability type
   */
  readonly capabilityType: CapabilityType;

  /**
   * Permission level
   */
  readonly permissionLevel: CapabilityPermission;

  /**
   * Permission conditions
   */
  readonly conditions?: readonly string[];
}

/**
 * Capability composition
 */
export interface CapabilityComposition {
  /**
   * Composition identifier
   */
  readonly compositionId: string;

  /**
   * Capabilities
   */
  readonly capabilities: readonly CapabilityType[];

  /**
   * Composition type
   */
  readonly compositionType: 'sequential' | 'parallel' | 'conditional';

  /**
   * Composition constraints
   */
  readonly constraints?: readonly string[];
}

/**
 * Capability registry
 */
export interface CapabilityRegistry {
  /**
   * Capability contracts
   */
  readonly capabilityContracts: Readonly<Record<CapabilityType, CapabilityContract>>;

  /**
   * Agent capability permissions
   */
  readonly agentCapabilityPermissions: readonly AgentCapabilityPermission[];

  /**
   * Capability compositions
   */
  readonly capabilityCompositions: readonly CapabilityComposition[];
}
