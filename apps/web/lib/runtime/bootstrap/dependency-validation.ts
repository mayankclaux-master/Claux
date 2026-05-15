/**
 * CLAUX Runtime Bootstrap Layer - Dependency Validation
 */

import type { ModuleDependency, ModuleId } from './types';
import { DependencyValidationError } from './errors';

/**
 * Dependency Validation Manager
 */
export class DependencyValidationManager {
  private dependencies: Map<ModuleId, ModuleDependency> = new Map();

  /**
   * Add dependency
   */
  addDependency(dependency: ModuleDependency): void {
    this.dependencies.set(dependency.moduleId, dependency);
  }

  /**
   * Validate dependencies
   */
  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const visited = new Set<ModuleId>();
    const recursionStack = new Set<ModuleId>();

    const checkCycle = (moduleId: ModuleId): boolean => {
      if (recursionStack.has(moduleId)) {
        errors.push(`Circular dependency detected involving ${moduleId}`);
        return false;
      }
      if (visited.has(moduleId)) {
        return true;
      }

      visited.add(moduleId);
      recursionStack.add(moduleId);

      const dep = this.dependencies.get(moduleId);
      if (dep) {
        for (const depId of dep.dependsOn) {
          if (!checkCycle(depId)) {
            return false;
          }
        }
      }

      recursionStack.delete(moduleId);
      return true;
    };

    for (const moduleId of this.dependencies.keys()) {
      if (!checkCycle(moduleId)) {
        break;
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Get dependency order
   */
  getDependencyOrder(): readonly ModuleId[] {
    const order: ModuleId[] = [];
    const visited = new Set<ModuleId>();

    const visit = (moduleId: ModuleId) => {
      if (visited.has(moduleId)) {
        return;
      }

      visited.add(moduleId);

      const dep = this.dependencies.get(moduleId);
      if (dep) {
        for (const depId of dep.dependsOn) {
          visit(depId);
        }
      }

      order.push(moduleId);
    };

    for (const moduleId of this.dependencies.keys()) {
      visit(moduleId);
    }

    return order;
  }

  /**
   * Clear
   */
  clear(): void {
    this.dependencies.clear();
  }
}
