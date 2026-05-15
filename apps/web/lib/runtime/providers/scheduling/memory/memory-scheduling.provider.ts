/**
 * Memory Scheduling Provider
 * 
 * Reference implementation of SchedulingAdapter for in-memory scheduling semantics.
 * Validates scheduling adapter contracts and runtime scheduling semantics.
 * 
 * This is a semantic validation provider, NOT production-ready.
 * For production, use BullMQ scheduling, Kubernetes CronJobs, or AWS EventBridge.
 */

import type {
  SchedulingAdapter,
  SchedulingAdapterConfig,
  RuntimeSchedule,
  ScheduleResult,
  ScheduleUpdate,
  SchedulingScheduleFilter as ScheduleFilter,
  SchedulingLease,
  SchedulingContext,
  SchedulingDecision,
  SchedulingTopology,
  SchedulingHealthStatus,
  SchedulingCapabilities,
  ScheduleMetadata,
  SchedulingConstraints,
} from '../../../adapters';
import {
  ScheduleType,
  SchedulingPolicy,
  TopologyType,
  DecisionType,
} from '../../../adapters';

export interface MemorySchedulingProviderConfig extends SchedulingAdapterConfig {
  readonly maxSchedules?: number;
}

export class MemorySchedulingProvider implements SchedulingAdapter {
  readonly adapterId: string;
  readonly providerType: string = 'memory';
  readonly capabilities: SchedulingCapabilities;

  private initialized: boolean = false;
  private schedules: Map<string, RuntimeSchedule> = new Map();
  private leases: Map<string, SchedulingLease> = new Map();
  private scheduleIdCounter: number = 0;
  private leaseIdCounter: number = 0;
  private config: SchedulingAdapterConfig;
  private maxSchedules: number;

  constructor(config: SchedulingAdapterConfig) {
    this.adapterId = `memory-scheduling-${Date.now()}`;
    this.config = config;
    this.maxSchedules = (config as MemorySchedulingProviderConfig).maxSchedules ?? 1000;
    this.capabilities = {
      supportedScheduleTypes: [
        ScheduleType.DELAYED,
        ScheduleType.ONE_TIME,
        ScheduleType.INTERVAL,
      ],
      supportedSchedulingPolicies: [
        SchedulingPolicy.FIFO,
        SchedulingPolicy.PRIORITY,
      ],
      supportedTopologyTypes: [TopologyType.CUSTOM],
      supportsLeasing: true,
      supportsTopologyAware: false,
      supportsDeadlineAware: false,
      supportsFairShare: false,
      supportsPriority: true,
      supportsAffinity: false,
      supportsConcurrency: true,
      maxSchedules: this.maxSchedules,
      maxLeaseDurationMs: 3600000, // 1 hour
    };
  }

  async initialize(config: SchedulingAdapterConfig): Promise<void> {
    this.config = config;
    this.initialized = true;
  }

  async createSchedule(schedule: RuntimeSchedule): Promise<ScheduleResult> {
    if (!this.initialized) {
      throw new Error('Scheduling provider not initialized');
    }

    if (this.schedules.size >= this.maxSchedules) {
      return {
        scheduleId: schedule.scheduleId,
        success: false,
        scheduledAt: new Date(),
        error: {
          code: 'CAPACITY_EXCEEDED',
          message: 'Maximum schedule capacity reached',
        },
      };
    }

    this.schedules.set(schedule.scheduleId, schedule);

    return {
      scheduleId: schedule.scheduleId,
      success: true,
      scheduledAt: new Date(),
    };
  }

  async updateSchedule(scheduleId: string, updates: ScheduleUpdate): Promise<ScheduleResult> {
    if (!this.initialized) {
      throw new Error('Scheduling provider not initialized');
    }

    const schedule = this.schedules.get(scheduleId);
    if (!schedule) {
      return {
        scheduleId,
        success: false,
        scheduledAt: new Date(),
        error: {
          code: 'SCHEDULE_NOT_FOUND',
          message: `Schedule ${scheduleId} not found`,
        },
      };
    }

    const updatedSchedule: RuntimeSchedule = {
      ...schedule,
      scheduleExpression: updates.scheduleExpression ?? schedule.scheduleExpression,
      schedulingPolicy: updates.schedulingPolicy ?? schedule.schedulingPolicy,
      metadata: updates.metadata ? { ...schedule.metadata, ...updates.metadata } : schedule.metadata,
      constraints: updates.constraints ? { ...schedule.constraints, ...updates.constraints } : schedule.constraints,
      updatedAt: new Date(),
    };

    this.schedules.set(scheduleId, updatedSchedule);

    return {
      scheduleId,
      success: true,
      scheduledAt: new Date(),
    };
  }

  async deleteSchedule(scheduleId: string): Promise<void> {
    if (!this.initialized) {
      throw new Error('Scheduling provider not initialized');
    }

    this.schedules.delete(scheduleId);
  }

  async getSchedule(scheduleId: string): Promise<RuntimeSchedule | null> {
    if (!this.initialized) {
      throw new Error('Scheduling provider not initialized');
    }

    return this.schedules.get(scheduleId) ?? null;
  }

  async listSchedules(filter?: ScheduleFilter): Promise<readonly RuntimeSchedule[]> {
    if (!this.initialized) {
      throw new Error('Scheduling provider not initialized');
    }

    let schedules = Array.from(this.schedules.values());

    if (filter) {
      if (filter.scheduleType) {
        schedules = schedules.filter(s => s.scheduleType === filter.scheduleType);
      }
      if (filter.schedulingPolicy) {
        schedules = schedules.filter(s => s.schedulingPolicy === filter.schedulingPolicy);
      }
      if (filter.labels) {
        schedules = schedules.filter(s =>
          Object.entries(filter.labels!).every(([key, value]) => s.metadata.labels[key] === value)
        );
      }
      if (filter.limit) {
        schedules = schedules.slice(0, filter.limit);
      }
      if (filter.offset) {
        schedules = schedules.slice(filter.offset);
      }
    }

    return schedules;
  }

  async acquireSchedulingLease(scheduleId: string, options?: { leaseDurationMs?: number }): Promise<SchedulingLease> {
    if (!this.initialized) {
      throw new Error('Scheduling provider not initialized');
    }

    const schedule = this.schedules.get(scheduleId);
    if (!schedule) {
      throw new Error('Schedule not found');
    }

    const leaseId = `lease-${++this.leaseIdCounter}`;
    const leaseDurationMs = options?.leaseDurationMs ?? 60000; // 1 minute default
    const leasedAt = new Date();
    const leaseExpiresAt = new Date(leasedAt.getTime() + leaseDurationMs);

    const lease: SchedulingLease = {
      leaseId,
      scheduleId,
      leasedAt,
      leaseExpiresAt,
      leaseDurationMs,
      leaseCount: 1,
    };

    this.leases.set(leaseId, lease);

    return lease;
  }

  async renewSchedulingLease(leaseId: string): Promise<SchedulingLease> {
    if (!this.initialized) {
      throw new Error('Scheduling provider not initialized');
    }

    const lease = this.leases.get(leaseId);
    if (!lease) {
      throw new Error('Lease not found');
    }

    const renewedLease: SchedulingLease = {
      ...lease,
      leaseExpiresAt: new Date(lease.leaseExpiresAt.getTime() + lease.leaseDurationMs),
      leaseCount: lease.leaseCount + 1,
    };

    this.leases.set(leaseId, renewedLease);

    return renewedLease;
  }

  async releaseSchedulingLease(leaseId: string): Promise<void> {
    if (!this.initialized) {
      throw new Error('Scheduling provider not initialized');
    }

    this.leases.delete(leaseId);
  }

  async makeSchedulingDecision(context: SchedulingContext): Promise<SchedulingDecision> {
    if (!this.initialized) {
      throw new Error('Scheduling provider not initialized');
    }

    // Simple decision logic: return the first pending schedule
    const schedules = Array.from(this.schedules.values());
    const pendingSchedule = schedules[0];

    return {
      scheduleId: pendingSchedule?.scheduleId ?? '',
      executionId: `exec-${Date.now()}`,
      decision: DecisionType.SCHEDULE,
      scheduledAt: new Date(),
      executionAt: new Date(),
    };
  }

  async getSchedulingTopology(): Promise<SchedulingTopology> {
    if (!this.initialized) {
      throw new Error('Scheduling provider not initialized');
    }

    return {
      topologyId: 'memory-topology',
      nodes: [],
      edges: [],
      metadata: {
        topologyType: TopologyType.CUSTOM,
        version: '1.0.0',
      },
    };
  }

  async healthCheck(): Promise<SchedulingHealthStatus> {
    return {
      healthy: this.initialized,
      totalSchedules: this.schedules.size,
      activeSchedules: this.schedules.size,
      errorCount: 0,
      activeLeases: 0,
      schedulingDecisionsPerMinute: 0,
    };
  }

  async shutdown(): Promise<void> {
    this.schedules.clear();
    this.leases.clear();
    this.initialized = false;
  }
}

export function createMemorySchedulingProvider(config: SchedulingAdapterConfig): MemorySchedulingProvider {
  return new MemorySchedulingProvider(config);
}
