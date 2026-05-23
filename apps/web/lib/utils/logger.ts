/**
 * Structured Logger
 * 
 * Centralized logger for CLAUX V1.
 * JSON structured logs, traceId support, tenantId support, executionId support.
 * 
 * CRITICAL: This is the ONLY logger in CLAUX.
 */

/**
 * Log level
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

/**
 * Log entry
 */
export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  traceId?: string;
  tenantId?: string;
  executionId?: string;
  taskId?: string;
  userId?: string;
  context?: Record<string, unknown>;
}

/**
 * Logger options
 */
export interface LoggerOptions {
  traceId?: string;
  tenantId?: string;
  executionId?: string;
  taskId?: string;
  userId?: string;
  context?: Record<string, unknown>;
}

/**
 * Logger class
 */
export class Logger {
  private options: LoggerOptions;

  constructor(options: LoggerOptions = {}) {
    this.options = options;
  }

  /**
   * Create child logger with additional context
   */
  child(options: Partial<LoggerOptions>): Logger {
    return new Logger({
      ...this.options,
      ...options,
      context: {
        ...this.options.context,
        ...options.context,
      },
    });
  }

  /**
   * Log debug message
   */
  debug(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  /**
   * Log info message
   */
  info(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * Log error message
   */
  error(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.ERROR, message, context);
  }

  /**
   * Internal log method
   */
  private log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      traceId: this.options.traceId,
      tenantId: this.options.tenantId,
      executionId: this.options.executionId,
      taskId: this.options.taskId,
      userId: this.options.userId,
      context: {
        ...this.options.context,
        ...context,
      },
    };

    // Output as JSON for structured logging
    console.log(JSON.stringify(entry));
  }
}

/**
 * Create logger with options
 */
export function createLogger(options: LoggerOptions = {}): Logger {
  return new Logger(options);
}

/**
 * Global logger instance (without context)
 */
export const logger = new Logger();

/**
 * Convenience functions
 */
export const logDebug = (message: string, context?: Record<string, unknown>): void => {
  logger.debug(message, context);
};

export const logInfo = (message: string, context?: Record<string, unknown>): void => {
  logger.info(message, context);
};

export const logWarn = (message: string, context?: Record<string, unknown>): void => {
  logger.warn(message, context);
};

export const logError = (message: string, context?: Record<string, unknown>): void => {
  logger.error(message, context);
};
