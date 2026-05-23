/**
 * Platform Error Boundary Service
 * 
 * Canonical platform error boundary service for CLAUX V1 platform edge hardening.
 * Canonical error taxonomy, safe client-facing errors, internal trace logging, prevent stack trace leakage, connector-safe failures, onboarding-safe failures, execution-safe failures.
 * 
 * CRITICAL: This is the ONLY platform error boundary service in CLAUX.
 */

import type { UUID } from '../runtime/types/common.types';
import { createLogger, Logger } from '@/lib/utils/logger';

/**
 * Error type taxonomy
 */
export enum ErrorType {
  UNKNOWN = 'unknown',
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  NOT_FOUND = 'not_found',
  RATE_LIMIT = 'rate_limit',
  CONNECTOR = 'connector',
  EXECUTION = 'execution',
  ONBOARDING = 'onboarding',
  DATABASE = 'database',
  NETWORK = 'network',
  TIMEOUT = 'timeout',
  INTERNAL = 'internal',
}

/**
 * Safe error response
 */
export interface SafeErrorResponse {
  type: ErrorType;
  message: string;
  traceId?: UUID;
  timestamp: number;
  safe: boolean;
}

/**
 * Platform error boundary service
 */
export class PlatformErrorBoundaryService {
  private logger: Logger;

  constructor() {
    this.logger = createLogger();
  }

  /**
   * Handle error and return safe response
   */
  handleError(error: unknown, traceId?: UUID): SafeErrorResponse {
    const timestamp = Date.now();

    // Log internal error with full details
    this.logger.error('Error handled by boundary', { error, traceId });

    // Determine error type
    const errorType = this.classifyError(error);

    // Generate safe message
    const safeMessage = this.generateSafeMessage(errorType, error);

    return {
      type: errorType,
      message: safeMessage,
      traceId,
      timestamp,
      safe: true,
    };
  }

  /**
   * Classify error type
   */
  private classifyError(error: unknown): ErrorType {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();

      if (message.includes('validation') || message.includes('invalid')) {
        return ErrorType.VALIDATION;
      }
      if (message.includes('auth') || message.includes('unauthorized')) {
        return ErrorType.AUTHENTICATION;
      }
      if (message.includes('forbidden') || message.includes('permission')) {
        return ErrorType.AUTHORIZATION;
      }
      if (message.includes('not found') || message.includes('404')) {
        return ErrorType.NOT_FOUND;
      }
      if (message.includes('rate limit') || message.includes('too many')) {
        return ErrorType.RATE_LIMIT;
      }
      if (message.includes('connector') || message.includes('oauth')) {
        return ErrorType.CONNECTOR;
      }
      if (message.includes('execution') || message.includes('agent')) {
        return ErrorType.EXECUTION;
      }
      if (message.includes('onboarding')) {
        return ErrorType.ONBOARDING;
      }
      if (message.includes('database') || message.includes('sql')) {
        return ErrorType.DATABASE;
      }
      if (message.includes('network') || message.includes('fetch')) {
        return ErrorType.NETWORK;
      }
      if (message.includes('timeout') || message.includes('timed out')) {
        return ErrorType.TIMEOUT;
      }
    }

    return ErrorType.INTERNAL;
  }

  /**
   * Generate safe client-facing message
   */
  private generateSafeMessage(errorType: ErrorType, error: unknown): string {
    switch (errorType) {
      case ErrorType.VALIDATION:
        return 'Invalid input provided. Please check your request and try again.';
      case ErrorType.AUTHENTICATION:
        return 'Authentication required. Please log in and try again.';
      case ErrorType.AUTHORIZATION:
        return 'You do not have permission to perform this action.';
      case ErrorType.NOT_FOUND:
        return 'The requested resource was not found.';
      case ErrorType.RATE_LIMIT:
        return 'Too many requests. Please wait and try again later.';
      case ErrorType.CONNECTOR:
        return 'Connector error occurred. Please check your connector configuration.';
      case ErrorType.EXECUTION:
        return 'Execution failed. Please try again or contact support.';
      case ErrorType.ONBOARDING:
        return 'Onboarding process encountered an error. Please try again.';
      case ErrorType.DATABASE:
        return 'Database error occurred. Please try again later.';
      case ErrorType.NETWORK:
        return 'Network error occurred. Please check your connection and try again.';
      case ErrorType.TIMEOUT:
        return 'Request timed out. Please try again.';
      case ErrorType.INTERNAL:
      default:
        return 'An unexpected error occurred. Please try again later.';
    }
  }

  /**
   * Handle connector error safely
   */
  handleConnectorError(error: unknown, provider: string, traceId?: UUID): SafeErrorResponse {
    this.logger.error('Connector error handled', { error, provider, traceId });

    return {
      type: ErrorType.CONNECTOR,
      message: `Connector error for ${provider}. Please check your connector configuration.`,
      traceId,
      timestamp: Date.now(),
      safe: true,
    };
  }

  /**
   * Handle onboarding error safely
   */
  handleOnboardingError(error: unknown, stage: string, traceId?: UUID): SafeErrorResponse {
    this.logger.error('Onboarding error handled', { error, stage, traceId });

    return {
      type: ErrorType.ONBOARDING,
      message: `Onboarding failed at stage: ${stage}. Please try again.`,
      traceId,
      timestamp: Date.now(),
      safe: true,
    };
  }

  /**
   * Handle execution error safely
   */
  handleExecutionError(error: unknown, agentName: string, traceId?: UUID): SafeErrorResponse {
    this.logger.error('Execution error handled', { error, agentName, traceId });

    return {
      type: ErrorType.EXECUTION,
      message: `Execution failed for agent: ${agentName}. Please try again.`,
      traceId,
      timestamp: Date.now(),
      safe: true,
    };
  }

  /**
   * Wrap function with error boundary
   */
  async wrap<T>(
    fn: () => Promise<T>,
    traceId?: UUID
  ): Promise<{ success: boolean; data?: T; error?: SafeErrorResponse }> {
    try {
      const data = await fn();
      return { success: true, data };
    } catch (error) {
      const safeError = this.handleError(error, traceId);
      return { success: false, error: safeError };
    }
  }

  /**
   * Sanitize error for logging (remove sensitive data)
   */
  sanitizeErrorForLogging(error: unknown): unknown {
    if (typeof error === 'string') {
      // Remove potential secrets
      return error.replace(/Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi, 'Bearer [REDACTED]')
                 .replace(/password["\s:=]+[^\s"']+/gi, 'password [REDACTED]')
                 .replace(/token["\s:=]+[^\s"']+/gi, 'token [REDACTED]');
    }

    if (error instanceof Error) {
      return {
        name: error.name,
        message: this.sanitizeErrorForLogging(error.message),
        stack: this.sanitizeErrorForLogging(error.stack || ''),
      };
    }

    return error;
  }

  /**
   * Get error statistics
   */
  getErrorStatistics(): {
    totalErrors: number;
    errorsByType: Record<ErrorType, number>;
  } {
    // This would be implemented with actual error tracking
    return {
      totalErrors: 0,
      errorsByType: {
        [ErrorType.UNKNOWN]: 0,
        [ErrorType.VALIDATION]: 0,
        [ErrorType.AUTHENTICATION]: 0,
        [ErrorType.AUTHORIZATION]: 0,
        [ErrorType.NOT_FOUND]: 0,
        [ErrorType.RATE_LIMIT]: 0,
        [ErrorType.CONNECTOR]: 0,
        [ErrorType.EXECUTION]: 0,
        [ErrorType.ONBOARDING]: 0,
        [ErrorType.DATABASE]: 0,
        [ErrorType.NETWORK]: 0,
        [ErrorType.TIMEOUT]: 0,
        [ErrorType.INTERNAL]: 0,
      },
    };
  }
}

/**
 * Singleton instance
 */
export const platformErrorBoundaryService = new PlatformErrorBoundaryService();
