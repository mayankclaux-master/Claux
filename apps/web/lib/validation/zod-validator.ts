/**
 * Global Zod Validation Layer
 * 
 * Canonical validation system for CLAUX V1.
 * Provides typed validation for requests, connector responses, API payloads, and execution payloads.
 * 
 * CRITICAL: This is the ONLY validation layer in CLAUX.
 */

import { z, ZodSchema, ZodError } from 'zod';

/**
 * Validation result
 */
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: z.ZodError;
  errorDetails?: string[];
}

/**
 * Validate data against schema
 */
export function validate<T>(schema: ZodSchema<T>, data: unknown): ValidationResult<T> {
  try {
    const parsed = schema.parse(data);
    return {
      success: true,
      data: parsed,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorDetails = error.errors.map((err) => {
        return `${err.path.join('.')}: ${err.message}`;
      });
      return {
        success: false,
        errors: error,
        errorDetails,
      };
    }
    return {
      success: false,
      errorDetails: ['Unknown validation error'],
    };
  }
}

/**
 * Validate with safeParse (no throw)
 */
export function validateSafe<T>(schema: ZodSchema<T>, data: unknown): ValidationResult<T> {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return {
      success: true,
      data: result.data,
    };
  }
  
  const errorDetails = result.error.errors.map((err) => {
    return `${err.path.join('.')}: ${err.message}`;
  });
  
  return {
    success: false,
    errors: result.error,
    errorDetails,
  };
}

/**
 * Common schemas
 */

// UUID validation
export const uuidSchema = z.string().uuid();

// Tenant ID validation
export const tenantIdSchema = uuidSchema;

// User ID validation
export const userIdSchema = uuidSchema;

// Execution ID validation
export const executionIdSchema = uuidSchema;

// Task ID validation
export const taskIdSchema = uuidSchema;

// Agent name validation
export const agentNameSchema = z.enum(['ARIA', 'SCRIBE', 'PUBLISH', 'PULSE', 'LOCL', 'REPUTE', 'LINX', 'PRISM', 'CORE']);

// Task type validation
export const taskTypeSchema = z.string().min(1).max(100);

// Task priority validation
export const taskPrioritySchema = z.enum(['low', 'medium', 'high', 'urgent']);

// Task status validation
export const taskStatusSchema = z.enum(['pending', 'in_progress', 'completed', 'blocked', 'failed']);

// Execution status validation
export const executionStatusSchema = z.enum(['pending', 'running', 'completed', 'failed', 'cancelled']);

// URL validation
export const urlSchema = z.string().url();

// Email validation
export const emailSchema = z.string().email();

// Pagination schema
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

// Date range schema
export const dateRangeSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

/**
 * API request schemas
 */

// Agent run request
export const agentRunRequestSchema = z.object({
  agent: agentNameSchema,
  runId: uuidSchema.optional(),
  options: z.record(z.unknown()).optional(),
});

// Execution request
export const executionRequestSchema = z.object({
  executionId: executionIdSchema.optional(),
  agentName: agentNameSchema,
  workflowType: z.string().min(1).max(100),
  metadata: z.record(z.unknown()).optional(),
});

// Task request
export const taskRequestSchema = z.object({
  taskId: taskIdSchema.optional(),
  executionId: executionIdSchema,
  taskName: z.string().min(1).max(200),
  taskType: taskTypeSchema,
  stepOrder: z.number().int().min(1),
  inputPayload: z.record(z.unknown()),
});

/**
 * Connector response schemas
 */

// Canonical connector response
export const connectorResponseSchema = z.object({
  success: z.boolean(),
  data: z.unknown().optional(),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.unknown()).optional(),
  }).optional(),
  traceId: z.string().optional(),
  executionTime: z.number().optional(),
  source: z.string().optional(),
});

/**
 * Execution payload schemas
 */

// Agent context
export const agentContextSchema = z.object({
  tenantId: tenantIdSchema,
  agent: agentNameSchema,
  runId: uuidSchema,
  workspaceId: uuidSchema.optional(),
});

/**
 * Utility functions
 */

/**
 * Validate and throw on error
 */
export function validateOrThrow<T>(schema: ZodSchema<T>, data: unknown): T {
  const result = validate(schema, data);
  if (!result.success) {
    throw new Error(`Validation failed: ${result.errorDetails?.join(', ')}`);
  }
  return result.data as T;
}

/**
 * Validate and return error message
 */
export function validateOrErrorMessage<T>(schema: ZodSchema<T>, data: unknown): string | null {
  const result = validate(schema, data);
  if (!result.success) {
    return result.errorDetails?.join(', ') || 'Validation failed';
  }
  return null;
}
