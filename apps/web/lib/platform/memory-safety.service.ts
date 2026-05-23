/**
 * Memory Safety Service
 * 
 * Canonical memory safety service for CLAUX V1 platform edge hardening.
 * Protects against large payloads, artifact overload, huge connector responses, runaway JSON persistence, oversized snapshots.
 * Payload caps, response truncation, artifact chunking, memory-safe parsing, stream-safe processing.
 * 
 * CRITICAL: This is the ONLY memory safety service in CLAUX.
 */

import { createLogger, Logger } from '@/lib/utils/logger';

/**
 * Memory safety config
 */
export interface MemorySafetyConfig {
  maxPayloadSize: number; // 10MB
  maxResponseSize: number; // 5MB
  maxArtifactSize: number; // 2MB
  maxSnapshotSize: number; // 1MB
  maxJsonDepth: number; // 100 levels
  maxArrayLength: number; // 10000 items
}

/**
 * Memory safety result
 */
export interface MemorySafetyResult {
  safe: boolean;
  truncated: boolean;
  warnings: string[];
  sizeBytes: number;
}

/**
 * Memory safety service
 */
export class MemorySafetyService {
  private logger: Logger;
  private readonly DEFAULT_CONFIG: MemorySafetyConfig = {
    maxPayloadSize: 10 * 1024 * 1024, // 10MB
    maxResponseSize: 5 * 1024 * 1024, // 5MB
    maxArtifactSize: 2 * 1024 * 1024, // 2MB
    maxSnapshotSize: 1 * 1024 * 1024, // 1MB
    maxJsonDepth: 100,
    maxArrayLength: 10000,
  };

  constructor() {
    this.logger = createLogger();
  }

  /**
   * Validate payload size
   */
  validatePayloadSize(payload: unknown, maxSize?: number): MemorySafetyResult {
    const size = this.calculateSize(payload);
    const limit = maxSize ?? this.DEFAULT_CONFIG.maxPayloadSize;
    const warnings: string[] = [];
    let truncated = false;

    if (size > limit) {
      warnings.push(`Payload size ${this.formatBytes(size)} exceeds limit ${this.formatBytes(limit)}`);
      truncated = true;
    }

    return {
      safe: size <= limit,
      truncated,
      warnings,
      sizeBytes: size,
    };
  }

  /**
   * Truncate response if too large
   */
  truncateResponse(data: unknown, maxSize?: number): { data: unknown; truncated: boolean } {
    const size = this.calculateSize(data);
    const limit = maxSize ?? this.DEFAULT_CONFIG.maxResponseSize;

    if (size <= limit) {
      return { data, truncated: false };
    }

    this.logger.warn('Response truncated due to size limit', { size, limit });

    // Return truncated version
    if (typeof data === 'string') {
      return {
        data: data.substring(0, limit),
        truncated: true,
      };
    }

    if (Array.isArray(data)) {
      return {
        data: data.slice(0, this.DEFAULT_CONFIG.maxArrayLength),
        truncated: true,
      };
    }

    if (typeof data === 'object' && data !== null) {
      return {
        data: this.truncateObject(data as Record<string, unknown>, limit),
        truncated: true,
      };
    }

    return { data, truncated: true };
  }

  /**
   * Truncate object
   */
  private truncateObject(obj: Record<string, unknown>, maxSize: number): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    let currentSize = 0;

    for (const [key, value] of Object.entries(obj)) {
      const valueSize = this.calculateSize(value);
      if (currentSize + valueSize > maxSize) {
        break;
      }
      result[key] = value;
      currentSize += valueSize;
    }

    return result;
  }

  /**
   * Validate JSON depth
   */
  validateJsonDepth(data: unknown, maxDepth?: number): { safe: boolean; depth: number; warnings: string[] } {
    const limit = maxDepth ?? this.DEFAULT_CONFIG.maxJsonDepth;
    const depth = this.calculateDepth(data);
    const warnings: string[] = [];

    if (depth > limit) {
      warnings.push(`JSON depth ${depth} exceeds limit ${limit}`);
    }

    return {
      safe: depth <= limit,
      depth,
      warnings,
    };
  }

  /**
   * Validate array length
   */
  validateArrayLength(data: unknown, maxLength?: number): { safe: boolean; length: number; warnings: string[] } {
    const limit = maxLength ?? this.DEFAULT_CONFIG.maxArrayLength;
    const length = Array.isArray(data) ? data.length : 0;
    const warnings: string[] = [];

    if (length > limit) {
      warnings.push(`Array length ${length} exceeds limit ${limit}`);
    }

    return {
      safe: length <= limit,
      length,
      warnings,
    };
  }

  /**
   * Safe JSON parse
   */
  safeJsonParse<T>(json: string, maxDepth?: number): { data: T | null; error?: string } {
    try {
      const data = JSON.parse(json);
      const validation = this.validateJsonDepth(data, maxDepth);

      if (!validation.safe) {
        return {
          data: null,
          error: `JSON depth exceeds limit: ${validation.warnings.join(', ')}`,
        };
      }

      return { data: data as T };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Invalid JSON',
      };
    }
  }

  /**
   * Safe JSON stringify
   */
  safeJsonStringify(data: unknown, maxSize?: number): { json: string | null; error?: string } {
    try {
      const json = JSON.stringify(data);
      const size = Buffer.byteLength(json, 'utf8');
      const limit = maxSize ?? this.DEFAULT_CONFIG.maxPayloadSize;

      if (size > limit) {
        return {
          json: null,
          error: `JSON size ${this.formatBytes(size)} exceeds limit ${this.formatBytes(limit)}`,
        };
      }

      return { json };
    } catch (error) {
      return {
        json: null,
        error: error instanceof Error ? error.message : 'Stringification failed',
      };
    }
  }

  /**
   * Chunk artifact data
   */
  chunkArtifactData(data: unknown, chunkSize?: number): { chunks: unknown[]; chunkCount: number } {
    const size = this.calculateSize(data);
    const limit = chunkSize ?? this.DEFAULT_CONFIG.maxArtifactSize;

    if (size <= limit) {
      return { chunks: [data], chunkCount: 1 };
    }

    if (Array.isArray(data)) {
      const chunks: unknown[] = [];
      const chunkSizeItems = Math.floor(limit / (size / data.length));
      
      for (let i = 0; i < data.length; i += chunkSizeItems) {
        chunks.push(data.slice(i, i + chunkSizeItems));
      }

      return { chunks, chunkCount: chunks.length };
    }

    if (typeof data === 'string') {
      const chunks: string[] = [];
      for (let i = 0; i < data.length; i += limit) {
        chunks.push(data.substring(i, i + limit));
      }
      return { chunks: chunks as unknown[], chunkCount: chunks.length };
    }

    // For objects, return as single chunk (truncated)
    return { chunks: [this.truncateObject(data as Record<string, unknown>, limit)], chunkCount: 1 };
  }

  /**
   * Calculate size in bytes
   */
  private calculateSize(data: unknown): number {
    if (typeof data === 'string') {
      return Buffer.byteLength(data, 'utf8');
    }

    if (typeof data === 'number') {
      return 8;
    }

    if (typeof data === 'boolean') {
      return 1;
    }

    if (data === null || data === undefined) {
      return 0;
    }

    if (Array.isArray(data)) {
      return data.reduce((sum, item) => sum + this.calculateSize(item), 0);
    }

    if (typeof data === 'object') {
      return Object.entries(data).reduce((sum, [key, value]) => {
        return sum + this.calculateSize(key) + this.calculateSize(value);
      }, 0);
    }

    return 0;
  }

  /**
   * Calculate JSON depth
   */
  private calculateDepth(data: unknown, currentDepth = 0, visited = new Set<unknown>()): number {
    if (visited.has(data)) {
      return currentDepth;
    }
    visited.add(data);

    if (typeof data !== 'object' || data === null) {
      return currentDepth;
    }

    if (Array.isArray(data)) {
      return data.reduce((max, item) => {
        return Math.max(max, this.calculateDepth(item, currentDepth + 1, visited));
      }, currentDepth);
    }

    return Object.values(data).reduce((max, value) => {
      return Math.max(max, this.calculateDepth(value, currentDepth + 1, visited));
    }, currentDepth);
  }

  /**
   * Format bytes to human readable
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Get memory stats
   */
  getMemoryStats(): {
    heapUsed: string;
    heapTotal: string;
    external: string;
  } {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage();
      return {
        heapUsed: this.formatBytes(usage.heapUsed),
        heapTotal: this.formatBytes(usage.heapTotal),
        external: this.formatBytes(usage.external),
      };
    }

    return {
      heapUsed: 'N/A',
      heapTotal: 'N/A',
      external: 'N/A',
    };
  }
}

/**
 * Singleton instance
 */
export const memorySafetyService = new MemorySafetyService();
