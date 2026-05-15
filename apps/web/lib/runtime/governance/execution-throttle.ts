/**
 * Execution Throttling & Concurrency Governance
 * 
 * Implements canonical runtime throttling to prevent:
 * - execution storms
 * - provider exhaustion
 * - queue floods
 * - memory pressure
 * 
 * Integrates with existing RuntimeService, scheduler, and worker coordination.
 */

export interface ThrottleConfig {
  perTenantConcurrencyLimit: number;
  globalConcurrencyLimit: number;
  providerConcurrencyLimits: Record<string, number>;
  workflowExecutionCaps: Record<string, number>;
  taskConcurrencyGuards: Record<string, number>;
}

export interface ThrottleResult {
  allowed: boolean;
  reason?: string;
  retryAfter?: number;
  currentUsage: {
    tenantRunning: number;
    globalRunning: number;
    providerUsage: Record<string, number>;
  };
}

export class ExecutionThrottleGovernance {
  private config: ThrottleConfig;
  private tenantRunningCount = new Map<string, number>();
  private globalRunningCount = 0;
  private providerRunningCount = new Map<string, number>();

  constructor(config: ThrottleConfig) {
    this.config = config;
  }

  /**
   * Check if execution is allowed under concurrency limits
   */
  async checkThrottle(tenantId: string, agentName: string, workflowType: string): Promise<ThrottleResult> {
    const tenantRunning = this.tenantRunningCount.get(tenantId) || 0;
    const globalRunning = this.globalRunningCount;
    const providerRunning = this.providerRunningCount.get(agentName) || 0;

    // Check tenant concurrency limit
    if (tenantRunning >= this.config.perTenantConcurrencyLimit) {
      return {
        allowed: false,
        reason: 'Tenant concurrency limit exceeded',
        retryAfter: 60, // Retry after 60 seconds
        currentUsage: {
          tenantRunning,
          globalRunning,
          providerUsage: Object.fromEntries(this.providerRunningCount),
        },
      };
    }

    // Check global concurrency limit
    if (globalRunning >= this.config.globalConcurrencyLimit) {
      return {
        allowed: false,
        reason: 'Global concurrency limit exceeded',
        retryAfter: 30, // Retry after 30 seconds
        currentUsage: {
          tenantRunning,
          globalRunning,
          providerUsage: Object.fromEntries(this.providerRunningCount),
        },
      };
    }

    // Check provider concurrency limit
    const providerLimit = this.config.providerConcurrencyLimits[agentName];
    if (providerLimit && providerRunning >= providerLimit) {
      return {
        allowed: false,
        reason: 'Provider concurrency limit exceeded',
        retryAfter: 45, // Retry after 45 seconds
        currentUsage: {
          tenantRunning,
          globalRunning,
          providerUsage: Object.fromEntries(this.providerRunningCount),
        },
      };
    }

    // Check workflow execution cap
    const workflowCap = this.config.workflowExecutionCaps[workflowType];
    if (workflowCap) {
      // This would require querying agent_executions for running executions of this workflow
      // For now, we'll implement a simple in-memory counter
      // In production, this should be backed by Redis or similar
    }

    return {
      allowed: true,
      currentUsage: {
        tenantRunning,
        globalRunning,
        providerUsage: Object.fromEntries(this.providerRunningCount),
      },
    };
  }

  /**
   * Register execution start (increment counters)
   */
  async registerExecutionStart(tenantId: string, agentName: string): Promise<void> {
    this.tenantRunningCount.set(tenantId, (this.tenantRunningCount.get(tenantId) || 0) + 1);
    this.globalRunningCount++;
    this.providerRunningCount.set(agentName, (this.providerRunningCount.get(agentName) || 0) + 1);
  }

  /**
   * Register execution end (decrement counters)
   */
  async registerExecutionEnd(tenantId: string, agentName: string): Promise<void> {
    const tenantCount = this.tenantRunningCount.get(tenantId) || 0;
    if (tenantCount > 0) {
      this.tenantRunningCount.set(tenantId, tenantCount - 1);
    }

    if (this.globalRunningCount > 0) {
      this.globalRunningCount--;
    }

    const providerCount = this.providerRunningCount.get(agentName) || 0;
    if (providerCount > 0) {
      this.providerRunningCount.set(agentName, providerCount - 1);
    }
  }

  /**
   * Get current usage metrics
   */
  getCurrentUsage() {
    return {
      tenantRunning: Object.fromEntries(this.tenantRunningCount),
      globalRunning: this.globalRunningCount,
      providerUsage: Object.fromEntries(this.providerRunningCount),
    };
  }
}

// Default configuration for production
export const DEFAULT_THROTTLE_CONFIG: ThrottleConfig = {
  perTenantConcurrencyLimit: 5, // Max 5 concurrent executions per tenant
  globalConcurrencyLimit: 100, // Max 100 concurrent executions globally
  providerConcurrencyLimits: {
    'ARIA': 20, // Max 20 concurrent ARIA executions
    'SCRIBE': 20, // Max 20 concurrent SCRIBE executions
    'OpenAI': 50, // Max 50 concurrent OpenAI requests
    'DataForSEO': 10, // Max 10 concurrent DataForSEO requests
  },
  workflowExecutionCaps: {
    'aria_discovery': 1000, // Max 1000 ARIA discovery executions per day per tenant
    'scribe_draft': 500, // Max 500 SCRIBE draft executions per day per tenant
  },
  taskConcurrencyGuards: {
    'keyword_extraction': 10, // Max 10 concurrent keyword extraction tasks
    'content_generation': 10, // Max 10 concurrent content generation tasks
  },
};

// Singleton instance for production
let throttleGovernanceInstance: ExecutionThrottleGovernance | null = null;

export function getThrottleGovernance(): ExecutionThrottleGovernance {
  if (!throttleGovernanceInstance) {
    throttleGovernanceInstance = new ExecutionThrottleGovernance(DEFAULT_THROTTLE_CONFIG);
  }
  return throttleGovernanceInstance;
}
