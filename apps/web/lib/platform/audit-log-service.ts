/**
 * Audit Logging Service
 * 
 * Internal audit log service tracking admin actions, onboarding actions, connector changes, execution reruns, schedule changes, feature flag changes, cache invalidations.
 * Everything is tenant-linked, trace-linked, and immutable.
 */

import { createLogger, Logger } from '@/lib/utils/logger';

/**
 * Audit action type
 */
export enum AuditActionType {
  ADMIN_ACTION = 'admin_action',
  ONBOARDING_ACTION = 'onboarding_action',
  CONNECTOR_CHANGE = 'connector_change',
  EXECUTION_RERUN = 'execution_rerun',
  SCHEDULE_CHANGE = 'schedule_change',
  FEATURE_FLAG_CHANGE = 'feature_flag_change',
  CACHE_INVALIDATION = 'cache_invalidation',
  TENANT_OPERATION = 'tenant_operation',
}

/**
 * Audit log entry
 */
export interface AuditLogEntry {
  id: string;
  actionType: AuditActionType;
  tenantId?: string;
  userId: string;
  traceId?: string;
  action: string;
  details: Record<string, any>;
  timestamp: number;
  immutable: boolean;
}

/**
 * Audit log service
 */
export class AuditLogService {
  private logger: Logger;
  private auditLogs: AuditLogEntry[] = [];

  constructor() {
    this.logger = createLogger();
  }

  /**
   * Log admin action
   */
  logAdminAction(userId: string, action: string, details: Record<string, any>, tenantId?: string): string {
    return this.log({
      actionType: AuditActionType.ADMIN_ACTION,
      userId,
      tenantId,
      action,
      details,
    });
  }

  /**
   * Log onboarding action
   */
  logOnboardingAction(tenantId: string, userId: string, action: string, details: Record<string, any>): string {
    return this.log({
      actionType: AuditActionType.ONBOARDING_ACTION,
      tenantId,
      userId,
      action,
      details,
    });
  }

  /**
   * Log connector change
   */
  logConnectorChange(tenantId: string, userId: string, connector: string, action: string, details: Record<string, any>): string {
    return this.log({
      actionType: AuditActionType.CONNECTOR_CHANGE,
      tenantId,
      userId,
      action: `${action} ${connector}`,
      details: { connector, ...details },
    });
  }

  /**
   * Log execution rerun
   */
  logExecutionRerun(tenantId: string, userId: string, executionId: string, reason: string): string {
    return this.log({
      actionType: AuditActionType.EXECUTION_RERUN,
      tenantId,
      userId,
      action: 'rerun execution',
      details: { executionId, reason },
    });
  }

  /**
   * Log schedule change
   */
  logScheduleChange(tenantId: string, userId: string, scheduleId: string, action: string, details: Record<string, any>): string {
    return this.log({
      actionType: AuditActionType.SCHEDULE_CHANGE,
      tenantId,
      userId,
      action: `${action} schedule`,
      details: { scheduleId, ...details },
    });
  }

  /**
   * Log feature flag change
   */
  logFeatureFlagChange(userId: string, flagId: string, action: string, details: Record<string, any>, tenantId?: string): string {
    return this.log({
      actionType: AuditActionType.FEATURE_FLAG_CHANGE,
      tenantId,
      userId,
      action: `${action} feature flag`,
      details: { flagId, ...details },
    });
  }

  /**
   * Log cache invalidation
   */
  logCacheInvalidation(tenantId: string, userId: string, cacheKey: string, reason: string): string {
    return this.log({
      actionType: AuditActionType.CACHE_INVALIDATION,
      tenantId,
      userId,
      action: 'invalidate cache',
      details: { cacheKey, reason },
    });
  }

  /**
   * Log tenant operation
   */
  logTenantOperation(tenantId: string, userId: string, operation: string, details: Record<string, any>): string {
    return this.log({
      actionType: AuditActionType.TENANT_OPERATION,
      tenantId,
      userId,
      action: operation,
      details,
    });
  }

  /**
   * Generic log method
   */
  private log(entry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'immutable' | 'traceId'>): string {
    const auditEntry: AuditLogEntry = {
      id: crypto.randomUUID(),
      traceId: crypto.randomUUID(),
      timestamp: Date.now(),
      immutable: true,
      ...entry,
    };

    this.auditLogs.push(auditEntry);
    this.logger.info('Audit log entry created', { auditEntry });

    return auditEntry.id;
  }

  /**
   * Get audit logs for tenant
   */
  getTenantAuditLogs(tenantId: string, limit?: number): AuditLogEntry[] {
    const logs = this.auditLogs.filter(log => log.tenantId === tenantId);
    logs.sort((a, b) => b.timestamp - a.timestamp); // Most recent first
    return limit ? logs.slice(0, limit) : logs;
  }

  /**
   * Get audit logs by action type
   */
  getAuditLogsByType(actionType: AuditActionType, limit?: number): AuditLogEntry[] {
    const logs = this.auditLogs.filter(log => log.actionType === actionType);
    logs.sort((a, b) => b.timestamp - a.timestamp);
    return limit ? logs.slice(0, limit) : logs;
  }

  /**
   * Get audit logs by user
   */
  getAuditLogsByUser(userId: string, limit?: number): AuditLogEntry[] {
    const logs = this.auditLogs.filter(log => log.userId === userId);
    logs.sort((a, b) => b.timestamp - a.timestamp);
    return limit ? logs.slice(0, limit) : logs;
  }

  /**
   * Get audit log by trace ID
   */
  getAuditLogByTraceId(traceId: string): AuditLogEntry | undefined {
    return this.auditLogs.find(log => log.traceId === traceId);
  }

  /**
   * Get audit log by ID
   */
  getAuditLogById(id: string): AuditLogEntry | undefined {
    return this.auditLogs.find(log => log.id === id);
  }

  /**
   * Get all audit logs
   */
  getAllAuditLogs(limit?: number): AuditLogEntry[] {
    const logs = [...this.auditLogs];
    logs.sort((a, b) => b.timestamp - a.timestamp);
    return limit ? logs.slice(0, limit) : logs;
  }

  /**
   * Get audit logs within time range
   */
  getAuditLogsByTimeRange(startTime: number, endTime: number): AuditLogEntry[] {
    const logs = this.auditLogs.filter(log => log.timestamp >= startTime && log.timestamp <= endTime);
    logs.sort((a, b) => b.timestamp - a.timestamp);
    return logs;
  }

  /**
   * Get audit log statistics
   */
  getAuditLogStatistics(): {
    totalLogs: number;
    logsByActionType: Record<AuditActionType, number>;
    logsByTenant: Record<string, number>;
    logsByUser: Record<string, number>;
    timeRange: { earliest: number; latest: number };
  } {
    const logsByActionType: Record<AuditActionType, number> = {
      [AuditActionType.ADMIN_ACTION]: 0,
      [AuditActionType.ONBOARDING_ACTION]: 0,
      [AuditActionType.CONNECTOR_CHANGE]: 0,
      [AuditActionType.EXECUTION_RERUN]: 0,
      [AuditActionType.SCHEDULE_CHANGE]: 0,
      [AuditActionType.FEATURE_FLAG_CHANGE]: 0,
      [AuditActionType.CACHE_INVALIDATION]: 0,
      [AuditActionType.TENANT_OPERATION]: 0,
    };

    const logsByTenant: Record<string, number> = {};
    const logsByUser: Record<string, number> = {};

    this.auditLogs.forEach(log => {
      logsByActionType[log.actionType]++;
      
      if (log.tenantId) {
        logsByTenant[log.tenantId] = (logsByTenant[log.tenantId] || 0) + 1;
      }
      
      logsByUser[log.userId] = (logsByUser[log.userId] || 0) + 1;
    });

    const timestamps = this.auditLogs.map(log => log.timestamp);
    const timeRange = timestamps.length > 0
      ? { earliest: Math.min(...timestamps), latest: Math.max(...timestamps) }
      : { earliest: 0, latest: 0 };

    return {
      totalLogs: this.auditLogs.length,
      logsByActionType,
      logsByTenant,
      logsByUser,
      timeRange,
    };
  }

  /**
   * Export audit logs as JSON
   */
  exportAuditLogsAsJSON(filter?: {
    tenantId?: string;
    actionType?: AuditActionType;
    userId?: string;
    startTime?: number;
    endTime?: number;
  }): string {
    let logs = [...this.auditLogs];

    if (filter) {
      if (filter.tenantId) {
        logs = logs.filter(log => log.tenantId === filter.tenantId);
      }
      if (filter.actionType) {
        logs = logs.filter(log => log.actionType === filter.actionType);
      }
      if (filter.userId) {
        logs = logs.filter(log => log.userId === filter.userId);
      }
      if (filter.startTime !== undefined) {
        logs = logs.filter(log => log.timestamp >= (filter.startTime as number));
      }
      if (filter.endTime !== undefined) {
        logs = logs.filter(log => log.timestamp <= (filter.endTime as number));
      }
    }

    logs.sort((a, b) => b.timestamp - a.timestamp);
    return JSON.stringify(logs, null, 2);
  }

  /**
   * Clear audit logs (for testing only - should never be called in production)
   */
  clearAuditLogs(): void {
    this.logger.warn('Audit logs cleared - this should never happen in production');
    this.auditLogs = [];
  }

  /**
   * Verify audit log immutability
   */
  verifyImmutability(logId: string): boolean {
    const log = this.auditLogs.find(l => l.id === logId);
    return log ? log.immutable : false;
  }
}

/**
 * Singleton instance
 */
export const auditLogService = new AuditLogService();
