/**
 * CLAUX Runtime Security Layer - Trust Boundaries
 */

import type { TrustBoundary } from './types';
import { TRUST_BOUNDARY_LEVELS } from './constants';

/**
 * Trust Boundary Manager
 */
export class TrustBoundaryManager {
  private boundaries: Map<string, TrustBoundary> = new Map();
  private componentBoundaries: Map<string, string> = new Map();

  /**
   * Define boundary
   */
  define(boundary: TrustBoundary): void {
    this.boundaries.set(boundary.boundaryId, boundary);
  }

  /**
   * Assign component to boundary
   */
  assign(componentId: string, boundaryId: string): void {
    this.componentBoundaries.set(componentId, boundaryId);
  }

  /**
   * Get boundary
   */
  getBoundary(boundaryId: string): TrustBoundary | undefined {
    return this.boundaries.get(boundaryId);
  }

  /**
   * Get component boundary
   */
  getComponentBoundary(componentId: string): TrustBoundary | undefined {
    const boundaryId = this.componentBoundaries.get(componentId);
    if (!boundaryId) return undefined;
    return this.boundaries.get(boundaryId);
  }

  /**
   * Check trust level
   */
  checkTrustLevel(componentId: string, requiredLevel: string): boolean {
    const boundary = this.getComponentBoundary(componentId);
    if (!boundary) return false;

    const levels = [TRUST_BOUNDARY_LEVELS.PUBLIC, TRUST_BOUNDARY_LEVELS.INTERNAL, TRUST_BOUNDARY_LEVELS.RESTRICTED, TRUST_BOUNDARY_LEVELS.CONFIDENTIAL];
    const componentLevel = levels.indexOf(boundary.level as any);
    const requiredLevelIdx = levels.indexOf(requiredLevel as any);

    return componentLevel >= requiredLevelIdx;
  }

  /**
   * Clear
   */
  clear(): void {
    this.boundaries.clear();
    this.componentBoundaries.clear();
  }
}
