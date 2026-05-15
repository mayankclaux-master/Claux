/**
 * CLAUX Runtime Temporal Layer - Causality Chain
 * 
 * Causality chain tracking and traversal.
 * No external dependencies - pure causality semantics.
 */

import type { CausationId, EventId, ExecutionId, TemporalTimestamp, CausationChain } from '../types';
import { CausalityError } from '../errors';
import { DEFAULT_CAUSALITY_MAX_DEPTH } from '../constants';

/**
 * Causality Chain Manager
 * 
 * Causality chain tracking and traversal.
 */
export class CausalityChainManager {
  private chains: Map<CausationId, CausationChain> = new Map();
  private eventIndex: Map<EventId, CausationId> = new Map();
  private executionIndex: Map<ExecutionId, CausationId[]> = new Map();

  /**
   * Create causation chain
   */
  createChain(causationId: CausationId, eventId: EventId, executionId: ExecutionId, timestamp: TemporalTimestamp): CausationChain {
    const chain: CausationChain = {
      causationId,
      chain: [causationId],
      rootCausationId: causationId,
      depth: 1,
    };

    this.chains.set(causationId, chain);
    this.eventIndex.set(eventId, causationId);

    const executionCausations = this.executionIndex.get(executionId) || [];
    this.executionIndex.set(executionId, [...executionCausations, causationId]);

    return chain;
  }

  /**
   * Extend causation chain
   */
  extendChain(parentCausationId: CausationId, newCausationId: CausationId, eventId: EventId, executionId: ExecutionId, timestamp: TemporalTimestamp): CausationChain {
    const parentChain = this.chains.get(parentCausationId);
    if (!parentChain) {
      throw new CausalityError(`Parent causation chain ${parentCausationId} not found`, parentCausationId);
    }

    if (parentChain.depth >= DEFAULT_CAUSALITY_MAX_DEPTH) {
      throw new CausalityError(`Causation chain depth exceeds maximum ${DEFAULT_CAUSALITY_MAX_DEPTH}`, parentCausationId);
    }

    const chain: CausationChain = {
      causationId: newCausationId,
      chain: [...parentChain.chain, newCausationId],
      rootCausationId: parentChain.rootCausationId,
      depth: parentChain.depth + 1,
    };

    this.chains.set(newCausationId, chain);
    this.eventIndex.set(eventId, newCausationId);

    const executionCausations = this.executionIndex.get(executionId) || [];
    this.executionIndex.set(executionId, [...executionCausations, newCausationId]);

    return chain;
  }

  /**
   * Get causation chain
   */
  getChain(causationId: CausationId): CausationChain | undefined {
    return this.chains.get(causationId);
  }

  /**
   * Get causation for event
   */
  getCausationForEvent(eventId: EventId): CausationId | undefined {
    return this.eventIndex.get(eventId);
  }

  /**
   * Get causations for execution
   */
  getCausationsForExecution(executionId: ExecutionId): readonly CausationId[] {
    return this.executionIndex.get(executionId) || [];
  }

  /**
   * Get root causation
   */
  getRootCausation(causationId: CausationId): CausationId | undefined {
    const chain = this.chains.get(causationId);
    return chain?.rootCausationId;
  }

  /**
   * Get chain depth
   */
  getChainDepth(causationId: CausationId): number {
    const chain = this.chains.get(causationId);
    return chain?.depth || 0;
  }

  /**
   * Traverse chain
   */
  traverseChain(causationId: CausationId): readonly CausationId[] {
    const chain = this.chains.get(causationId);
    return chain?.chain || [];
  }

  /**
   * Validate causality integrity
   */
  validateCausalityIntegrity(causationId: CausationId): boolean {
    const chain = this.chains.get(causationId);
    if (!chain) return false;

    // Verify chain continuity
    for (let i = 0; i < chain.chain.length - 1; i++) {
      const current = chain.chain[i];
      const next = chain.chain[i + 1];
      const nextChain = this.chains.get(next);

      if (!nextChain || nextChain.chain[nextChain.chain.length - 2] !== current) {
        return false;
      }
    }

    return true;
  }

  /**
   * Clear chain
   */
  clearChain(causationId: CausationId): void {
    const chain = this.chains.get(causationId);
    if (!chain) return;

    // Remove event index entries
    for (const [eventId, cid] of this.eventIndex) {
      if (cid === causationId || chain.chain.includes(cid)) {
        this.eventIndex.delete(eventId);
      }
    }

    this.chains.delete(causationId);
  }

  /**
   * Clear all chains
   */
  clear(): void {
    this.chains.clear();
    this.eventIndex.clear();
    this.executionIndex.clear();
  }
}
