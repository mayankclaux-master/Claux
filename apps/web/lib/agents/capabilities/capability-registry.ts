/**
 * CLAUX Agent Capability Registry
 * 
 * This file defines the canonical capability contracts and permissions.
 */

import {
  CapabilityRegistry,
  CapabilityContract,
  AgentCapabilityPermission,
  CapabilityComposition,
  CapabilityType,
  CapabilityPermission,
  CapabilitySafetyLevel,
} from './types';
import { CanonicalAgentType } from '../system/types';

/**
 * Capability contracts
 */
export const CAPABILITY_CONTRACTS: Readonly<Record<CapabilityType, CapabilityContract>> = {
  [CapabilityType.PLANNING]: {
    capabilityType: CapabilityType.PLANNING,
    description: 'Create and refine execution plans',
    safetyLevel: CapabilitySafetyLevel.REQUIRES_VALIDATION,
    replaySafe: true,
    runtimeSafe: true,
    composable: true,
    requiredPermissions: ['planning_authority'],
  },
  [CapabilityType.EXECUTION]: {
    capabilityType: CapabilityType.EXECUTION,
    description: 'Execute tasks and implement actions',
    safetyLevel: CapabilitySafetyLevel.REQUIRES_GOVERNANCE,
    replaySafe: true,
    runtimeSafe: true,
    composable: true,
    requiredPermissions: ['execution_authority'],
  },
  [CapabilityType.VALIDATION]: {
    capabilityType: CapabilityType.VALIDATION,
    description: 'Validate outputs and verify correctness',
    safetyLevel: CapabilitySafetyLevel.SAFE,
    replaySafe: true,
    runtimeSafe: true,
    composable: true,
    requiredPermissions: ['validation_authority'],
  },
  [CapabilityType.GOVERNANCE]: {
    capabilityType: CapabilityType.GOVERNANCE,
    description: 'Enforce policies and ensure compliance',
    safetyLevel: CapabilitySafetyLevel.REQUIRES_VALIDATION,
    replaySafe: true,
    runtimeSafe: true,
    composable: false,
    requiredPermissions: ['governance_authority'],
  },
  [CapabilityType.ANALYSIS]: {
    capabilityType: CapabilityType.ANALYSIS,
    description: 'Analyze data and generate insights',
    safetyLevel: CapabilitySafetyLevel.SAFE,
    replaySafe: true,
    runtimeSafe: true,
    composable: true,
    requiredPermissions: ['analysis_authority'],
  },
  [CapabilityType.ROUTING]: {
    capabilityType: CapabilityType.ROUTING,
    description: 'Route tasks and allocate resources',
    safetyLevel: CapabilitySafetyLevel.REQUIRES_VALIDATION,
    replaySafe: true,
    runtimeSafe: true,
    composable: true,
    requiredPermissions: ['routing_authority'],
  },
  [CapabilityType.SIMULATION]: {
    capabilityType: CapabilityType.SIMULATION,
    description: 'Simulate scenarios and predict outcomes',
    safetyLevel: CapabilitySafetyLevel.SAFE,
    replaySafe: true,
    runtimeSafe: true,
    composable: true,
    requiredPermissions: ['simulation_authority'],
  },
  [CapabilityType.RECOVERY]: {
    capabilityType: CapabilityType.RECOVERY,
    description: 'Recover from failures and maintain resilience',
    safetyLevel: CapabilitySafetyLevel.REQUIRES_GOVERNANCE,
    replaySafe: true,
    runtimeSafe: true,
    composable: true,
    requiredPermissions: ['recovery_authority'],
  },
  [CapabilityType.OPTIMIZATION]: {
    capabilityType: CapabilityType.OPTIMIZATION,
    description: 'Optimize resource utilization and performance',
    safetyLevel: CapabilitySafetyLevel.CONDITIONALLY_SAFE,
    replaySafe: true,
    runtimeSafe: true,
    composable: true,
    requiredPermissions: ['optimization_authority'],
  },
  [CapabilityType.OBSERVABILITY]: {
    capabilityType: CapabilityType.OBSERVABILITY,
    description: 'Monitor system state and collect diagnostics',
    safetyLevel: CapabilitySafetyLevel.SAFE,
    replaySafe: true,
    runtimeSafe: true,
    composable: true,
    requiredPermissions: ['observability_authority'],
  },
  [CapabilityType.COORDINATION]: {
    capabilityType: CapabilityType.COORDINATION,
    description: 'Coordinate multi-agent activities',
    safetyLevel: CapabilitySafetyLevel.REQUIRES_VALIDATION,
    replaySafe: true,
    runtimeSafe: true,
    composable: true,
    requiredPermissions: ['coordination_authority'],
  },
  [CapabilityType.COMMUNICATION]: {
    capabilityType: CapabilityType.COMMUNICATION,
    description: 'Communicate with other agents',
    safetyLevel: CapabilitySafetyLevel.SAFE,
    replaySafe: true,
    runtimeSafe: true,
    composable: true,
    requiredPermissions: ['communication_authority'],
  },
};

/**
 * Agent capability permissions
 */
export const AGENT_CAPABILITY_PERMISSIONS: readonly AgentCapabilityPermission[] = [
  // PLANNER permissions
  {
    agentType: CanonicalAgentType.PLANNER,
    capabilityType: CapabilityType.PLANNING,
    permissionLevel: CapabilityPermission.GRANTED,
  },
  {
    agentType: CanonicalAgentType.PLANNER,
    capabilityType: CapabilityType.COORDINATION,
    permissionLevel: CapabilityPermission.GRANTED,
  },
  {
    agentType: CanonicalAgentType.PLANNER,
    capabilityType: CapabilityType.ROUTING,
    permissionLevel: CapabilityPermission.GRANTED,
  },
  {
    agentType: CanonicalAgentType.PLANNER,
    capabilityType: CapabilityType.COMMUNICATION,
    permissionLevel: CapabilityPermission.GRANTED,
  },
  {
    agentType: CanonicalAgentType.PLANNER,
    capabilityType: CapabilityType.SIMULATION,
    permissionLevel: CapabilityPermission.GRANTED,
  },
  // EXECUTOR permissions
  {
    agentType: CanonicalAgentType.EXECUTOR,
    capabilityType: CapabilityType.EXECUTION,
    permissionLevel: CapabilityPermission.GRANTED,
  },
  {
    agentType: CanonicalAgentType.EXECUTOR,
    capabilityType: CapabilityType.VALIDATION,
    permissionLevel: CapabilityPermission.GRANTED,
  },
  {
    agentType: CanonicalAgentType.EXECUTOR,
    capabilityType: CapabilityType.COMMUNICATION,
    permissionLevel: CapabilityPermission.GRANTED,
  },
  {
    agentType: CanonicalAgentType.EXECUTOR,
    capabilityType: CapabilityType.COORDINATION,
    permissionLevel: CapabilityPermission.GRANTED,
  },
  // VALIDATOR permissions
  {
    agentType: CanonicalAgentType.VALIDATOR,
    capabilityType: CapabilityType.VALIDATION,
    permissionLevel: CapabilityPermission.GRANTED,
  },
  {
    agentType: CanonicalAgentType.VALIDATOR,
    capabilityType: CapabilityType.ANALYSIS,
    permissionLevel: CapabilityPermission.GRANTED,
  },
  {
    agentType: CanonicalAgentType.VALIDATOR,
    capabilityType: CapabilityType.COMMUNICATION,
    permissionLevel: CapabilityPermission.GRANTED,
  },
  // GOVERNOR permissions
  {
    agentType: CanonicalAgentType.GOVERNOR,
    capabilityType: CapabilityType.GOVERNANCE,
    permissionLevel: CapabilityPermission.GRANTED,
  },
  {
    agentType: CanonicalAgentType.GOVERNOR,
    capabilityType: CapabilityType.VALIDATION,
    permissionLevel: CapabilityPermission.GRANTED,
  },
  {
    agentType: CanonicalAgentType.GOVERNOR,
    capabilityType: CapabilityType.COMMUNICATION,
    permissionLevel: CapabilityPermission.GRANTED,
  },
  {
    agentType: CanonicalAgentType.GOVERNOR,
    capabilityType: CapabilityType.COORDINATION,
    permissionLevel: CapabilityPermission.GRANTED,
  },
  // ANALYZER permissions
  {
    agentType: CanonicalAgentType.ANALYZER,
    capabilityType: CapabilityType.ANALYSIS,
    permissionLevel: CapabilityPermission.GRANTED,
  },
  {
    agentType: CanonicalAgentType.ANALYZER,
    capabilityType: CapabilityType.VALIDATION,
    permissionLevel: CapabilityPermission.GRANTED,
  },
  {
    agentType: CanonicalAgentType.ANALYZER,
    capabilityType: CapabilityType.COMMUNICATION,
    permissionLevel: CapabilityPermission.GRANTED,
  },
  // ROUTER permissions
  {
    agentType: CanonicalAgentType.ROUTER,
    capabilityType: CapabilityType.ROUTING,
    permissionLevel: CapabilityPermission.GRANTED,
  },
  {
    agentType: CanonicalAgentType.ROUTER,
    capabilityType: CapabilityType.COORDINATION,
    permissionLevel: CapabilityPermission.GRANTED,
  },
  {
    agentType: CanonicalAgentType.ROUTER,
    capabilityType: CapabilityType.COMMUNICATION,
    permissionLevel: CapabilityPermission.GRANTED,
  },
  {
    agentType: CanonicalAgentType.ROUTER,
    capabilityType: CapabilityType.OPTIMIZATION,
    permissionLevel: CapabilityPermission.GRANTED,
  },
  // SIMULATOR permissions
  {
    agentType: CanonicalAgentType.SIMULATOR,
    capabilityType: CapabilityType.SIMULATION,
    permissionLevel: CapabilityPermission.GRANTED,
  },
  {
    agentType: CanonicalAgentType.SIMULATOR,
    capabilityType: CapabilityType.ANALYSIS,
    permissionLevel: CapabilityPermission.GRANTED,
  },
  {
    agentType: CanonicalAgentType.SIMULATOR,
    capabilityType: CapabilityType.COMMUNICATION,
    permissionLevel: CapabilityPermission.GRANTED,
  },
  // RECOVERER permissions
  {
    agentType: CanonicalAgentType.RECOVERER,
    capabilityType: CapabilityType.RECOVERY,
    permissionLevel: CapabilityPermission.GRANTED,
  },
  {
    agentType: CanonicalAgentType.RECOVERER,
    capabilityType: CapabilityType.COORDINATION,
    permissionLevel: CapabilityPermission.GRANTED,
  },
  {
    agentType: CanonicalAgentType.RECOVERER,
    capabilityType: CapabilityType.COMMUNICATION,
    permissionLevel: CapabilityPermission.GRANTED,
  },
  {
    agentType: CanonicalAgentType.RECOVERER,
    capabilityType: CapabilityType.VALIDATION,
    permissionLevel: CapabilityPermission.GRANTED,
  },
  // OBSERVER permissions
  {
    agentType: CanonicalAgentType.OBSERVER,
    capabilityType: CapabilityType.OBSERVABILITY,
    permissionLevel: CapabilityPermission.GRANTED,
  },
  {
    agentType: CanonicalAgentType.OBSERVER,
    capabilityType: CapabilityType.COMMUNICATION,
    permissionLevel: CapabilityPermission.GRANTED,
  },
  {
    agentType: CanonicalAgentType.OBSERVER,
    capabilityType: CapabilityType.ANALYSIS,
    permissionLevel: CapabilityPermission.GRANTED,
  },
];

/**
 * Capability compositions
 */
export const CAPABILITY_COMPOSITIONS: readonly CapabilityComposition[] = [
  {
    compositionId: 'plan_execute_validate',
    capabilities: [CapabilityType.PLANNING, CapabilityType.EXECUTION, CapabilityType.VALIDATION],
    compositionType: 'sequential',
  },
  {
    compositionId: 'analyze_simulate_plan',
    capabilities: [CapabilityType.ANALYSIS, CapabilityType.SIMULATION, CapabilityType.PLANNING],
    compositionType: 'sequential',
  },
  {
    compositionId: 'route_execute_coordinate',
    capabilities: [CapabilityType.ROUTING, CapabilityType.EXECUTION, CapabilityType.COORDINATION],
    compositionType: 'parallel',
  },
  {
    compositionId: 'govern_validate_observe',
    capabilities: [CapabilityType.GOVERNANCE, CapabilityType.VALIDATION, CapabilityType.OBSERVABILITY],
    compositionType: 'parallel',
  },
];

/**
 * Capability registry
 */
export const CAPABILITY_REGISTRY: CapabilityRegistry = {
  capabilityContracts: CAPABILITY_CONTRACTS,
  agentCapabilityPermissions: AGENT_CAPABILITY_PERMISSIONS,
  capabilityCompositions: CAPABILITY_COMPOSITIONS,
};
