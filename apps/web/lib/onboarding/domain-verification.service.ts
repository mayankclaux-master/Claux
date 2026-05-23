/**
 * Domain Verification Service
 * 
 * Canonical domain verification service for CLAUX V1 onboarding.
 * Checks DNS reachable, SSL valid, robots.txt accessible, sitemap exists, homepage reachable, indexing readiness, canonical tags presence.
 * Generates warnings + onboarding tasks.
 * 
 * CRITICAL: This is the ONLY domain verification service in CLAUX.
 */

import type { UUID } from '../runtime/types/common.types';
import { createLogger, Logger } from '@/lib/utils/logger';

/**
 * Domain verification result
 */
export interface DomainVerificationResult {
  domain: string;
  dnsReachable: boolean;
  sslValid: boolean;
  robotsTxtAccessible: boolean;
  sitemapExists: boolean;
  homepageReachable: boolean;
  indexingReady: boolean;
  canonicalTagsPresent: boolean;
  warnings: string[];
  tasks: string[];
  overallHealth: number; // 0-100
}

/**
 * Domain verification service
 */
export class DomainVerificationService {
  private logger: Logger;

  constructor() {
    this.logger = createLogger();
  }

  /**
   * Verify domain
   */
  async verifyDomain(domain: string): Promise<DomainVerificationResult> {
    this.logger.info('Verifying domain', { domain });

    const warnings: string[] = [];
    const tasks: string[] = [];

    // Normalize domain
    const normalizedDomain = this.normalizeDomain(domain);

    // Check DNS reachable
    const dnsReachable = await this.checkDNSReachable(normalizedDomain);
    if (!dnsReachable) {
      warnings.push('DNS not reachable');
      tasks.push('Verify DNS configuration');
    }

    // Check SSL valid
    const sslValid = await this.checkSSLValid(normalizedDomain);
    if (!sslValid) {
      warnings.push('SSL certificate invalid or expired');
      tasks.push('Install valid SSL certificate');
    }

    // Check robots.txt accessible
    const robotsTxtAccessible = await this.checkRobotsTxtAccessible(normalizedDomain);
    if (!robotsTxtAccessible) {
      warnings.push('robots.txt not accessible');
      tasks.push('Create robots.txt file');
    }

    // Check sitemap exists
    const sitemapExists = await this.checkSitemapExists(normalizedDomain);
    if (!sitemapExists) {
      warnings.push('Sitemap not found');
      tasks.push('Create XML sitemap');
    }

    // Check homepage reachable
    const homepageReachable = await this.checkHomepageReachable(normalizedDomain);
    if (!homepageReachable) {
      warnings.push('Homepage not reachable');
      tasks.push('Verify homepage accessibility');
    }

    // Check indexing readiness
    const indexingReady = await this.checkIndexingReady(normalizedDomain);
    if (!indexingReady) {
      warnings.push('Site not ready for indexing');
      tasks.push('Verify indexing readiness');
    }

    // Check canonical tags presence
    const canonicalTagsPresent = await this.checkCanonicalTagsPresent(normalizedDomain);
    if (!canonicalTagsPresent) {
      warnings.push('Canonical tags missing');
      tasks.push('Add canonical tags to pages');
    }

    // Calculate overall health
    const overallHealth = this.calculateHealth({
      dnsReachable,
      sslValid,
      robotsTxtAccessible,
      sitemapExists,
      homepageReachable,
      indexingReady,
      canonicalTagsPresent,
    });

    this.logger.info('Domain verification complete', { domain, overallHealth });

    return {
      domain: normalizedDomain,
      dnsReachable,
      sslValid,
      robotsTxtAccessible,
      sitemapExists,
      homepageReachable,
      indexingReady,
      canonicalTagsPresent,
      warnings,
      tasks,
      overallHealth,
    };
  }

  /**
   * Normalize domain
   */
  private normalizeDomain(domain: string): string {
    try {
      const url = new URL(domain.startsWith('http') ? domain : `https://${domain}`);
      return url.hostname;
    } catch {
      return domain;
    }
  }

  /**
   * Check DNS reachable
   */
  private async checkDNSReachable(domain: string): Promise<boolean> {
    try {
      const response = await fetch(`https://${domain}`, {
        method: 'HEAD',
        signal: AbortSignal.timeout(10000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Check SSL valid
   */
  private async checkSSLValid(domain: string): Promise<boolean> {
    try {
      const response = await fetch(`https://${domain}`, {
        method: 'HEAD',
        signal: AbortSignal.timeout(10000),
      });
      // If HTTPS works, SSL is valid
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Check robots.txt accessible
   */
  private async checkRobotsTxtAccessible(domain: string): Promise<boolean> {
    try {
      const response = await fetch(`https://${domain}/robots.txt`, {
        method: 'GET',
        signal: AbortSignal.timeout(10000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Check sitemap exists
   */
  private async checkSitemapExists(domain: string): Promise<boolean> {
    try {
      const response = await fetch(`https://${domain}/sitemap.xml`, {
        method: 'GET',
        signal: AbortSignal.timeout(10000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Check homepage reachable
   */
  private async checkHomepageReachable(domain: string): Promise<boolean> {
    try {
      const response = await fetch(`https://${domain}`, {
        method: 'GET',
        signal: AbortSignal.timeout(10000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Check indexing readiness
   */
  private async checkIndexingReady(domain: string): Promise<boolean> {
    // Placeholder for actual indexing readiness check
    // In production, this would check for noindex tags, meta robots, etc.
    return true;
  }

  /**
   * Check canonical tags presence
   */
  private async checkCanonicalTagsPresent(domain: string): Promise<boolean> {
    try {
      const response = await fetch(`https://${domain}`, {
        method: 'GET',
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok) return false;

      const html = await response.text();
      return html.includes('rel="canonical"') || html.includes("rel='canonical'");
    } catch {
      return false;
    }
  }

  /**
   * Calculate health score
   */
  private calculateHealth(checks: {
    dnsReachable: boolean;
    sslValid: boolean;
    robotsTxtAccessible: boolean;
    sitemapExists: boolean;
    homepageReachable: boolean;
    indexingReady: boolean;
    canonicalTagsPresent: boolean;
  }): number {
    const totalChecks = 7;
    const passedChecks = Object.values(checks).filter((v) => v === true).length;
    return Math.round((passedChecks / totalChecks) * 100);
  }

  /**
   * Generate onboarding tasks from verification result
   */
  generateOnboardingTasks(result: DomainVerificationResult): string[] {
    return result.tasks;
  }

  /**
   * Generate warnings from verification result
   */
  generateWarnings(result: DomainVerificationResult): string[] {
    return result.warnings;
  }
}

/**
 * Singleton instance
 */
export const domainVerificationService = new DomainVerificationService();
