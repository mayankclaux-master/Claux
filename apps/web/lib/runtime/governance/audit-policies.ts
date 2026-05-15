/**
 * CLAUX Runtime Governance Layer - Audit Policies
 */

import type { PolicyContext } from './types';

/**
 * Audit Record
 */
export interface AuditRecord {
  readonly timestamp: number;
  readonly context: PolicyContext;
  readonly result: string;
  readonly reason?: string;
}

/**
 * Audit Policy Manager
 */
export class AuditPolicyManager {
  private records: AuditRecord[] = [];

  /**
   * Record audit
   */
  record(context: PolicyContext, result: string, reason?: string): void {
    const record: AuditRecord = {
      timestamp: Date.now(),
      context,
      result,
      reason,
    };
    this.records.push(record);
  }

  /**
   * Query records
   */
  query(filter: (record: AuditRecord) => boolean): readonly AuditRecord[] {
    return this.records.filter(filter);
  }

  /**
   * Get records by tenant
   */
  getByTenant(tenantId: string): readonly AuditRecord[] {
    return this.query(r => r.context.tenantId === tenantId);
  }

  /**
   * Get records by time range
   */
  getByTimeRange(start: number, end: number): readonly AuditRecord[] {
    return this.query(r => r.timestamp >= start && r.timestamp <= end);
  }

  /**
   * Clear
   */
  clear(): void {
    this.records = [];
  }
}
