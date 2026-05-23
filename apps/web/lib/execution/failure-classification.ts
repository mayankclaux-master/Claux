/**
 * Failure Classification
 * 
 * Canonical error taxonomy for CLAUX V1.
 * Classifies errors into: transient, permanent, timeout, connector, validation, auth, tenant, persistence.
 * Retry ONLY transient failures.
 * 
 * CRITICAL: This is the ONLY failure classification system in CLAUX.
 */

/**
 * Error type
 */
export enum ErrorType {
  TRANSIENT = 'transient',
  PERMANENT = 'permanent',
  TIMEOUT = 'timeout',
  CONNECTOR = 'connector',
  VALIDATION = 'validation',
  AUTH = 'auth',
  TENANT = 'tenant',
  PERSISTENCE = 'persistence',
}

/**
 * Error classification result
 */
export interface ErrorClassification {
  type: ErrorType;
  retryable: boolean;
  message: string;
  originalError?: unknown;
}

/**
 * Failure classifier
 */
export class FailureClassifier {
  /**
   * Classify error
   */
  classify(error: unknown): ErrorClassification {
    if (error instanceof Error) {
      return this.classifyError(error);
    }

    if (typeof error === 'string') {
      return this.classifyString(error);
    }

    return {
      type: ErrorType.PERMANENT,
      retryable: false,
      message: 'Unknown error',
      originalError: error,
    };
  }

  /**
   * Classify Error object
   */
  private classifyError(error: Error): ErrorClassification {
    const message = error.message.toLowerCase();

    // Timeout errors
    if (this.isTimeoutError(error, message)) {
      return {
        type: ErrorType.TIMEOUT,
        retryable: true,
        message: error.message,
        originalError: error,
      };
    }

    // Network errors (transient)
    if (this.isNetworkError(message)) {
      return {
        type: ErrorType.TRANSIENT,
        retryable: true,
        message: error.message,
        originalError: error,
      };
    }

    // Auth errors (permanent)
    if (this.isAuthError(message)) {
      return {
        type: ErrorType.AUTH,
        retryable: false,
        message: error.message,
        originalError: error,
      };
    }

    // Validation errors (permanent)
    if (this.isValidationError(message)) {
      return {
        type: ErrorType.VALIDATION,
        retryable: false,
        message: error.message,
        originalError: error,
      };
    }

    // Tenant errors (permanent)
    if (this.isTenantError(message)) {
      return {
        type: ErrorType.TENANT,
        retryable: false,
        message: error.message,
        originalError: error,
      };
    }

    // Persistence errors (transient)
    if (this.isPersistenceError(message)) {
      return {
        type: ErrorType.PERSISTENCE,
        retryable: true,
        message: error.message,
        originalError: error,
      };
    }

    // Connector errors (permanent)
    if (this.isConnectorError(message)) {
      return {
        type: ErrorType.CONNECTOR,
        retryable: false,
        message: error.message,
        originalError: error,
      };
    }

    // 5xx errors (transient)
    if (this.is5xxError(message)) {
      return {
        type: ErrorType.TRANSIENT,
        retryable: true,
        message: error.message,
        originalError: error,
      };
    }

    // 4xx errors (permanent, except 429)
    if (this.is4xxError(message) && !this.isRateLimitError(message)) {
      return {
        type: ErrorType.PERMANENT,
        retryable: false,
        message: error.message,
        originalError: error,
      };
    }

    // Rate limit errors (transient)
    if (this.isRateLimitError(message)) {
      return {
        type: ErrorType.TRANSIENT,
        retryable: true,
        message: error.message,
        originalError: error,
      };
    }

    // Default to permanent
    return {
      type: ErrorType.PERMANENT,
      retryable: false,
      message: error.message,
      originalError: error,
    };
  }

  /**
   * Classify string error
   */
  private classifyString(message: string): ErrorClassification {
    const lowerMessage = message.toLowerCase();

    if (this.isNetworkError(lowerMessage)) {
      return {
        type: ErrorType.TRANSIENT,
        retryable: true,
        message,
      };
    }

    if (this.isAuthError(lowerMessage)) {
      return {
        type: ErrorType.AUTH,
        retryable: false,
        message,
      };
    }

    if (this.isValidationError(lowerMessage)) {
      return {
        type: ErrorType.VALIDATION,
        retryable: false,
        message,
      };
    }

    if (this.is5xxError(lowerMessage)) {
      return {
        type: ErrorType.TRANSIENT,
        retryable: true,
        message,
      };
    }

    return {
      type: ErrorType.PERMANENT,
      retryable: false,
      message,
    };
  }

  /**
   * Check if error is timeout error
   */
  private isTimeoutError(error: Error, message: string): boolean {
    return (
      error.name === 'TimeoutError' ||
      message.includes('timeout') ||
      message.includes('timed out') ||
      message.includes('etimedout')
    );
  }

  /**
   * Check if error is network error
   */
  private isNetworkError(message: string): boolean {
    return (
      message.includes('network') ||
      message.includes('econnrefused') ||
      message.includes('enotfound') ||
      message.includes('econnreset') ||
      message.includes('epipe') ||
      message.includes('fetch failed')
    );
  }

  /**
   * Check if error is auth error
   */
  private isAuthError(message: string): boolean {
    return (
      message.includes('unauthorized') ||
      message.includes('authentication') ||
      message.includes('auth failed') ||
      message.includes('invalid token') ||
      message.includes('forbidden') ||
      message.includes('401') ||
      message.includes('403')
    );
  }

  /**
   * Check if error is validation error
   */
  private isValidationError(message: string): boolean {
    return (
      message.includes('validation') ||
      message.includes('invalid') ||
      message.includes('required') ||
      message.includes('malformed') ||
      message.includes('bad request') ||
      message.includes('400')
    );
  }

  /**
   * Check if error is tenant error
   */
  private isTenantError(message: string): boolean {
    return (
      message.includes('tenant') ||
      message.includes('organization') ||
      message.includes('workspace') ||
      message.includes('not found')
    );
  }

  /**
   * Check if error is persistence error
   */
  private isPersistenceError(message: string): boolean {
    return (
      message.includes('database') ||
      message.includes('supabase') ||
      message.includes('postgres') ||
      message.includes('connection') ||
      message.includes('deadlock') ||
      message.includes('constraint')
    );
  }

  /**
   * Check if error is connector error
   */
  private isConnectorError(message: string): boolean {
    return (
      message.includes('connector') ||
      message.includes('provider') ||
      message.includes('api error') ||
      message.includes('service unavailable')
    );
  }

  /**
   * Check if error is 5xx error
   */
  private is5xxError(message: string): boolean {
    return message.includes('5') && message.length < 4;
  }

  /**
   * Check if error is 4xx error
   */
  private is4xxError(message: string): boolean {
    return message.includes('4') && message.length < 4;
  }

  /**
   * Check if error is rate limit error
   */
  private isRateLimitError(message: string): boolean {
    return (
      message.includes('rate limit') ||
      message.includes('429') ||
      message.includes('too many requests')
    );
  }

  /**
   * Check if error is retryable
   */
  isRetryable(error: unknown): boolean {
    const classification = this.classify(error);
    return classification.retryable;
  }

  /**
   * Get error type
   */
  getErrorType(error: unknown): ErrorType {
    const classification = this.classify(error);
    return classification.type;
  }
}

/**
 * Singleton instance
 */
export const failureClassifier = new FailureClassifier();

/**
 * Convenience functions
 */
export function classifyError(error: unknown): ErrorClassification {
  return failureClassifier.classify(error);
}

export function isRetryableError(error: unknown): boolean {
  return failureClassifier.isRetryable(error);
}

export function getErrorType(error: unknown): ErrorType {
  return failureClassifier.getErrorType(error);
}
