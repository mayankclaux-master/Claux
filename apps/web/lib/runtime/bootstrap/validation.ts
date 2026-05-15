/**
 * CLAUX Runtime Bootstrap Layer - Validation
 */

import type { RuntimeAssemblyState, ProviderRegistration, ModuleDependency } from './types';

export interface ValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
}

/**
 * Bootstrap Validator
 */
export class BootstrapValidator {
  /**
   * Validate assembly state
   */
  validateAssemblyState(state: RuntimeAssemblyState): ValidationResult {
    const errors: string[] = [];

    if (!state.bootstrapId) errors.push('Missing bootstrapId');
    if (!state.phase) errors.push('Missing phase');
    if (!state.timestamp) errors.push('Missing timestamp');

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate provider registration
   */
  validateProviderRegistration(registration: ProviderRegistration): ValidationResult {
    const errors: string[] = [];

    if (!registration.providerId) errors.push('Missing providerId');
    if (!registration.providerType) errors.push('Missing providerType');
    if (!registration.version) errors.push('Missing version');

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate module dependency
   */
  validateModuleDependency(dependency: ModuleDependency): ValidationResult {
    const errors: string[] = [];

    if (!dependency.moduleId) errors.push('Missing moduleId');
    if (!Array.isArray(dependency.dependsOn)) errors.push('Invalid dependsOn');
    if (!Array.isArray(dependency.optional)) errors.push('Invalid optional');

    return { valid: errors.length === 0, errors };
  }
}
