/**
 * Beta Tenant Allowlist System
 * 
 * Creates controlled beta allowlist:
 * - Approved domains
 * - Approved tenant IDs
 * - Approved operator emails
 * - Onboarding approval states
 * - Beta access expiration
 * - Manual activation required
 * 
 * Blocks all non-approved tenants.
 */

import { createLogger, Logger } from '@/lib/utils/logger';

/**
 * Approval state
 */
export enum ApprovalState {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
  SUSPENDED = 'suspended',
}

/**
 * Beta tenant allowlist entry
 */
export interface BetaTenantAllowlistEntry {
  tenantId: string;
  domain: string;
  operatorEmail: string;
  approvalState: ApprovalState;
  approvedAt?: number;
  approvedBy?: string;
  expiresAt?: number;
  manuallyActivated: boolean;
  activatedAt?: number;
  activatedBy?: string;
  notes?: string;
}

/**
 * Beta tenant allowlist system
 */
export class BetaTenantAllowlistSystem {
  private logger: Logger;
  private allowlist: Map<string, BetaTenantAllowlistEntry> = new Map();

  constructor() {
    this.logger = createLogger();
  }

  /**
   * Add tenant to allowlist
   */
  addToAllowlist(entry: Omit<BetaTenantAllowlistEntry, 'approvalState' | 'manuallyActivated'>): void {
    const allowlistEntry: BetaTenantAllowlistEntry = {
      ...entry,
      approvalState: ApprovalState.PENDING,
      manuallyActivated: false,
    };

    this.allowlist.set(entry.tenantId, allowlistEntry);
    this.logger.info('Tenant added to allowlist', { tenantId: entry.tenantId });
  }

  /**
   * Approve tenant
   */
  approveTenant(tenantId: string, approvedBy: string, expiresAt?: number): boolean {
    const entry = this.allowlist.get(tenantId);
    if (!entry) {
      this.logger.warn('Tenant not found in allowlist', { tenantId });
      return false;
    }

    entry.approvalState = ApprovalState.APPROVED;
    entry.approvedAt = Date.now();
    entry.approvedBy = approvedBy;
    if (expiresAt) {
      entry.expiresAt = expiresAt;
    }

    this.logger.info('Tenant approved', { tenantId, approvedBy });
    return true;
  }

  /**
   * Reject tenant
   */
  rejectTenant(tenantId: string, rejectedBy: string, reason?: string): boolean {
    const entry = this.allowlist.get(tenantId);
    if (!entry) {
      this.logger.warn('Tenant not found in allowlist', { tenantId });
      return false;
    }

    entry.approvalState = ApprovalState.REJECTED;
    entry.notes = reason;

    this.logger.info('Tenant rejected', { tenantId, rejectedBy, reason });
    return true;
  }

  /**
   * Manually activate tenant
   */
  manuallyActivateTenant(tenantId: string, activatedBy: string): boolean {
    const entry = this.allowlist.get(tenantId);
    if (!entry) {
      this.logger.warn('Tenant not found in allowlist', { tenantId });
      return false;
    }

    if (entry.approvalState !== ApprovalState.APPROVED) {
      this.logger.warn('Cannot activate non-approved tenant', { tenantId, state: entry.approvalState });
      return false;
    }

    entry.manuallyActivated = true;
    entry.activatedAt = Date.now();
    entry.activatedBy = activatedBy;

    this.logger.info('Tenant manually activated', { tenantId, activatedBy });
    return true;
  }

  /**
   * Suspend tenant
   */
  suspendTenant(tenantId: string, suspendedBy: string, reason?: string): boolean {
    const entry = this.allowlist.get(tenantId);
    if (!entry) {
      this.logger.warn('Tenant not found in allowlist', { tenantId });
      return false;
    }

    entry.approvalState = ApprovalState.SUSPENDED;
    entry.notes = reason;

    this.logger.info('Tenant suspended', { tenantId, suspendedBy, reason });
    return true;
  }

  /**
   * Check if tenant is allowed
   */
  isTenantAllowed(tenantId: string): boolean {
    const entry = this.allowlist.get(tenantId);
    if (!entry) {
      return false;
    }

    // Check approval state
    if (entry.approvalState !== ApprovalState.APPROVED) {
      return false;
    }

    // Check manual activation
    if (!entry.manuallyActivated) {
      return false;
    }

    // Check expiration
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      entry.approvalState = ApprovalState.EXPIRED;
      this.logger.warn('Tenant access expired', { tenantId });
      return false;
    }

    return true;
  }

  /**
   * Check if domain is allowed
   */
  isDomainAllowed(domain: string): boolean {
    for (const entry of this.allowlist.values()) {
      if (entry.domain === domain && this.isTenantAllowed(entry.tenantId)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if operator email is allowed
   */
  isOperatorAllowed(email: string): boolean {
    for (const entry of this.allowlist.values()) {
      if (entry.operatorEmail === email && this.isTenantAllowed(entry.tenantId)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Get tenant entry
   */
  getTenantEntry(tenantId: string): BetaTenantAllowlistEntry | undefined {
    return this.allowlist.get(tenantId);
  }

  /**
   * Get all tenants by state
   */
  getTenantsByState(state: ApprovalState): BetaTenantAllowlistEntry[] {
    return Array.from(this.allowlist.values()).filter(e => e.approvalState === state);
  }

  /**
   * Get expired tenants
   */
  getExpiredTenants(): BetaTenantAllowlistEntry[] {
    return Array.from(this.allowlist.values()).filter(e => 
      e.expiresAt && Date.now() > e.expiresAt
    );
  }

  /**
   * Get pending activation tenants
   */
  getPendingActivationTenants(): BetaTenantAllowlistEntry[] {
    return Array.from(this.allowlist.values()).filter(e => 
      e.approvalState === ApprovalState.APPROVED && !e.manuallyActivated
    );
  }

  /**
   * Generate allowlist report
   */
  generateAllowlistReport(): string {
    const total = this.allowlist.size;
    const byState: Record<string, number> = {};

    this.allowlist.forEach(entry => {
      byState[entry.approvalState] = (byState[entry.approvalState] || 0) + 1;
    });

    const pendingActivation = this.getPendingActivationTenants();
    const expired = this.getExpiredTenants();

    let report = '=== Beta Tenant Allowlist Report ===\n';
    report += `Generated: ${new Date().toISOString()}\n`;
    report += `Total Tenants: ${total}\n\n`;

    report += '--- By Approval State ---\n';
    Object.entries(byState).forEach(([state, count]) => {
      report += `${state}: ${count}\n`;
    });

    if (pendingActivation.length > 0) {
      report += '\n--- Pending Activation ---\n';
      pendingActivation.forEach(e => {
        report += `${e.tenantId} (${e.domain}) - Approved by ${e.approvedBy}\n`;
      });
    }

    if (expired.length > 0) {
      report += '\n--- Expired ---\n';
      expired.forEach(e => {
        report += `${e.tenantId} (${e.domain}) - Expired at ${new Date(e.expiresAt!).toISOString()}\n`;
      });
    }

    return report;
  }

  /**
   * Clear allowlist (for testing only)
   */
  clearAllowlist(): void {
    this.logger.warn('Allowlist cleared');
    this.allowlist.clear();
  }
}

/**
 * Singleton instance
 */
export const betaTenantAllowlistSystem = new BetaTenantAllowlistSystem();
