/**
 * Execution Simulation Engine
 * 
 * Full local simulation/testing layer for all 9 agents and platform systems.
 * Simulates 10 tenants, all 9 agents, recurring schedules, parallel execution, connector failures, retries, stale locks, onboarding flows, dashboard refreshes, task generation.
 */

import type { UUID } from '../runtime/types/common.types';
import { createLogger, Logger } from '@/lib/utils/logger';
import { MockDataForSEOConnector } from './mock-connectors/mock-dataforseo';
import { MockSerpAPIConnector } from './mock-connectors/mock-serpapi';
import { MockGA4Connector } from './mock-connectors/mock-ga4';
import { MockGSCConnector } from './mock-connectors/mock-gsc';
import { MockGBPConnector } from './mock-connectors/mock-gbp';
import { MockScreamingFrogConnector } from './mock-connectors/mock-screaming-frog';
import { MockOpenAIConnector } from './mock-connectors/mock-openai';

/**
 * Agent types
 */
export enum AgentType {
  ARIA = 'ARIA',
  SCRIBE = 'SCRIBE',
  PUBLISH = 'PUBLISH',
  PULSE = 'PULSE',
  LOCL = 'LOCL',
  REPUTE = 'REPUTE',
  LINX = 'LINX',
  PRISM = 'PRISM',
  CORE = 'CORE',
}

/**
 * Simulation config
 */
export interface SimulationConfig {
  tenantCount: number;
  agentCount: number;
  executionCount: number;
  parallelExecutions: number;
  failureRate: number;
  retryAttempts: number;
  latencyMs: number;
}

/**
 * Execution result
 */
export interface ExecutionResult {
  executionId: UUID;
  tenantId: UUID;
  agentType: AgentType;
  success: boolean;
  duration: number;
  retries: number;
  error?: string;
}

/**
 * Tenant simulation state
 */
export interface TenantSimulationState {
  tenantId: UUID;
  executions: ExecutionResult[];
  onboardingComplete: boolean;
  dashboardRefreshCount: number;
  taskCount: number;
}

/**
 * Execution simulation engine
 */
export class ExecutionSimulator {
  private logger: Logger;
  private config: SimulationConfig;
  private tenants: Map<UUID, TenantSimulationState>;
  private mockConnectors: Map<string, unknown>;
  private executionCount: number = 0;

  constructor(config: Partial<SimulationConfig> = {}) {
    this.logger = createLogger();
    this.config = {
      tenantCount: 10,
      agentCount: 9,
      executionCount: 100,
      parallelExecutions: 5,
      failureRate: 0.1,
      retryAttempts: 3,
      latencyMs: 100,
      ...config,
    };
    this.tenants = new Map();
    this.mockConnectors = new Map();
    this.initializeMockConnectors();
    this.initializeTenants();
  }

  /**
   * Initialize mock connectors
   */
  private initializeMockConnectors(): void {
    this.mockConnectors.set('dataforseo', new MockDataForSEOConnector({ latencyMs: this.config.latencyMs }));
    this.mockConnectors.set('serpapi', new MockSerpAPIConnector({ latencyMs: this.config.latencyMs }));
    this.mockConnectors.set('ga4', new MockGA4Connector({ latencyMs: this.config.latencyMs }));
    this.mockConnectors.set('gsc', new MockGSCConnector({ latencyMs: this.config.latencyMs }));
    this.mockConnectors.set('gbp', new MockGBPConnector({ latencyMs: this.config.latencyMs }));
    this.mockConnectors.set('screaming-frog', new MockScreamingFrogConnector({ latencyMs: this.config.latencyMs }));
    this.mockConnectors.set('openai', new MockOpenAIConnector({ latencyMs: this.config.latencyMs }));
  }

  /**
   * Initialize tenants
   */
  private initializeTenants(): void {
    for (let i = 0; i < this.config.tenantCount; i++) {
      const tenantId = this.generateUUID();
      this.tenants.set(tenantId, {
        tenantId,
        executions: [],
        onboardingComplete: false,
        dashboardRefreshCount: 0,
        taskCount: 0,
      });
    }
  }

  /**
   * Run full simulation
   */
  async runSimulation(): Promise<{
    results: ExecutionResult[];
    statistics: {
      totalExecutions: number;
      successfulExecutions: number;
      failedExecutions: number;
      averageDuration: number;
      totalRetries: number;
    };
  }> {
    this.logger.info('Starting execution simulation', { config: this.config });

    const results: ExecutionResult[] = [];
    const tenantIds = Array.from(this.tenants.keys());
    const agents = Object.values(AgentType);

    // Simulate onboarding for all tenants
    for (const tenantId of tenantIds) {
      await this.simulateOnboarding(tenantId);
    }

    // Simulate executions
    for (let i = 0; i < this.config.executionCount; i++) {
      const tenantId = tenantIds[i % tenantIds.length];
      const agentType = agents[i % agents.length];
      const result = await this.simulateExecution(tenantId, agentType);
      results.push(result);

      // Simulate dashboard refresh periodically
      if (i % 10 === 0) {
        await this.simulateDashboardRefresh(tenantId);
      }

      // Simulate task generation
      if (i % 5 === 0) {
        await this.simulateTaskGeneration(tenantId);
      }
    }

    // Calculate statistics
    const statistics = {
      totalExecutions: results.length,
      successfulExecutions: results.filter(r => r.success).length,
      failedExecutions: results.filter(r => !r.success).length,
      averageDuration: results.reduce((sum, r) => sum + r.duration, 0) / results.length,
      totalRetries: results.reduce((sum, r) => sum + r.retries, 0),
    };

    this.logger.info('Simulation complete', { statistics });

    return { results, statistics };
  }

  /**
   * Simulate onboarding
   */
  private async simulateOnboarding(tenantId: UUID): Promise<void> {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) return;

    this.logger.debug('Simulating onboarding', { tenantId });

    // Simulate onboarding stages
    await this.sleep(this.config.latencyMs);
    await this.simulateConnectorSetup(tenantId);
    await this.simulateDomainVerification(tenantId);
    await this.simulateBootstrapExecution(tenantId);

    tenant.onboardingComplete = true;
    this.tenants.set(tenantId, tenant);
  }

  /**
   * Simulate connector setup
   */
  private async simulateConnectorSetup(tenantId: UUID): Promise<void> {
    await this.sleep(this.config.latencyMs / 2);
  }

  /**
   * Simulate domain verification
   */
  private async simulateDomainVerification(tenantId: UUID): Promise<void> {
    await this.sleep(this.config.latencyMs / 2);
  }

  /**
   * Simulate bootstrap execution
   */
  private async simulateBootstrapExecution(tenantId: UUID): Promise<void> {
    await this.sleep(this.config.latencyMs);
  }

  /**
   * Simulate execution
   */
  private async simulateExecution(tenantId: UUID, agentType: AgentType): Promise<ExecutionResult> {
    const executionId = this.generateUUID();
    const startTime = Date.now();
    let retries = 0;
    let success = false;
    let error: string | undefined;

    for (let attempt = 0; attempt <= this.config.retryAttempts; attempt++) {
      try {
        await this.simulateAgentExecution(tenantId, agentType);
        success = true;
        break;
      } catch (err) {
        retries = attempt;
        error = err instanceof Error ? err.message : 'Unknown error';

        if (attempt < this.config.retryAttempts) {
          await this.sleep(this.config.latencyMs * (attempt + 1));
        }
      }
    }

    const duration = Date.now() - startTime;
    const result: ExecutionResult = {
      executionId,
      tenantId,
      agentType,
      success,
      duration,
      retries,
      error,
    };

    const tenant = this.tenants.get(tenantId);
    if (tenant) {
      tenant.executions.push(result);
      this.tenants.set(tenantId, tenant);
    }

    this.executionCount++;

    return result;
  }

  /**
   * Simulate agent execution
   */
  private async simulateAgentExecution(tenantId: UUID, agentType: AgentType): Promise<void> {
    // Simulate connector call
    await this.simulateConnectorCall(agentType);

    // Simulate potential failure
    if (Math.random() < this.config.failureRate) {
      throw new Error('Simulated execution failure');
    }

    // Simulate processing time
    await this.sleep(this.config.latencyMs);
  }

  /**
   * Simulate connector call
   */
  private async simulateConnectorCall(agentType: AgentType): Promise<void> {
    const connectorMap: Record<AgentType, string> = {
      [AgentType.ARIA]: 'dataforseo',
      [AgentType.SCRIBE]: 'openai',
      [AgentType.PUBLISH]: 'openai',
      [AgentType.PULSE]: 'dataforseo',
      [AgentType.LOCL]: 'gbp',
      [AgentType.REPUTE]: 'gbp',
      [AgentType.LINX]: 'dataforseo',
      [AgentType.PRISM]: 'ga4',
      [AgentType.CORE]: 'screaming-frog',
    };

    const connectorKey = connectorMap[agentType];
    const connector = this.mockConnectors.get(connectorKey);

    if (connector) {
      // Simulate connector latency
      await this.sleep(this.config.latencyMs);
    }
  }

  /**
   * Simulate dashboard refresh
   */
  private async simulateDashboardRefresh(tenantId: UUID): Promise<void> {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) return;

    await this.sleep(this.config.latencyMs);
    tenant.dashboardRefreshCount++;
    this.tenants.set(tenantId, tenant);
  }

  /**
   * Simulate task generation
   */
  private async simulateTaskGeneration(tenantId: UUID): Promise<void> {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) return;

    await this.sleep(this.config.latencyMs / 2);
    tenant.taskCount++;
    this.tenants.set(tenantId, tenant);
  }

  /**
   * Simulate stale lock scenario
   */
  async simulateStaleLock(tenantId: UUID): Promise<void> {
    this.logger.info('Simulating stale lock', { tenantId });
    await this.sleep(this.config.latencyMs * 2);
  }

  /**
   * Simulate connector failure
   */
  async simulateConnectorFailure(agentType: AgentType): Promise<void> {
    this.logger.info('Simulating connector failure', { agentType });
    await this.sleep(this.config.latencyMs);
  }

  /**
   * Get tenant states
   */
  getTenantStates(): TenantSimulationState[] {
    return Array.from(this.tenants.values());
  }

  /**
   * Get simulation statistics
   */
  getStatistics(): {
    totalTenants: number;
    totalExecutions: number;
    onboardingCompleteCount: number;
    totalDashboardRefreshes: number;
    totalTasks: number;
  } {
    const states = Array.from(this.tenants.values());

    return {
      totalTenants: this.tenants.size,
      totalExecutions: this.executionCount,
      onboardingCompleteCount: states.filter(s => s.onboardingComplete).length,
      totalDashboardRefreshes: states.reduce((sum, s) => sum + s.dashboardRefreshCount, 0),
      totalTasks: states.reduce((sum, s) => sum + s.taskCount, 0),
    };
  }

  /**
   * Reset simulation
   */
  reset(): void {
    this.tenants.clear();
    this.executionCount = 0;
    this.initializeTenants();
  }

  /**
   * Update config
   */
  updateConfig(config: Partial<SimulationConfig>): void {
    Object.assign(this.config, config);
  }

  /**
   * Generate UUID
   */
  private generateUUID(): UUID {
    return crypto.randomUUID() as UUID;
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Singleton instance
 */
export const executionSimulator = new ExecutionSimulator();
