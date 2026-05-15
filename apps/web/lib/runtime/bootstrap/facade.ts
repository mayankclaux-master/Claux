/**
 * CLAUX Runtime Bootstrap Layer - Facade
 */

import { RuntimeAssemblyManager } from './runtime-assembly';
import { ProviderRegistrationManager } from './provider-registration';
import { InitializationLifecycleManager } from './initialization-lifecycle';
import { DependencyValidationManager } from './dependency-validation';
import { StartupValidationManager } from './startup-validation';
import { RuntimeWarmupManager } from './runtime-warmup';
import { HealthInitializationManager } from './health-initialization';
import { BootstrapDiagnosticsManager } from './bootstrap-diagnostics';
import { CapabilityDiscoveryManager } from './capability-discovery';

/**
 * Bootstrap Facade
 */
export class BootstrapFacade {
  readonly runtimeAssembly: RuntimeAssemblyManager;
  readonly providerRegistration: ProviderRegistrationManager;
  readonly initializationLifecycle: InitializationLifecycleManager;
  readonly dependencyValidation: DependencyValidationManager;
  readonly startupValidation: StartupValidationManager;
  readonly runtimeWarmup: RuntimeWarmupManager;
  readonly healthInitialization: HealthInitializationManager;
  readonly bootstrapDiagnostics: BootstrapDiagnosticsManager;
  readonly capabilityDiscovery: CapabilityDiscoveryManager;

  constructor() {
    this.runtimeAssembly = new RuntimeAssemblyManager();
    this.providerRegistration = new ProviderRegistrationManager();
    this.initializationLifecycle = new InitializationLifecycleManager();
    this.dependencyValidation = new DependencyValidationManager();
    this.startupValidation = new StartupValidationManager();
    this.runtimeWarmup = new RuntimeWarmupManager();
    this.healthInitialization = new HealthInitializationManager();
    this.bootstrapDiagnostics = new BootstrapDiagnosticsManager();
    this.capabilityDiscovery = new CapabilityDiscoveryManager();
  }
}
