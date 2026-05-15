/**
 * CLAUX Runtime Temporal Layer - Main Entry Point
 * 
 * Event sourcing and temporal persistence.
 * No external dependencies - pure temporal semantics.
 */

export * from './types';
export * from './constants';
export * from './errors';
export * from './journal';
export * from './sourcing';
export * from './snapshots';
export * from './lineage';
export * from './temporal';
export * from './replay';
export * from './audit';
export * from './runtime';
export { TemporalValidator, type ValidationResult } from './validation';
export { TemporalMetricsCollector } from './metrics';
export { TemporalFacade } from './temporal.facade';
