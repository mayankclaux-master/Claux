/**
 * Real Payload Validation
 * 
 * Validates:
 * - Malformed payloads
 * - Empty responses
 * - Partial responses
 * - Schema drift
 * - API throttling
 * - OAuth expiry
 * - Permission failures
 * - Unexpected response size
 * 
 * Stores anomalies as artifacts.
 */

import { createLogger, Logger } from '@/lib/utils/logger';

/**
 * Anomaly type
 */
export enum AnomalyType {
  MALFORMED_PAYLOAD = 'malformed_payload',
  EMPTY_RESPONSE = 'empty_response',
  PARTIAL_RESPONSE = 'partial_response',
  SCHEMA_DRIFT = 'schema_drift',
  API_THROTTLING = 'api_throttling',
  OAUTH_EXPIRY = 'oauth_expiry',
  PERMISSION_FAILURE = 'permission_failure',
  UNEXPECTED_SIZE = 'unexpected_size',
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  anomalies: Anomaly[];
  warnings: string[];
}

/**
 * Anomaly
 */
export interface Anomaly {
  id: string;
  type: AnomalyType;
  timestamp: number;
  tenantId: string;
  connector: string;
  operation: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  details?: any;
  payload?: any;
}

/**
 * Schema definition
 */
export interface SchemaDefinition {
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';
  properties?: Record<string, SchemaDefinition>;
  items?: SchemaDefinition;
  required?: string[];
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
}

/**
 * Real payload validation service
 */
export class RealPayloadValidation {
  private logger: Logger;
  private anomalies: Anomaly[] = [];
  private schemas: Map<string, SchemaDefinition> = new Map();

  constructor() {
    this.logger = createLogger();
    this.initializeSchemas();
  }

  /**
   * Initialize schemas for common connectors
   */
  private initializeSchemas(): void {
    // DataForSEO response schema
    this.schemas.set('dataforseo_response', {
      type: 'object',
      required: ['status_code', 'tasks'],
      properties: {
        status_code: { type: 'number' },
        tasks: { type: 'array' },
      },
    });

    // SerpAPI response schema
    this.schemas.set('serpapi_response', {
      type: 'object',
      required: ['search_metadata'],
      properties: {
        search_metadata: { type: 'object' },
      },
    });

    // Google Search Console response schema
    this.schemas.set('gsc_response', {
      type: 'object',
      required: ['rows'],
      properties: {
        rows: { type: 'array' },
      },
    });

    // Google Analytics response schema
    this.schemas.set('ga_response', {
      type: 'object',
      required: ['reports'],
      properties: {
        reports: { type: 'array' },
      },
    });
  }

  /**
   * Validate payload
   */
  validatePayload(params: {
    tenantId: string;
    connector: string;
    operation: string;
    payload: any;
    schemaName?: string;
  }): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      anomalies: [],
      warnings: [],
    };

    // Check for empty response
    if (!params.payload || (typeof params.payload === 'object' && Object.keys(params.payload).length === 0)) {
      result.valid = false;
      result.anomalies.push(this.createAnomaly({
        type: AnomalyType.EMPTY_RESPONSE,
        tenantId: params.tenantId,
        connector: params.connector,
        operation: params.operation,
        severity: 'critical',
        message: 'Empty response received',
        details: params.payload,
      }));
    }

    // Check for malformed payload
    if (params.payload && typeof params.payload === 'string') {
      try {
        JSON.parse(params.payload);
      } catch {
        result.valid = false;
        result.anomalies.push(this.createAnomaly({
          type: AnomalyType.MALFORMED_PAYLOAD,
          tenantId: params.tenantId,
          connector: params.connector,
          operation: params.operation,
          severity: 'critical',
          message: 'Malformed JSON payload',
          details: params.payload,
        }));
      }
    }

    // Check for API throttling
    if (this.isThrottled(params.payload)) {
      result.valid = false;
      result.anomalies.push(this.createAnomaly({
        type: AnomalyType.API_THROTTLING,
        tenantId: params.tenantId,
        connector: params.connector,
        operation: params.operation,
        severity: 'warning',
        message: 'API throttling detected',
        details: params.payload,
      }));
    }

    // Check for OAuth expiry
    if (this.isOAuthExpired(params.payload)) {
      result.valid = false;
      result.anomalies.push(this.createAnomaly({
        type: AnomalyType.OAUTH_EXPIRY,
        tenantId: params.tenantId,
        connector: params.connector,
        operation: params.operation,
        severity: 'critical',
        message: 'OAuth token expired',
        details: params.payload,
      }));
    }

    // Check for permission failures
    if (this.isPermissionFailure(params.payload)) {
      result.valid = false;
      result.anomalies.push(this.createAnomaly({
        type: AnomalyType.PERMISSION_FAILURE,
        tenantId: params.tenantId,
        connector: params.connector,
        operation: params.operation,
        severity: 'critical',
        message: 'Permission failure detected',
        details: params.payload,
      }));
    }

    // Check for unexpected response size
    if (this.isUnexpectedSize(params.payload)) {
      result.warnings.push('Unexpected response size detected');
      result.anomalies.push(this.createAnomaly({
        type: AnomalyType.UNEXPECTED_SIZE,
        tenantId: params.tenantId,
        connector: params.connector,
        operation: params.operation,
        severity: 'warning',
        message: 'Unexpected response size',
        details: { size: JSON.stringify(params.payload).length },
      }));
    }

    // Validate against schema if provided
    if (params.schemaName) {
      const schema = this.schemas.get(params.schemaName);
      if (schema) {
        const schemaValid = this.validateSchema(params.payload, schema);
        if (!schemaValid) {
          result.valid = false;
          result.anomalies.push(this.createAnomaly({
            type: AnomalyType.SCHEMA_DRIFT,
            tenantId: params.tenantId,
            connector: params.connector,
            operation: params.operation,
            severity: 'warning',
            message: 'Schema drift detected',
            details: { schema: params.schemaName },
          }));
        }
      }
    }

    // Store anomalies
    result.anomalies.forEach(anomaly => {
      this.anomalies.push(anomaly);
    });

    return result;
  }

  /**
   * Check if response indicates throttling
   */
  private isThrottled(payload: any): boolean {
    if (!payload || typeof payload !== 'object') return false;

    const str = JSON.stringify(payload).toLowerCase();
    return str.includes('rate limit') || 
           str.includes('throttle') || 
           str.includes('429') ||
           str.includes('too many requests');
  }

  /**
   * Check if response indicates OAuth expiry
   */
  private isOAuthExpired(payload: any): boolean {
    if (!payload || typeof payload !== 'object') return false;

    const str = JSON.stringify(payload).toLowerCase();
    return str.includes('token expired') || 
           str.includes('invalid token') || 
           str.includes('unauthorized') ||
           str.includes('401');
  }

  /**
   * Check if response indicates permission failure
   */
  private isPermissionFailure(payload: any): boolean {
    if (!payload || typeof payload !== 'object') return false;

    const str = JSON.stringify(payload).toLowerCase();
    return str.includes('permission denied') || 
           str.includes('access denied') || 
           str.includes('forbidden') ||
           str.includes('403');
  }

  /**
   * Check if response size is unexpected
   */
  private isUnexpectedSize(payload: any): boolean {
    const size = JSON.stringify(payload).length;
    return size > 10000000; // 10MB threshold
  }

  /**
   * Validate against schema
   */
  private validateSchema(payload: any, schema: SchemaDefinition): boolean {
    if (!payload) return false;

    // Type check
    switch (schema.type) {
      case 'object':
        if (typeof payload !== 'object' || Array.isArray(payload)) return false;
        if (schema.required) {
          for (const field of schema.required) {
            if (!(field in payload)) return false;
          }
        }
        if (schema.properties) {
          for (const [key, propSchema] of Object.entries(schema.properties)) {
            if (key in payload && !this.validateSchema(payload[key], propSchema)) {
              return false;
            }
          }
        }
        break;
      case 'array':
        if (!Array.isArray(payload)) return false;
        if (schema.items) {
          for (const item of payload) {
            if (!this.validateSchema(item, schema.items)) return false;
          }
        }
        break;
      case 'string':
        if (typeof payload !== 'string') return false;
        if (schema.minLength && payload.length < schema.minLength) return false;
        if (schema.maxLength && payload.length > schema.maxLength) return false;
        break;
      case 'number':
        if (typeof payload !== 'number') return false;
        if (schema.minimum !== undefined && payload < schema.minimum) return false;
        if (schema.maximum !== undefined && payload > schema.maximum) return false;
        break;
      case 'boolean':
        if (typeof payload !== 'boolean') return false;
        break;
      case 'null':
        if (payload !== null) return false;
        break;
    }

    return true;
  }

  /**
   * Create anomaly
   */
  private createAnomaly(params: {
    type: AnomalyType;
    tenantId: string;
    connector: string;
    operation: string;
    severity: 'critical' | 'warning' | 'info';
    message: string;
    details?: any;
    payload?: any;
  }): Anomaly {
    return {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      ...params,
    };
  }

  /**
   * Get anomalies by type
   */
  getAnomaliesByType(type: AnomalyType): Anomaly[] {
    return this.anomalies.filter(anomaly => anomaly.type === type);
  }

  /**
   * Get anomalies by connector
   */
  getAnomaliesByConnector(connector: string): Anomaly[] {
    return this.anomalies.filter(anomaly => anomaly.connector === connector);
  }

  /**
   * Get anomalies by tenant
   */
  getAnomaliesByTenant(tenantId: string): Anomaly[] {
    return this.anomalies.filter(anomaly => anomaly.tenantId === tenantId);
  }

  /**
   * Get anomalies by severity
   */
  getAnomaliesBySeverity(severity: 'critical' | 'warning' | 'info'): Anomaly[] {
    return this.anomalies.filter(anomaly => anomaly.severity === severity);
  }

  /**
   * Get anomaly statistics
   */
  getAnomalyStatistics(): {
    totalAnomalies: number;
    byType: Record<string, number>;
    byConnector: Record<string, number>;
    bySeverity: Record<string, number>;
  } {
    const total = this.anomalies.length;

    const byType: Record<string, number> = {};
    const byConnector: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};

    this.anomalies.forEach(anomaly => {
      byType[anomaly.type] = (byType[anomaly.type] || 0) + 1;
      byConnector[anomaly.connector] = (byConnector[anomaly.connector] || 0) + 1;
      bySeverity[anomaly.severity] = (bySeverity[anomaly.severity] || 0) + 1;
    });

    return {
      totalAnomalies: total,
      byType,
      byConnector,
      bySeverity,
    };
  }

  /**
   * Export anomalies as JSON
   */
  exportAnomaliesAsJSON(filter?: {
    type?: AnomalyType;
    connector?: string;
    tenantId?: string;
    severity?: 'critical' | 'warning' | 'info';
    since?: number;
    until?: number;
  }): string {
    let anomalies = [...this.anomalies];

    if (filter) {
      if (filter.type) {
        anomalies = anomalies.filter(a => a.type === filter.type);
      }
      if (filter.connector) {
        anomalies = anomalies.filter(a => a.connector === filter.connector);
      }
      if (filter.tenantId) {
        anomalies = anomalies.filter(a => a.tenantId === filter.tenantId);
      }
      if (filter.severity) {
        anomalies = anomalies.filter(a => a.severity === filter.severity);
      }
      if (filter.since !== undefined) {
        anomalies = anomalies.filter(a => a.timestamp >= (filter.since as number));
      }
      if (filter.until !== undefined) {
        anomalies = anomalies.filter(a => a.timestamp <= (filter.until as number));
      }
    }

    anomalies.sort((a, b) => b.timestamp - a.timestamp);
    return JSON.stringify(anomalies, null, 2);
  }

  /**
   * Generate validation report
   */
  generateValidationReport(): string {
    const stats = this.getAnomalyStatistics();
    const recentAnomalies = [...this.anomalies].sort((a, b) => b.timestamp - a.timestamp).slice(0, 10);

    let report = '=== Payload Validation Report ===\n';
    report += `Total Anomalies: ${stats.totalAnomalies}\n\n`;

    report += '--- By Type ---\n';
    Object.entries(stats.byType).forEach(([type, count]) => {
      report += `${type}: ${count}\n`;
    });

    report += '\n--- By Connector ---\n';
    Object.entries(stats.byConnector).forEach(([connector, count]) => {
      report += `${connector}: ${count}\n`;
    });

    report += '\n--- By Severity ---\n';
    Object.entries(stats.bySeverity).forEach(([severity, count]) => {
      report += `${severity}: ${count}\n`;
    });

    report += '\n--- Recent Anomalies ---\n';
    recentAnomalies.forEach(anomaly => {
      report += `${new Date(anomaly.timestamp).toISOString()} - ${anomaly.type}\n`;
      report += `  Connector: ${anomaly.connector}\n`;
      report += `  Operation: ${anomaly.operation}\n`;
      report += `  Severity: ${anomaly.severity}\n`;
      report += `  Message: ${anomaly.message}\n`;
    });

    return report;
  }

  /**
   * Clear anomalies (for testing only)
   */
  clearAnomalies(): void {
    this.logger.warn('Anomalies cleared');
    this.anomalies = [];
  }
}

/**
 * Singleton instance
 */
export const realPayloadValidation = new RealPayloadValidation();
