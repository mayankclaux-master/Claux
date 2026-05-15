/**
 * CLAUX Agent Observability Model Types
 * 
 * This file defines the agent observability model including:
 * - telemetry ownership
 * - tracing ownership
 * - logging ownership
 * - replay inspection ownership
 * - runtime inspection ownership
 * - diagnostics ownership
 * - health ownership
 */

import { CanonicalAgentType } from '../system/types';

/**
 * Observability scope
 */
export enum ObservabilityScope {
  /**
   * TELEMETRY - Telemetry ownership
   */
  TELEMETRY = 'telemetry',

  /**
   * TRACING - Tracing ownership
   */
  TRACING = 'tracing',

  /**
   * LOGGING - Logging ownership
   */
  LOGGING = 'logging',

  /**
   * REPLAY_INSPECTION - Replay inspection ownership
   */
  REPLAY_INSPECTION = 'replay_inspection',

  /**
   * RUNTIME_INSPECTION - Runtime inspection ownership
   */
  RUNTIME_INSPECTION = 'runtime_inspection',

  /**
   * DIAGNOSTICS - Diagnostics ownership
   */
  DIAGNOSTICS = 'diagnostics',

  /**
   * HEALTH - Health ownership
   */
  HEALTH = 'health',
}

/**
 * Observability access level
 */
export enum ObservabilityAccessLevel {
  /**
   * OWN - Owns the observability data
   */
  OWN = 'own',

  /**
   * READ - Read access
   */
  READ = 'read',

  /**
   * WRITE - Write access
   */
  WRITE = 'write',

  /**
   * ADMIN - Admin access
   */
  ADMIN = 'admin',
}

/**
 * Observability ownership
 */
export interface ObservabilityOwnership {
  /**
   * Agent type
   */
  readonly agentType: CanonicalAgentType;

  /**
   * Observability scope
   */
  readonly scope: ObservabilityScope;

  /**
   * Access level
   */
  readonly accessLevel: ObservabilityAccessLevel;

  /**
   * Scope
   */
  readonly scopeLevel: 'agent' | 'workflow' | 'session' | 'system';
}

/**
 * Agent observability model
 */
export interface AgentObservabilityModel {
  /**
   * Agent type
   */
  readonly agentType: CanonicalAgentType;

  /**
   * Observability ownerships
   */
  readonly observabilityOwnerships: readonly ObservabilityOwnership[];
}
