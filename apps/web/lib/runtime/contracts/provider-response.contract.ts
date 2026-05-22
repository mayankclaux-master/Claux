/**
 * Canonical Provider Response Contract
 * 
 * This contract defines the standardized response format for all provider executions.
 * All runtime connectors MUST return responses in this format.
 * 
 * CRITICAL: This is the ONLY response format allowed to flow from connectors to RuntimeService.
 */

import type { UUID } from '../types/common.types';

/**
 * Provider execution status
 */
export enum ProviderExecutionStatus {
  SUCCESS = 'success',
  FAILURE = 'failure',
  RETRYABLE_ERROR = 'retryable_error',
  FATAL_ERROR = 'fatal_error',
  RATE_LIMITED = 'rate_limited',
  AUTHENTICATION_ERROR = 'authentication_error',
}

/**
 * Provider metadata
 * Contains execution metadata from the provider
 */
export interface ProviderMetadata {
  readonly provider: string;
  readonly operation: string;
  readonly executionTimeMs: number;
  readonly timestamp: string;
  readonly rateLimit?: {
    readonly remaining: number;
    readonly resetAt: string;
  };
  readonly quota?: {
    readonly used: number;
    readonly limit: number;
  };
  readonly cost?: {
    readonly currency: string;
    readonly amount: number;
  };
  readonly tokens?: {
    readonly promptTokens: number;
    readonly completionTokens: number;
    readonly totalTokens: number;
  };
}

/**
 * Provider error
 * Canonical error format for all provider errors
 */
export interface ProviderError {
  readonly code: string;
  readonly message: string;
  readonly type: ProviderExecutionStatus;
  readonly retryable: boolean;
  readonly details?: Record<string, unknown>;
}

/**
 * Canonical provider response
 * All connectors MUST return this format
 */
export interface ProviderResponse<T = unknown> {
  readonly status: ProviderExecutionStatus;
  readonly data: T | null;
  readonly error: ProviderError | null;
  readonly metadata: ProviderMetadata;
  readonly tenantId: UUID;
  readonly executionId: UUID;
  readonly taskId: UUID;
}

/**
 * OpenAI-specific response data
 */
export interface OpenAIResponseData {
  readonly content: string;
  readonly model: string;
  readonly tokensUsed: number;
}

/**
 * DataForSEO-specific response data
 */
export interface DataForSEOResponseData {
  readonly keyword: string;
  readonly volume: number;
  readonly difficulty: number;
  readonly cpc?: number;
  readonly intent?: string;
}

/**
 * WordPress-specific response data
 */
export interface WordPressResponseData {
  readonly id: number;
  readonly url: string;
  readonly status: string;
  readonly date: string;
}

/**
 * Google Search Console-specific response data
 */
export interface GoogleSearchConsoleResponseData {
  readonly clicks: number;
  readonly impressions: number;
  readonly ctr: number;
  readonly position: number;
}

/**
 * Google Analytics-specific response data
 */
export interface GoogleAnalyticsResponseData {
  readonly sessions: number;
  readonly users: number;
  readonly pageviews: number;
  readonly bounceRate: number;
}

/**
 * Google Business Profile-specific response data
 */
export interface GoogleBusinessProfileResponseData {
  readonly gmb_name: string;
  readonly primary_category: string;
  readonly review_count: number;
  readonly average_rating: number;
  readonly photos_count: number;
  readonly posts_count: number;
}

/**
 * Custom API-specific response data
 */
export interface CustomAPIResponseData {
  readonly data: Record<string, unknown>;
  readonly status: number;
  readonly headers: Record<string, string>;
}

/**
 * Create a successful provider response
 */
export function createProviderResponse<T>(
  data: T,
  metadata: ProviderMetadata,
  tenantId: UUID,
  executionId: UUID,
  taskId: UUID
): ProviderResponse<T> {
  return {
    status: ProviderExecutionStatus.SUCCESS,
    data,
    error: null,
    metadata,
    tenantId,
    executionId,
    taskId,
  };
}

/**
 * Create a failed provider response
 */
export function createProviderErrorResponse(
  error: ProviderError,
  metadata: ProviderMetadata,
  tenantId: UUID,
  executionId: UUID,
  taskId: UUID
): ProviderResponse<null> {
  return {
    status: error.type,
    data: null,
    error,
    metadata,
    tenantId,
    executionId,
    taskId,
  };
}
