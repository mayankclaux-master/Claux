/**
 * CLAUX Agent Runtime System
 * Core runtime infrastructure for all agents
 * 
 * DEPRECATED: This module is being removed in Phase 2B.
 * Use RuntimeService and ExecutionOrchestrator instead.
 */

export * from './types';
export * from './errors';

// REMOVED: AgentRuntimeDatabase (conflicts with canonical runtime services)
// REMOVED: AgentRuntimeSDK (conflicts with ExecutionOrchestrator)
// See CLAUX_PHASE_2A_RUNTIME_DATABASE_AUDIT.md for migration path
