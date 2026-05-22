/**
 * CLAUX Runtime Execution Engine
 * 
 * Main entry point for the execution engine layer.
 * 
 * DEPRECATED: Most speculative execution infrastructure has been removed.
 * The canonical execution path is:
 * API Route → Agent Service → RuntimeService → ExecutionOrchestrator → TaskOrchestrator → TaskExecutorFactory → RuntimeTaskExecutor → Connector
 * 
 * Remaining exports are for type definitions and utilities only.
 */

// Core types and constants
export * from './types';
export * from './constants';
export * from './errors';

// State module (used by actual execution path)
export * from './state';

// Utilities
export { MetricsCollector } from './metrics';
export { Validator } from './validation';
