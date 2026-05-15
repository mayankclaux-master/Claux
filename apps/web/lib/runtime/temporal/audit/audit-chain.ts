/**
 * CLAUX Runtime Temporal Layer - Audit Chain
 * 
 * Audit chain management for linked audit entries.
 * No external dependencies - pure chain semantics.
 */

import type { AuditChain, AuditEntry, ExecutionId, AuditId } from '../types';

/**
 * Audit Chain Manager
 * 
 * Audit chain management for linked audit entries.
 */
export class AuditChainManager {
  private chains: Map<string, AuditChain> = new Map();

  /**
   * Create chain
   */
  createChain(chainId: string, executionId: ExecutionId): AuditChain {
    const chain: AuditChain = {
      chainId,
      executionId,
      entries: [],
      headAuditId: '' as AuditId,
      tailAuditId: '' as AuditId,
      length: 0,
    };

    this.chains.set(chainId, chain);
    return chain;
  }

  /**
   * Append entry to chain
   */
  appendToChain(chainId: string, entry: AuditEntry): void {
    const chain = this.chains.get(chainId);
    if (!chain) return;

    const updatedEntries = [...chain.entries, entry];
    const updatedChain: AuditChain = {
      ...chain,
      entries: updatedEntries,
      headAuditId: entry.auditId,
      tailAuditId: chain.entries.length > 0 ? chain.entries[0].auditId : entry.auditId,
      length: updatedEntries.length,
    };

    this.chains.set(chainId, updatedChain);
  }

  /**
   * Get chain
   */
  getChain(chainId: string): AuditChain | undefined {
    return this.chains.get(chainId);
  }

  /**
   * Get chain for execution
   */
  getChainForExecution(executionId: ExecutionId): AuditChain | undefined {
    for (const chain of this.chains.values()) {
      if (chain.executionId === executionId) {
        return chain;
      }
    }
    return undefined;
  }

  /**
   * Verify chain continuity
   */
  verifyChainContinuity(chainId: string): boolean {
    const chain = this.chains.get(chainId);
    if (!chain || chain.entries.length === 0) return true;

    for (let i = 0; i < chain.entries.length - 1; i++) {
      const current = chain.entries[i];
      const next = chain.entries[i + 1];

      if (current.previousAuditId && current.previousAuditId !== next.previousAuditId) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get chain statistics
   */
  getChainStatistics(chainId: string): {
    length: number;
    auditTypes: Map<string, number>;
  } | undefined {
    const chain = this.chains.get(chainId);
    if (!chain) return undefined;

    const auditTypes = new Map<string, number>();

    for (const entry of chain.entries) {
      const count = auditTypes.get(entry.auditType) || 0;
      auditTypes.set(entry.auditType, count + 1);
    }

    return {
      length: chain.length,
      auditTypes,
    };
  }

  /**
   * Clear chain
   */
  clearChain(chainId: string): void {
    this.chains.delete(chainId);
  }

  /**
   * Clear all chains
   */
  clear(): void {
    this.chains.clear();
  }
}
