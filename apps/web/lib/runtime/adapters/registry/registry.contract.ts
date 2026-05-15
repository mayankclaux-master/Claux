/**
 * Adapter Registry Layer
 * 
 * Runtime adapter discovery and resolution
 * Enables pluggable runtime infrastructure
 */

import type { AdapterId, ProviderId, AdapterType, ProviderType } from '../types';

/**
 * Adapter registry
 * Canonical interface for adapter registry operations
 */
export interface AdapterRegistry {
  readonly registryId: string;

  /**
   * Register adapter
   */
  registerAdapter(descriptor: AdapterDescriptor): Promise<void>;

  /**
   * Unregister adapter
   */
  unregisterAdapter(adapterId: AdapterId): Promise<void>;

  /**
   * Get adapter
   */
  getAdapter(adapterId: AdapterId): AdapterDescriptor | null;

  /**
   * List adapters
   */
  listAdapters(filter?: AdapterFilter): readonly AdapterDescriptor[];

  /**
   * Resolve adapter
   */
  resolveAdapter(
    adapterType: AdapterType,
    requirements: AdapterRequirements
  ): AdapterResolutionResult;

  /**
   * Register provider
   */
  registerProvider(descriptor: ProviderDescriptor): Promise<void>;

  /**
   * Unregister provider
   */
  unregisterProvider(providerId: ProviderId): Promise<void>;

  /**
   * Get provider
   */
  getProvider(providerId: ProviderId): ProviderDescriptor | null;

  /**
   * List providers
   */
  listProviders(filter?: ProviderFilter): readonly ProviderDescriptor[];

  /**
   * Resolve provider
   */
  resolveProvider(
    adapterType: AdapterType,
    requirements: ProviderRequirements
  ): ProviderResolutionResult;

  /**
   * Check capability compatibility
   */
  checkCapabilityCompatibility(
    adapterId: AdapterId,
    requiredCapabilities: readonly string[]
  ): CapabilityCompatibilityResult;

  /**
   * Get fallback adapter
   */
  getFallbackAdapter(
    adapterId: AdapterId,
    reason: FallbackReason
  ): AdapterDescriptor | null;

  /**
   * Validate version compatibility
   */
  validateVersionCompatibility(
    adapterId: AdapterId,
    requiredVersion: string
  ): VersionCompatibilityResult;

  /**
   * Health check
   */
  healthCheck(): Promise<RegistryHealthStatus>;
}

/**
 * Adapter descriptor
 */
export interface AdapterDescriptor {
  readonly adapterId: AdapterId;
  readonly adapterType: AdapterType;
  readonly providerType: ProviderType;
  readonly version: string;
  readonly capabilities: AdapterCapabilities;
  readonly configuration: AdapterConfiguration;
  readonly status: AdapterStatus;
  readonly metadata: AdapterMetadata;
}

/**
 * Adapter capabilities
 */
export interface AdapterCapabilities {
  readonly supportedFeatures: readonly string[];
  readonly limitations: readonly AdapterLimitation[];
  readonly requirements: readonly AdapterRequirement[];
}

/**
 * Adapter limitation
 */
export interface AdapterLimitation {
  readonly limitation: string;
  readonly impact: 'low' | 'medium' | 'high';
  readonly description: string;
}

/**
 * Adapter requirement
 */
export interface AdapterRequirement {
  readonly requirement: string;
  readonly type: 'required' | 'optional';
  readonly description: string;
}

/**
 * Adapter configuration
 */
export interface AdapterConfiguration {
  readonly config: Record<string, unknown>;
  readonly defaults: Record<string, unknown>;
  readonly schema?: ConfigurationSchema;
}

/**
 * Configuration schema
 */
export interface ConfigurationSchema {
  readonly type: string;
  readonly properties: Record<string, PropertySchema>;
  readonly required?: readonly string[];
}

/**
 * Property schema
 */
export interface PropertySchema {
  readonly type: string;
  readonly description?: string;
  readonly default?: unknown;
  readonly required?: boolean;
}

/**
 * Adapter status
 */
export enum AdapterStatus {
  REGISTERED = 'registered',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DEPRECATED = 'deprecated',
}

/**
 * Adapter metadata
 */
export interface AdapterMetadata {
  readonly name: string;
  readonly description?: string;
  readonly author?: string;
  readonly license?: string;
  readonly homepage?: string;
  readonly repositoryUrl?: string;
  readonly tags: readonly string[];
}

/**
 * Adapter filter
 */
export interface AdapterFilter {
  readonly adapterType?: AdapterType;
  readonly providerType?: ProviderType;
  readonly status?: AdapterStatus;
  readonly tags?: readonly string[];
  readonly limit?: number;
  readonly offset?: number;
}

/**
 * Adapter requirements
 */
export interface AdapterRequirements {
  readonly requiredCapabilities?: readonly string[];
  readonly requiredFeatures?: readonly string[];
  readonly versionConstraints?: VersionConstraints;
  readonly configurationRequirements?: ConfigurationRequirements;
}

/**
 * Version constraints
 */
export interface VersionConstraints {
  readonly minVersion?: string;
  readonly maxVersion?: string;
  readonly exactVersion?: string;
}

/**
 * Configuration requirements
 */
export interface ConfigurationRequirements {
  readonly requiredConfig?: readonly string[];
  readonly optionalConfig?: readonly string[];
}

/**
 * Adapter resolution result
 */
export interface AdapterResolutionResult {
  readonly success: boolean;
  readonly adapter?: AdapterDescriptor;
  readonly resolutionStrategy: ResolutionStrategy;
  readonly fallbackUsed?: boolean;
  readonly error?: RegistryError;
}

/**
 * Resolution strategy
 */
export enum ResolutionStrategy {
  EXACT_MATCH = 'exact_match',
  CAPABILITY_MATCH = 'capability_match',
  FEATURE_MATCH = 'feature_match',
  PRIORITY = 'priority',
  FALLBACK = 'fallback',
  CUSTOM = 'custom',
}

/**
 * Provider descriptor
 */
export interface ProviderDescriptor {
  readonly providerId: ProviderId;
  readonly providerType: ProviderType;
  readonly version: string;
  readonly supportedAdapterTypes: readonly AdapterType[];
  readonly capabilities: ProviderCapabilities;
  readonly metadata: ProviderMetadata;
}

/**
 * Provider capabilities
 */
export interface ProviderCapabilities {
  readonly supportedFeatures: readonly string[];
  readonly limitations: readonly string[];
  readonly dependencies: readonly ProviderDependency[];
}

/**
 * Provider dependency
 */
export interface ProviderDependency {
  readonly dependency: string;
  readonly version?: string;
  readonly type: 'required' | 'optional';
}

/**
 * Provider metadata
 */
export interface ProviderMetadata {
  readonly name: string;
  readonly description?: string;
  readonly author?: string;
  readonly license?: string;
  readonly homepage?: string;
  readonly repositoryUrl?: string;
}

/**
 * Provider filter
 */
export interface ProviderFilter {
  readonly providerType?: ProviderType;
  readonly adapterType?: AdapterType;
  readonly limit?: number;
  readonly offset?: number;
}

/**
 * Provider requirements
 */
export interface ProviderRequirements {
  readonly requiredAdapterTypes?: readonly AdapterType[];
  readonly requiredFeatures?: readonly string[];
  readonly versionConstraints?: VersionConstraints;
}

/**
 * Provider resolution result
 */
export interface ProviderResolutionResult {
  readonly success: boolean;
  readonly provider?: ProviderDescriptor;
  readonly resolutionStrategy: ResolutionStrategy;
  readonly error?: RegistryError;
}

/**
 * Capability compatibility result
 */
export interface CapabilityCompatibilityResult {
  readonly compatible: boolean;
  readonly missingCapabilities: readonly string[];
  readonly partiallyCompatible: readonly string[];
  readonly incompatibilityReason?: string;
}

/**
 * Fallback reason
 */
export enum FallbackReason {
  ADAPTER_UNAVAILABLE = 'adapter_unavailable',
  CAPABILITY_MISMATCH = 'capability_mismatch',
  VERSION_INCOMPATIBLE = 'version_incompatible',
  DEGRADED = 'degraded',
  CUSTOM = 'custom',
}

/**
 * Version compatibility result
 */
export interface VersionCompatibilityResult {
  readonly compatible: boolean;
  readonly requiredVersion: string;
  readonly actualVersion: string;
  readonly incompatibilityReason?: string;
}

/**
 * Registry error
 */
export interface RegistryError {
  readonly code: string;
  readonly message: string;
  readonly details?: Record<string, unknown>;
  readonly cause?: Error;
}

/**
 * Registry health status
 */
export interface RegistryHealthStatus {
  readonly healthy: boolean;
  readonly totalAdapters: number;
  readonly activeAdapters: number;
  readonly totalProviders: number;
  readonly activeProviders: number;
  readonly errorCount: number;
  readonly lastError?: RegistryError;
}

/**
 * Adapter resolver
 * Canonical interface for adapter resolution
 */
export interface AdapterResolver {
  readonly resolverId: string;

  /**
   * Resolve adapter
   */
  resolve(
    adapterType: AdapterType,
    requirements: AdapterRequirements
  ): AdapterResolutionResult;

  /**
   * Resolve with fallback
   */
  resolveWithFallback(
    adapterType: AdapterType,
    requirements: AdapterRequirements,
    fallbackStrategy: FallbackStrategy
  ): AdapterResolutionResult;

  /**
   * Get resolution cache
   */
  getResolutionCache(): ResolutionCache;
}

/**
 * Fallback strategy
 */
export enum FallbackStrategy {
  NONE = 'none',
  NEXT_BEST = 'next_best',
  DEGRADED = 'degraded',
  CUSTOM = 'custom',
}

/**
 * Resolution cache
 */
export interface ResolutionCache {
  readonly entries: readonly ResolutionCacheEntry[];
  readonly hitCount: number;
  readonly missCount: number;
  readonly lastClearedAt?: Date;
}

/**
 * Resolution cache entry
 */
export interface ResolutionCacheEntry {
  readonly key: string;
  readonly adapterId: AdapterId;
  readonly resolvedAt: Date;
  readonly expiresAt: Date;
}

/**
 * Capability resolver
 * Canonical interface for capability resolution
 */
export interface CapabilityResolver {
  readonly resolverId: string;

  /**
   * Resolve capabilities
   */
  resolveCapabilities(
    adapterId: AdapterId,
    requiredCapabilities: readonly string[]
  ): CapabilityResolutionResult;

  /**
   * Negotiate capabilities
   */
  negotiateCapabilities(
    adapterIds: readonly AdapterId[],
    requiredCapabilities: readonly string[]
  ): CapabilityNegotiationResult;

  /**
   * Get capability matrix
   */
  getCapabilityMatrix(
    adapterIds: readonly AdapterId[]
  ): CapabilityMatrix;
}

/**
 * Capability resolution result
 */
export interface CapabilityResolutionResult {
  readonly adapterId: AdapterId;
  readonly resolvedCapabilities: readonly string[];
  readonly missingCapabilities: readonly string[];
  readonly partiallyCompatible: readonly string[];
}

/**
 * Capability negotiation result
 */
export interface CapabilityNegotiationResult {
  readonly selectedAdapterId: AdapterId;
  readonly resolvedCapabilities: readonly string[];
  readonly negotiationStrategy: NegotiationStrategy;
  readonly fallbackUsed?: boolean;
}

/**
 * Negotiation strategy
 */
export enum NegotiationStrategy {
  FIRST_MATCH = 'first_match',
  BEST_MATCH = 'best_match',
  PRIORITY = 'priority',
  CONSENSUS = 'consensus',
  CUSTOM = 'custom',
}

/**
 * Capability matrix
 */
export interface CapabilityMatrix {
  readonly adapterCapabilities: Record<AdapterId, readonly string[]>;
  readonly capabilityCoverage: Record<string, readonly AdapterId[]>;
  readonly coverageScore: number; // 0-100
}

/**
 * Provider registry
 * Canonical interface for provider registry
 */
export interface ProviderRegistry {
  readonly registryId: string;

  /**
   * Register provider
   */
  registerProvider(descriptor: ProviderDescriptor): Promise<void>;

  /**
   * Unregister provider
   */
  unregisterProvider(providerId: ProviderId): Promise<void>;

  /**
   * Get provider
   */
  getProvider(providerId: ProviderId): ProviderDescriptor | null;

  /**
   * List providers
   */
  listProviders(filter?: ProviderFilter): readonly ProviderDescriptor[];

  /**
   * Resolve provider
   */
  resolveProvider(
    adapterType: AdapterType,
    requirements: ProviderRequirements
  ): ProviderResolutionResult;

  /**
   * Get provider dependencies
   */
  getProviderDependencies(providerId: ProviderId): readonly ProviderDependency[];

  /**
   * Validate provider compatibility
   */
  validateProviderCompatibility(
    providerId: ProviderId,
    adapterType: AdapterType
  ): CompatibilityValidationResult;
}

/**
 * Compatibility validation result
 */
export interface CompatibilityValidationResult {
  readonly compatible: boolean;
  readonly missingCapabilities: readonly string[];
  readonly missingDependencies: readonly string[];
  readonly versionIncompatible?: boolean;
  readonly incompatibilityReason?: string;
}
