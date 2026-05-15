/**
 * CLAUX Runtime Bootstrap Layer - Bootstrap Diagnostics
 */

import type { BootstrapDiagnostic } from './types';

/**
 * Bootstrap Diagnostics Manager
 */
export class BootstrapDiagnosticsManager {
  private diagnostics: BootstrapDiagnostic[] = [];

  /**
   * Add diagnostic
   */
  addDiagnostic(
    severity: 'info' | 'warning' | 'error',
    message: string
  ): void {
    const diagnostic: BootstrapDiagnostic = {
      diagnosticId: this.generateDiagnosticId(),
      severity,
      message,
      timestamp: Date.now(),
    };

    this.diagnostics.push(diagnostic);
  }

  /**
   * Get diagnostics
   */
  getDiagnostics(): readonly BootstrapDiagnostic[] {
    return this.diagnostics;
  }

  /**
   * Get diagnostics by severity
   */
  getDiagnosticsBySeverity(
    severity: 'info' | 'warning' | 'error'
  ): readonly BootstrapDiagnostic[] {
    return this.diagnostics.filter((d) => d.severity === severity);
  }

  /**
   * Clear
   */
  clear(): void {
    this.diagnostics = [];
  }

  /**
   * Generate diagnostic ID
   */
  private generateDiagnosticId(): string {
    return `diag_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }
}
