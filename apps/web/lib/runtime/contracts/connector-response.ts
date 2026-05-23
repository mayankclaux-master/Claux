/**
 * Connector Response Standardization
 * 
 * Canonical response format for all connectors in CLAUX V1.
 * Ensures consistent response structure across all providers.
 * 
 * CRITICAL: All connectors MUST return this format.
 */

/**
 * Canonical connector response
 */
export interface ConnectorResponse<T = unknown> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: ConnectorError;
  readonly traceId?: string;
  readonly executionTime?: number;
  readonly source: string;
}

/**
 * Connector error
 */
export interface ConnectorError {
  readonly code: string;
  readonly message: string;
  readonly details?: Record<string, unknown>;
}

/**
 * Create success response
 */
export function createConnectorResponse<T>(
  data: T,
  source: string,
  traceId?: string,
  executionTime?: number
): ConnectorResponse<T> {
  return {
    success: true,
    data,
    traceId,
    executionTime,
    source,
  };
}

/**
 * Create error response
 */
export function createConnectorError(
  code: string,
  message: string,
  source: string,
  traceId?: string,
  executionTime?: number,
  details?: Record<string, unknown>
): ConnectorResponse {
  return {
    success: false,
    error: {
      code,
      message,
      details,
    },
    traceId,
    executionTime,
    source,
  };
}

/**
 * Wrap connector execution
 */
export async function wrapConnectorExecution<T>(
  source: string,
  operation: () => Promise<T>,
  traceId?: string
): Promise<ConnectorResponse<T>> {
  const startTime = Date.now();
  
  try {
    const data = await operation();
    const executionTime = Date.now() - startTime;
    
    return createConnectorResponse(data, source, traceId, executionTime);
  } catch (error) {
    const executionTime = Date.now() - startTime;
    
    const code = error instanceof Error ? error.name : 'UNKNOWN_ERROR';
    const message = error instanceof Error ? error.message : 'Unknown error';
    
    return createConnectorError(code, message, source, traceId, executionTime) as ConnectorResponse<T>;
  }
}

/**
 * Validate connector response
 */
export function validateConnectorResponse<T>(response: unknown): response is ConnectorResponse<T> {
  if (typeof response !== 'object' || response === null) {
    return false;
  }
  
  const r = response as Record<string, unknown>;
  
  if (typeof r.success !== 'boolean') {
    return false;
  }
  
  if (typeof r.source !== 'string') {
    return false;
  }
  
  if (r.success === false && !r.error) {
    return false;
  }
  
  if (r.error) {
    const error = r.error as Record<string, unknown>;
    if (typeof error.code !== 'string' || typeof error.message !== 'string') {
      return false;
    }
  }
  
  return true;
}

/**
 * Extract data from connector response
 */
export function extractConnectorData<T>(response: ConnectorResponse<T>): T | null {
  if (response.success && response.data !== undefined) {
    return response.data;
  }
  return null;
}

/**
 * Extract error from connector response
 */
export function extractConnectorError(response: ConnectorResponse): ConnectorError | null {
  if (!response.success && response.error) {
    return response.error;
  }
  return null;
}
