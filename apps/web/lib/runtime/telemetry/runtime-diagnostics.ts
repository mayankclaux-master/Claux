/**
 * CLAUX Runtime Telemetry Layer - Runtime Diagnostics
 */

/**
 * Diagnostic Info
 */
export interface DiagnosticInfo {
  readonly component: string;
  readonly status: string;
  readonly metrics: Record<string, number>;
  readonly lastUpdated: number;
}

/**
 * Runtime Diagnostics Manager
 */
export class RuntimeDiagnosticsManager {
  private diagnostics: Map<string, DiagnosticInfo> = new Map();

  /**
   * Update diagnostic
   */
  updateDiagnostic(component: string, status: string, metrics: Record<string, number>): void {
    const info: DiagnosticInfo = {
      component,
      status,
      metrics,
      lastUpdated: Date.now(),
    };
    this.diagnostics.set(component, info);
  }

  /**
   * Get diagnostic
   */
  getDiagnostic(component: string): DiagnosticInfo | undefined {
    return this.diagnostics.get(component);
  }

  /**
   * Get all diagnostics
   */
  getAllDiagnostics(): readonly DiagnosticInfo[] {
    return Array.from(this.diagnostics.values());
  }

  /**
   * Clear
   */
  clear(): void {
    this.diagnostics.clear();
  }
}
