/**
 * CLAUX Runtime API Contracts Layer - Request Response
 */

import type { APIRequest, APIResponse, RequestId, ResponseId } from './types';
import { RequestError } from './errors';

/**
 * Request Response Manager
 */
export class RequestResponseManager {
  private requests: Map<RequestId, APIRequest> = new Map();
  private responses: Map<ResponseId, APIResponse> = new Map();

  /**
   * Create request
   */
  createRequest(method: string, path: string, body: Record<string, unknown>): APIRequest {
    const requestId = this.generateRequestId();
    const request: APIRequest = {
      requestId,
      method,
      path,
      body,
      timestamp: Date.now(),
    };

    this.requests.set(requestId, request);
    return request;
  }

  /**
   * Create response
   */
  createResponse(requestId: RequestId, status: number, body: Record<string, unknown>): APIResponse {
    const responseId = this.generateResponseId();
    const response: APIResponse = {
      responseId,
      requestId,
      status,
      body,
      timestamp: Date.now(),
    };

    this.responses.set(responseId, response);
    return response;
  }

  /**
   * Get request
   */
  getRequest(requestId: RequestId): APIRequest | undefined {
    return this.requests.get(requestId);
  }

  /**
   * Get response
   */
  getResponse(responseId: ResponseId): APIResponse | undefined {
    return this.responses.get(responseId);
  }

  /**
   * Clear
   */
  clear(): void {
    this.requests.clear();
    this.responses.clear();
  }

  /**
   * Generate request ID
   */
  private generateRequestId(): RequestId {
    return `req_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Generate response ID
   */
  private generateResponseId(): ResponseId {
    return `res_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }
}
