/**
 * Runtime Orchestrator Index
 *
 * Central export point for all orchestrator components
 * REMOVED: Over-engineered orchestrator types and components removed in Phase 2A
 * Only V1 minimal stubs remain - agents should use RuntimeService directly
 */

// REMOVED: Types and validation helpers - V1 stubs don't need complex types
// export type {
//   OrchestratorConfig,
//   OrchestratorContext,
//   ExecutionPlan,
//   TaskPlan,
//   ExecutionLifecycleState,
//   TaskLifecycleState,
//   RecoveryStrategy,
//   RetryPolicy,
//   OrchestratorResult,
//   OrchestratorError,
//   LifecycleHooks,
// } from './types';
// export {
//   generateExecutionPlan,
//   validateExecutionPlan,
//   validateTaskDependencies,
//   calculateExecutionProgress,
//   calculateTaskProgress,
//   createOrchestratorError,
//   toOrchestratorResult,
// } from './types';

// Execution orchestrator (V1 minimal stub)
export { ExecutionOrchestrator } from './execution-orchestrator';

// Task orchestrator (V1 minimal stub)
export { TaskOrchestrator } from './task-orchestrator';

// REMOVED: Over-engineered orchestrators - V1 stubs only
// export { LifecycleOrchestrator } from './lifecycle-orchestrator';
// export { EventOrchestrator } from './event-orchestrator';
// export { RecoveryOrchestrator } from './recovery-orchestrator';
// export type { RuntimeOrchestratorConfig } from './orchestrator';
// export { RuntimeOrchestrator, createRuntimeOrchestrator } from './orchestrator';
