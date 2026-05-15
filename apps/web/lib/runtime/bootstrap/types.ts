/**
 * CLAUX Runtime Bootstrap Layer - Types
 */

export type BootstrapId = string;
export type ProviderId = string;
export type ModuleId = string;

/**
 * Runtime Assembly State
 */
export interface RuntimeAssemblyState {
  readonly bootstrapId: BootstrapId;
  readonly phase: 'initializing' | 'assembling' | 'validating' | 'ready';
  readonly timestamp: number;
}

/**
 * Provider Registration
 */
export interface ProviderRegistration {
  readonly providerId: ProviderId;
  readonly providerType: string;
  readonly capabilities: readonly string[];
  readonly version: string;
}

/**
 * Module Dependency
 */
export interface ModuleDependency {
  readonly moduleId: ModuleId;
  readonly dependsOn: readonly ModuleId[];
  readonly optional: readonly ModuleId[];
}

/**
 * Runtime Capability
 */
export interface RuntimeCapability {
  readonly capabilityId: string;
  readonly description: string;
  readonly required: boolean;
}

/**
 * Bootstrap Diagnostic
 */
export interface BootstrapDiagnostic {
  readonly diagnosticId: string;
  readonly severity: 'info' | 'warning' | 'error';
  readonly message: string;
  readonly timestamp: number;
}
