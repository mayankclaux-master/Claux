/**
 * CLAUX Runtime API Contracts Layer - Types
 */

export type RequestId = string;
export type ResponseId = string;

/**
 * API Request
 */
export interface APIRequest {
  readonly requestId: RequestId;
  readonly method: string;
  readonly path: string;
  readonly body: Record<string, unknown>;
  readonly timestamp: number;
}

/**
 * API Response
 */
export interface APIResponse {
  readonly responseId: ResponseId;
  readonly requestId: RequestId;
  readonly status: number;
  readonly body: Record<string, unknown>;
  readonly timestamp: number;
}

/**
 * Query Result
 */
export interface QueryResult {
  readonly queryId: string;
  readonly data: Record<string, unknown>;
  readonly timestamp: number;
}
