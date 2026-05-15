/**
 * Runtime Contract Versioning
 * 
 * Canonical versioning metadata for runtime contracts
 * Enables distributed worker compatibility and protocol evolution
 */

/**
 * Semantic version
 */
export interface SemanticVersion {
  readonly major: number;
  readonly minor: number;
  readonly patch: number;
  readonly prerelease?: string;
  readonly build?: string;
}

/**
 * Contract version
 */
export interface RuntimeContractVersion {
  readonly version: SemanticVersion;
  readonly contractName: string;
  readonly contractType: ContractType;
  readonly introducedAt: string; // ISO date
  readonly deprecatedAt?: string; // ISO date
  readonly removedAt?: string; // ISO date
  readonly migrationGuide?: string;
}

/**
 * Contract type
 */
export enum ContractType {
  CORE = 'core',
  EXECUTION = 'execution',
  TASK = 'task',
  WORKER = 'worker',
  EVENT = 'event',
  RECOVERY = 'recovery',
  CHECKPOINT = 'checkpoint',
  STREAM = 'stream',
  DETERMINISM = 'determinism',
  RESOURCE = 'resource',
  SCHEDULING = 'scheduling',
  STATE_MACHINE = 'state_machine',
  CAPABILITY = 'capability',
}

/**
 * Backward compatibility level
 */
export enum CompatibilityLevel {
  FULL = 'full',
  PARTIAL = 'partial',
  NONE = 'none',
}

/**
 * Compatibility matrix
 */
export interface CompatibilityMatrix {
  readonly contractVersion: RuntimeContractVersion;
  readonly compatibleWith: readonly SemanticVersion[];
  readonly compatibilityLevel: CompatibilityLevel;
  readonly breakingChanges: readonly string[];
  readonly migrationRequired: boolean;
}

/**
 * Migration metadata
 */
export interface MigrationMetadata {
  readonly fromVersion: SemanticVersion;
  readonly toVersion: SemanticVersion;
  readonly migrationType: MigrationType;
  readonly automatic: boolean;
  readonly manualSteps: readonly string[];
  readonly dataLossRisk: DataLossRisk;
}

/**
 * Migration type
 */
export enum MigrationType {
  ADDITIVE = 'additive',
  STRUCTURAL = 'structural',
  BREAKING = 'breaking',
  DEPRECATION = 'deprecation',
}

/**
 * Data loss risk
 */
export enum DataLossRisk {
  NONE = 'none',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

/**
 * Contract metadata
 */
export interface ContractMetadata {
  readonly version: RuntimeContractVersion;
  readonly compatibilityMatrix: CompatibilityMatrix;
  readonly deprecationInfo?: DeprecationInfo;
  readonly migrationMetadata?: readonly MigrationMetadata[];
  readonly stability: StabilityLevel;
  readonly experimentalFeatures: readonly string[];
}

/**
 * Deprecation info
 */
export interface DeprecationInfo {
  readonly deprecatedAt: string; // ISO date
  readonly removalScheduledAt: string; // ISO date
  readonly reason: string;
  readonly recommendedReplacement?: string;
  readonly migrationGuide?: string;
}

/**
 * Stability level
 */
export enum StabilityLevel {
  EXPERIMENTAL = 'experimental',
  ALPHA = 'alpha',
  BETA = 'beta',
  STABLE = 'stable',
  DEPRECATED = 'deprecated',
  LEGACY = 'legacy',
}

/**
 * Versioned contract
 * Base interface for all versioned contracts
 */
export interface VersionedContract {
  readonly contractMetadata: ContractMetadata;
  readonly contractId: string;
  readonly contractType: ContractType;
}

/**
 * Contract registry
 * Canonical interface for contract version registry
 */
export interface ContractRegistry {
  /**
   * Register contract version
   */
  registerContract(contract: VersionedContract): Promise<void>;

  /**
   * Get contract by ID and version
   */
  getContract(
    contractId: string,
    version?: SemanticVersion
  ): Promise<VersionedContract | null>;

  /**
   * Get latest contract version
   */
  getLatestContract(contractId: string): Promise<VersionedContract | null>;

  /**
   * Get all contract versions
   */
  getContractVersions(contractId: string): Promise<readonly RuntimeContractVersion[]>;

  /**
   * Check compatibility
   */
  checkCompatibility(
    contractId: string,
    fromVersion: SemanticVersion,
    toVersion: SemanticVersion
  ): Promise<CompatibilityMatrix>;

  /**
   * Get migration path
   */
  getMigrationPath(
    contractId: string,
    fromVersion: SemanticVersion,
    toVersion: SemanticVersion
  ): Promise<readonly MigrationMetadata[]>;

  /**
   * List deprecated contracts
   */
  listDeprecatedContracts(): Promise<readonly VersionedContract[]>;

  /**
   * List experimental contracts
   */
  listExperimentalContracts(): Promise<readonly VersionedContract[]>;

  /**
   * Validate contract schema
   */
  validateContract(contract: VersionedContract): Promise<ValidationResult>;
}

/**
 * Validation result
 */
export interface ValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
}

/**
 * Contract version comparison
 */
export interface VersionComparison {
  readonly leftVersion: SemanticVersion;
  readonly rightVersion: SemanticVersion;
  readonly comparison: 'less_than' | 'equal' | 'greater_than';
  readonly majorDifference: boolean;
  readonly minorDifference: boolean;
  readonly patchDifference: boolean;
}

/**
 * Version comparator
 * Canonical interface for version comparison
 */
export interface VersionComparator {
  /**
   * Compare versions
   */
  compare(
    left: SemanticVersion,
    right: SemanticVersion
  ): VersionComparison;

  /**
   * Check if version is compatible
   */
  isCompatible(
    version: SemanticVersion,
    requiredRange: VersionRange
  ): boolean;

  /**
   * Parse version string
   */
  parse(versionString: string): SemanticVersion;

  /**
   * Format version
   */
  format(version: SemanticVersion): string;
}

/**
 * Version range
 */
export interface VersionRange {
  readonly minVersion?: SemanticVersion;
  readonly maxVersion?: SemanticVersion;
  readonly includePrerelease: boolean;
}

/**
 * Contract evolution strategy
 */
export enum EvolutionStrategy {
  ADDITIVE = 'additive',
  SEMVER = 'semver',
  CUSTOM = 'custom',
}

/**
 * Contract evolution policy
 */
export interface ContractEvolutionPolicy {
  readonly strategy: EvolutionStrategy;
  readonly requireCompatibilityCheck: boolean;
  readonly allowBreakingChanges: boolean;
  readonly deprecationPeriodDays: number;
  readonly experimentalPeriodDays: number;
}

/**
 * Contract validator
 * Canonical interface for contract validation
 */
export interface ContractValidator {
  /**
   * Validate contract structure
   */
  validateStructure(contract: VersionedContract): Promise<ValidationResult>;

  /**
   * Validate contract semantics
   */
  validateSemantics(contract: VersionedContract): Promise<ValidationResult>;

  /**
   * Validate contract versioning
   */
  validateVersioning(contract: VersionedContract): Promise<ValidationResult>;

  /**
   * Validate contract compatibility
   */
  validateCompatibility(
    contract: VersionedContract,
    targetVersion: SemanticVersion
  ): Promise<ValidationResult>;
}
