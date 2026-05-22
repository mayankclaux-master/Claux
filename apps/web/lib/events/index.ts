/**
 * CLAUX Event System
 * Event-driven architecture for agent orchestration
 * 
 * DEPRECATED: This module is being removed in Phase 2B.
 * Use EventService from runtime/services instead.
 */

export * from './types';
export * from './listener';

// REMOVED: EventEmitter (conflicts with canonical EventService)
// Use EventService.publishEvent() instead
// See CLAUX_EVENT_AUTHORITY_MATRIX.md for migration path
