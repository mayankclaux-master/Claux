/**
 * Controlled Tenant Allowlist
 * 
 * Only allows:
 * - Internal tenants
 * - Explicit allowlisted domains
 * 
 * Hard blocks all others.
 */

import { createLogger, Logger } from '@/lib/utils/logger';

/**
 * Allowlist entry
 */
export interface AllowlistEntry {
  tenantId: string;
  domain?: string;
  type: 'internal' | 'allowlisted';
  addedAt: number;
  addedBy?: string;
  notes?: string;
}

/**
 * Allowlist check result
 */
export interface AllowlistCheckResult {
  allowed: boolean;
  reason?: string;
  tenantId: string;
  type?: 'internal' | 'allowlisted' | 'blocked';
}

/**
 * Controlled tenant allowlist service
 */
export class ControlledTenantAllowlist {
  private logger: Logger;
  private allowlist: AllowlistEntry[] = [];
  private internalTenantPrefixes: string[] = ['internal-', 'test-', 'dev-'];

  constructor() {
    this.logger = createLogger();
    this.initializeAllowlist();
  }

  /**
   * Initialize allowlist with internal tenants
   */
  private initializeAllowlist(): void {
    // Add internal tenants by default
    this.addInternalTenant('internal-claux');
    this.addInternalTenant('internal-admin');
    this.addInternalTenant('test-claux');
  }

  /**
   * Add internal tenant
   */
  addInternalTenant(tenantId: string): void {
    const entry: AllowlistEntry = {
      tenantId,
      type: 'internal',
      addedAt: Date.now(),
    };

    this.allowlist.push(entry);
    this.logger.info('Internal tenant added to allowlist', { tenantId });
  }

  /**
   * Add allowlisted domain
   */
  addAllowlistedDomain(domain: string, tenantId: string, addedBy?: string, notes?: string): void {
    const entry: AllowlistEntry = {
      tenantId,
      domain,
      type: 'allowlisted',
      addedAt: Date.now(),
      addedBy,
      notes,
    };

    this.allowlist.push(entry);
    this.logger.info('Domain added to allowlist', { domain, tenantId });
  }

  /**
   * Check if tenant is allowed
   */
  isTenantAllowed(tenantId: string): AllowlistCheckResult {
    // Check if tenant is internal
    if (this.isInternalTenant(tenantId)) {
      return {
        allowed: true,
        tenantId,
        type: 'internal',
      };
    }

    // Check if tenant is explicitly allowlisted
    const allowlisted = this.allowlist.find(
      entry => entry.tenantId === tenantId && entry.type === 'allowlisted'
    );

    if (allowlisted) {
      return {
        allowed: true,
        tenantId,
        type: 'allowlisted',
      };
    }

    // Tenant is not allowed
    return {
      allowed: false,
      reason: 'Tenant is not on the allowlist',
      tenantId,
      type: 'blocked',
    };
  }

  /**
   * Check if domain is allowed
   */
  isDomainAllowed(domain: string): AllowlistCheckResult {
    // Check if domain is explicitly allowlisted
    const allowlisted = this.allowlist.find(
      entry => entry.domain === domain && entry.type === 'allowlisted'
    );

    if (allowlisted) {
      return {
        allowed: true,
        tenantId: allowlisted.tenantId,
        type: 'allowlisted',
      };
    }

    // Domain is not allowed
    return {
      allowed: false,
      reason: 'Domain is not on the allowlist',
      tenantId: domain,
      type: 'blocked',
    };
  }

  /**
   * Check if tenant is internal
   */
  private isInternalTenant(tenantId: string): boolean {
    return this.internalTenantPrefixes.some(prefix => tenantId.startsWith(prefix));
  }

  /**
   * Require tenant to be allowed
   */
  requireTenantAllowed(tenantId: string): void {
    const result = this.isTenantAllowed(tenantId);

    if (!result.allowed) {
      const error = new Error(result.reason || 'Tenant is not allowed');
      this.logger.error('Tenant allowlist check failed', { result });
      throw error;
    }
  }

  /**
   * Require domain to be allowed
   */
  requireDomainAllowed(domain: string): void {
    const result = this.isDomainAllowed(domain);

    if (!result.allowed) {
      const error = new Error(result.reason || 'Domain is not allowed');
      this.logger.error('Domain allowlist check failed', { result });
      throw error;
    }
  }

  /**
   * Get all allowlist entries
   */
  getAllowlist(): AllowlistEntry[] {
    return [...this.allowlist];
  }

  /**
   * Get internal tenants
   */
  getInternalTenants(): AllowlistEntry[] {
    return this.allowlist.filter(entry => entry.type === 'internal');
  }

  /**
   * Get allowlisted domains
   */
  getAllowlistedDomains(): AllowlistEntry[] {
    return this.allowlist.filter(entry => entry.type === 'allowlisted');
  }

  /**
   * Remove tenant from allowlist (only allowlisted domains, not internal)
   */
  removeTenant(tenantId: string): boolean {
    const index = this.allowlist.findIndex(
      entry => entry.tenantId === tenantId && entry.type === 'allowlisted'
    );

    if (index !== -1) {
      this.allowlist.splice(index, 1);
      this.logger.info('Tenant removed from allowlist', { tenantId });
      return true;
    }

    return false;
  }

  /**
   * Remove domain from allowlist
   */
  removeDomain(domain: string): boolean {
    const index = this.allowlist.findIndex(
      entry => entry.domain === domain && entry.type === 'allowlisted'
    );

    if (index !== -1) {
      this.allowlist.splice(index, 1);
      this.logger.info('Domain removed from allowlist', { domain });
      return true;
    }

    return false;
  }

  /**
   * Generate allowlist report
   */
  generateAllowlistReport(): string {
    const internalTenants = this.getInternalTenants();
    const allowlistedDomains = this.getAllowlistedDomains();

    let report = '=== Controlled Tenant Allowlist Report ===\n';
    report += `Generated: ${new Date().toISOString()}\n\n`;

    report += '--- Internal Tenants ---\n';
    if (internalTenants.length === 0) {
      report += 'No internal tenants\n';
    } else {
      internalTenants.forEach(entry => {
        report += `${entry.tenantId}\n`;
        report += `  Added: ${new Date(entry.addedAt).toISOString()}\n`;
      });
    }

    report += '\n--- Allowlisted Domains ---\n';
    if (allowlistedDomains.length === 0) {
      report += 'No allowlisted domains\n';
    } else {
      allowlistedDomains.forEach(entry => {
        report += `${entry.domain} (Tenant: ${entry.tenantId})\n`;
        report += `  Added: ${new Date(entry.addedAt).toISOString()}\n`;
        if (entry.addedBy) {
          report += `  Added By: ${entry.addedBy}\n`;
        }
        if (entry.notes) {
          report += `  Notes: ${entry.notes}\n`;
        }
      });
    }

    report += '\n--- Internal Tenant Prefixes ---\n';
    this.internalTenantPrefixes.forEach(prefix => {
      report += `${prefix}*\n`;
    });

    return report;
  }

  /**
   * Clear allowlist (for testing only)
   */
  clearAllowlist(): void {
    this.logger.warn('Allowlist cleared');
    this.allowlist = [];
    this.initializeAllowlist();
  }
}

/**
 * Singleton instance
 */
export const controlledTenantAllowlist = new ControlledTenantAllowlist();
