/**
 * Runtime Errors Contract
 * 
 * Canonical interfaces for error handling and error reporting
 * Framework-agnostic, database-agnostic, queue-agnostic abstractions
 */

/**
 * Error code
 */
export type ErrorCode = string;

/**
 * Error severity
 */
export enum ErrorSeverity {
  DEBUG = 'debug',
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
  FATAL = 'fatal',
}

/**
 * Error category
 */
export enum ErrorCategory {
  VALIDATION = 'validation',
  EXECUTION = 'execution',
  TIMEOUT = 'timeout',
  RESOURCE = 'resource',
  PERMISSION = 'permission',
  NETWORK = 'network',
  DEPENDENCY = 'dependency',
  CONFIGURATION = 'configuration',
  UNKNOWN = 'unknown',
}

/**
 * Runtime execution error
 * Canonical interface for runtime errors
 */
export interface RuntimeExecutionError {
  readonly errorCode: ErrorCode;
  readonly errorCategory: ErrorCategory;
  readonly errorSeverity: ErrorSeverity;
  readonly message: string;
  readonly details?: ErrorDetails;
  readonly cause?: Error;
  readonly timestamp: Date;
  readonly executionId?: string;
  readonly taskId?: string;
  readonly workerId?: string;
  readonly traceId?: string;
  readonly recoverable: boolean;
  readonly retryable: boolean;
}

/**
 * Error details
 */
export interface ErrorDetails {
  readonly context?: Record<string, unknown>;
  readonly stackTrace?: string;
  readonly additionalInfo?: Record<string, unknown>;
  readonly customDetails?: Record<string, unknown>;
}

/**
 * Error context
 */
export interface ErrorContext {
  readonly operation: string;
  readonly component: string;
  readonly metadata?: Record<string, unknown>;
  readonly userId?: string;
  readonly sessionId?: string;
  readonly requestId?: string;
}

/**
 * Error result
 */
export interface ErrorResult {
  readonly errorId: string;
  readonly success: boolean;
  readonly handledAt?: Date;
  readonly handlingStrategy?: ErrorHandlingStrategy;
  readonly error?: ErrorHandlingError;
}

/**
 * Error handling strategy
 */
export enum ErrorHandlingStrategy {
  RETRY = 'retry',
  SKIP = 'skip',
  ABORT = 'abort',
  LOG_AND_CONTINUE = 'log_and_continue',
  LOG_AND_RETRY = 'log_and_retry',
  FALLBACK = 'fallback',
  ESCALATE = 'escalate',
  IGNORE = 'ignore',
}

/**
 * Error handling error
 */
export interface ErrorHandlingError {
  readonly code: string;
  readonly message: string;
  readonly details?: Record<string, unknown>;
  readonly cause?: Error;
}

/**
 * Error handler
 * Canonical interface for error handling
 */
export interface ErrorHandler {
  /**
   * Handle error
   */
  handle(
    error: RuntimeExecutionError,
    context?: ErrorContext
  ): Promise<ErrorResult>;

  /**
   * Handle error with custom strategy
   */
  handleWithStrategy(
    error: RuntimeExecutionError,
    strategy: ErrorHandlingStrategy,
    context?: ErrorContext
  ): Promise<ErrorResult>;

  /**
   * Get error handling history
   */
  getHandlingHistory(errorId: string): Promise<readonly ErrorHandlingRecord[]>;

  /**
   * Get error statistics
   */
  getStatistics(filter?: ErrorStatisticsFilter): Promise<ErrorStatistics>;
}

/**
 * Error handling record
 */
export interface ErrorHandlingRecord {
  readonly recordId: string;
  readonly errorId: string;
  readonly strategy: ErrorHandlingStrategy;
  readonly handledAt: Date;
  readonly success: boolean;
  readonly durationMs: number;
  readonly context?: ErrorContext;
}

/**
 * Error statistics filter
 */
export interface ErrorStatisticsFilter {
  readonly errorCategory?: ErrorCategory;
  readonly errorSeverity?: ErrorSeverity;
  readonly component?: string;
  readonly after?: Date;
  readonly before?: Date;
}

/**
 * Error statistics
 */
export interface ErrorStatistics {
  readonly totalErrors: number;
  readonly errorsByCategory: Record<ErrorCategory, number>;
  readonly errorsBySeverity: Record<ErrorSeverity, number>;
  readonly errorsByComponent: Record<string, number>;
  readonly recoverableErrors: number;
  readonly nonRecoverableErrors: number;
  readonly retryableErrors: number;
  readonly nonRetryableErrors: number;
  readonly averageHandlingDurationMs: number;
}

/**
 * Error reporter
 * Canonical interface for error reporting
 */
export interface ErrorReporter {
  /**
   * Report error
   */
  report(
    error: RuntimeExecutionError,
    context?: ErrorContext
  ): Promise<ErrorReportResult>;

  /**
   * Report error batch
   */
  reportBatch(
    errors: readonly RuntimeExecutionError[],
    context?: ErrorContext
  ): Promise<readonly ErrorReportResult[]>;

  /**
   * Get error report
   */
  getReport(errorId: string): Promise<ErrorReport | null>;

  /**
   * Query error reports
   */
  queryReports(filter?: ErrorReportFilter): Promise<readonly ErrorReport[]>;

  /**
   * Get error trends
   */
  getTrends(timeRange: TimeRange): Promise<ErrorTrends>;
}

/**
 * Error report result
 */
export interface ErrorReportResult {
  readonly errorId: string;
  readonly success: boolean;
  readonly reportedAt: Date;
  readonly error?: ErrorReportError;
}

/**
 * Error report error
 */
export interface ErrorReportError {
  readonly code: string;
  readonly message: string;
  readonly details?: Record<string, unknown>;
  readonly cause?: Error;
}

/**
 * Error report
 */
export interface ErrorReport {
  readonly errorId: string;
  readonly error: RuntimeExecutionError;
  readonly context?: ErrorContext;
  readonly reportedAt: Date;
  readonly handled: boolean;
  readonly handlingStrategy?: ErrorHandlingStrategy;
  readonly resolvedAt?: Date;
}

/**
 * Error report filter
 */
export interface ErrorReportFilter {
  readonly errorCategory?: ErrorCategory;
  readonly errorSeverity?: ErrorSeverity;
  readonly component?: string;
  readonly executionId?: string;
  readonly taskId?: string;
  readonly handled?: boolean;
  readonly after?: Date;
  readonly before?: Date;
  readonly limit?: number;
  readonly offset?: number;
}

/**
 * Time range
 */
export interface TimeRange {
  readonly start: Date;
  readonly end: Date;
}

/**
 * Error trends
 */
export interface ErrorTrends {
  readonly timeRange: TimeRange;
  readonly totalErrors: number;
  readonly errorsOverTime: readonly {
    readonly timestamp: Date;
    readonly count: number;
  }[];
  readonly errorsByCategory: Record<ErrorCategory, number>;
  readonly topErrors: readonly {
    readonly errorCode: ErrorCode;
    readonly count: number;
  }[];
  readonly averageResolutionTimeMs: number;
}

/**
 * Error classifier
 * Canonical interface for error classification
 */
export interface ErrorClassifier {
  /**
   * Classify error
   */
  classify(error: Error): ErrorClassification;

  /**
   * Classify error with context
   */
  classifyWithContext(
    error: Error,
    context?: ErrorContext
  ): ErrorClassification;

  /**
   * Get classification rules
   */
  getClassificationRules(): readonly ErrorClassificationRule[];
}

/**
 * Error classification
 */
export interface ErrorClassification {
  readonly category: ErrorCategory;
  readonly severity: ErrorSeverity;
  readonly recoverable: boolean;
  readonly retryable: boolean;
  readonly suggestedStrategy: ErrorHandlingStrategy;
  readonly confidence: number;
}

/**
 * Error classification rule
 */
export interface ErrorClassificationRule {
  readonly ruleId: string;
  readonly condition: ErrorClassificationCondition;
  readonly classification: ErrorClassification;
  readonly priority: number;
}

/**
 * Error classification condition
 */
export interface ErrorClassificationCondition {
  readonly type: 'error_code' | 'error_message' | 'error_type' | 'custom';
  readonly operator: 'equals' | 'contains' | 'matches' | 'custom';
  readonly value: string;
  readonly customEvaluator?: (error: Error) => boolean;
}

/**
 * Error aggregator
 * Canonical interface for error aggregation
 */
export interface ErrorAggregator {
  /**
   * Aggregate errors
   */
  aggregate(
    errors: readonly RuntimeExecutionError[],
    aggregationKey: string
  ): Promise<ErrorAggregation>;

  /**
   * Get aggregation by key
   */
  getAggregation(aggregationId: string): Promise<ErrorAggregation | null>;

  /**
   * List aggregations
   */
  listAggregations(filter?: ErrorAggregationFilter): Promise<readonly ErrorAggregation[]>;

  /**
   * Get aggregation statistics
   */
  getAggregationStatistics(): Promise<AggregationStatistics>;
}

/**
 * Error aggregation
 */
export interface ErrorAggregation {
  readonly aggregationId: string;
  readonly aggregationKey: string;
  readonly errorCount: number;
  readonly firstOccurrence: Date;
  readonly lastOccurrence: Date;
  readonly errors: readonly RuntimeExecutionError[];
  readonly summary: ErrorAggregationSummary;
}

/**
 * Error aggregation summary
 */
export interface ErrorAggregationSummary {
  readonly mostCommonCategory: ErrorCategory;
  readonly mostCommonSeverity: ErrorSeverity;
  readonly recoverableCount: number;
  readonly retryableCount: number;
  readonly averageSeverity: number;
}

/**
 * Error aggregation filter
 */
export interface ErrorAggregationFilter {
  readonly aggregationKey?: string;
  readonly errorCountGreaterThan?: number;
  readonly firstOccurrenceAfter?: Date;
  readonly lastOccurrenceBefore?: Date;
  readonly limit?: number;
  readonly offset?: number;
}

/**
 * Aggregation statistics
 */
export interface AggregationStatistics {
  readonly totalAggregations: number;
  readonly totalAggregatedErrors: number;
  readonly averageErrorsPerAggregation: number;
  readonly aggregationsByTimeRange: readonly {
    readonly timeRange: TimeRange;
    readonly count: number;
  }[];
}

/**
 * Error notifier
 * Canonical interface for error notifications
 */
export interface ErrorNotifier {
  /**
   * Notify error
   */
  notify(
    error: RuntimeExecutionError,
    context?: ErrorContext
  ): Promise<ErrorNotificationResult>;

  /**
   * Notify error batch
   */
  notifyBatch(
    errors: readonly RuntimeExecutionError[],
    context?: ErrorContext
  ): Promise<readonly ErrorNotificationResult[]>;

  /**
   * Subscribe to error notifications
   */
  subscribe(
    filter: ErrorNotificationFilter,
    handler: ErrorNotificationHandler
  ): Promise<SubscriptionId>;

  /**
   * Unsubscribe from error notifications
   */
  unsubscribe(subscriptionId: SubscriptionId): Promise<void>;
}

/**
 * Error notification result
 */
export interface ErrorNotificationResult {
  readonly notificationId: string;
  readonly success: boolean;
  readonly notifiedAt: Date;
  readonly error?: ErrorNotificationError;
}

/**
 * Error notification error
 */
export interface ErrorNotificationError {
  readonly code: string;
  readonly message: string;
  readonly details?: Record<string, unknown>;
  readonly cause?: Error;
}

/**
 * Error notification filter
 */
export interface ErrorNotificationFilter {
  readonly errorCategory?: ErrorCategory;
  readonly errorSeverity?: ErrorSeverity;
  readonly component?: string;
  readonly minSeverity?: ErrorSeverity;
}

/**
 * Error notification handler
 */
export type ErrorNotificationHandler = (
  error: RuntimeExecutionError,
  context?: ErrorContext
) => Promise<void>;

/**
 * Subscription ID
 */
export type SubscriptionId = string;

/**
 * Error recovery advisor
 * Canonical interface for error recovery advice
 */
export interface ErrorRecoveryAdvisor {
  /**
   * Get recovery advice
   */
  getAdvice(error: RuntimeExecutionError): RecoveryAdvice;

  /**
   * Get recovery advice with context
   */
  getAdviceWithContext(
    error: RuntimeExecutionError,
    context?: ErrorContext
  ): RecoveryAdvice;

  /**
   * Get recovery steps
   */
  getRecoverySteps(error: RuntimeExecutionError): readonly RecoveryStep[];
}

/**
 * Recovery advice
 */
export interface RecoveryAdvice {
  readonly suggestedStrategy: ErrorHandlingStrategy;
  readonly confidence: number;
  readonly reasoning: string;
  readonly alternativeStrategies: readonly ErrorHandlingStrategy[];
  readonly estimatedRecoveryTimeMs?: number;
  readonly requiresManualIntervention: boolean;
}

/**
 * Recovery step
 */
export interface RecoveryStep {
  readonly stepId: string;
  readonly description: string;
  readonly action: RecoveryAction;
  readonly order: number;
  readonly required: boolean;
}

/**
 * Recovery action
 */
export type RecoveryAction =
  | { type: 'retry'; maxRetries: number; delayMs: number }
  | { type: 'skip'; reason: string }
  | { type: 'abort'; reason: string }
  | { type: 'fallback'; fallbackValue: unknown }
  | { type: 'escalate'; escalationLevel: string }
  | { type: 'custom'; action: string; parameters: Record<string, unknown> };
