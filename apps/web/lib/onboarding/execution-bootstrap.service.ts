/**
 * Execution Bootstrap Service
 * 
 * Canonical execution bootstrap pipeline for CLAUX V1 onboarding.
 * Runs first execution wave: ARIA, PULSE, CORE, LINX, PRISM, LOCL, REPUTE.
 * Populates dashboard metrics, charts, activity feed, trends, command centre tasks.
 * New client must NEVER see empty dashboard.
 * 
 * CRITICAL: This is the ONLY execution bootstrap service in CLAUX.
 */

import type { UUID } from '../runtime/types/common.types';
import { createLogger, Logger } from '@/lib/utils/logger';
import { AgentExecutionRegistry } from '../execution/agent-execution-registry';
import { createClerkSupabaseClient } from '@/lib/supabase/admin';

/**
 * Execution bootstrap result
 */
export interface ExecutionBootstrapResult {
  success: boolean;
  agentsExecuted: Record<string, boolean>;
  errors: string[];
}

/**
 * Execution bootstrap service
 */
export class ExecutionBootstrapService {
  private logger: Logger;
  private agentExecutionRegistry: AgentExecutionRegistry;

  constructor() {
    this.logger = createLogger();
    this.agentExecutionRegistry = new AgentExecutionRegistry();
  }

  /**
   * Bootstrap executions for tenant
   */
  async bootstrapExecutions(
    tenantId: UUID,
    websiteUrl: string,
    token: string
  ): Promise<ExecutionBootstrapResult> {
    this.logger.info('Starting execution bootstrap', { tenantId, websiteUrl });

    const agentsExecuted: Record<string, boolean> = {};
    const errors: string[] = [];
    const traceId = crypto.randomUUID() as UUID;

    // Execute ARIA
    const ariaSuccess = await this.executeAgent(tenantId, 'ARIA', websiteUrl, traceId, token);
    agentsExecuted['ARIA'] = ariaSuccess;
    if (!ariaSuccess) errors.push('ARIA execution failed');

    // Execute PULSE
    const pulseSuccess = await this.executeAgent(tenantId, 'PULSE', websiteUrl, traceId, token);
    agentsExecuted['PULSE'] = pulseSuccess;
    if (!pulseSuccess) errors.push('PULSE execution failed');

    // Execute CORE
    const coreSuccess = await this.executeAgent(tenantId, 'CORE', websiteUrl, traceId, token);
    agentsExecuted['CORE'] = coreSuccess;
    if (!coreSuccess) errors.push('CORE execution failed');

    // Execute LINX
    const linxSuccess = await this.executeAgent(tenantId, 'LINX', websiteUrl, traceId, token);
    agentsExecuted['LINX'] = linxSuccess;
    if (!linxSuccess) errors.push('LINX execution failed');

    // Execute PRISM
    const prismSuccess = await this.executeAgent(tenantId, 'PRISM', websiteUrl, traceId, token);
    agentsExecuted['PRISM'] = prismSuccess;
    if (!prismSuccess) errors.push('PRISM execution failed');

    // Execute LOCL
    const loclSuccess = await this.executeAgent(tenantId, 'LOCL', websiteUrl, traceId, token);
    agentsExecuted['LOCL'] = loclSuccess;
    if (!loclSuccess) errors.push('LOCL execution failed');

    // Execute REPUTE
    const reputeSuccess = await this.executeAgent(tenantId, 'REPUTE', websiteUrl, traceId, token);
    agentsExecuted['REPUTE'] = reputeSuccess;
    if (!reputeSuccess) errors.push('REPUTE execution failed');

    const success = errors.length === 0;

    this.logger.info('Execution bootstrap complete', { tenantId, success, agentsExecuted, errors });

    return {
      success,
      agentsExecuted,
      errors,
    };
  }

  /**
   * Execute single agent
   */
  private async executeAgent(
    tenantId: UUID,
    agentName: string,
    websiteUrl: string,
    traceId: UUID,
    token: string
  ): Promise<boolean> {
    this.logger.info(`Executing ${agentName}`, { tenantId });

    try {
      const executionId = crypto.randomUUID() as UUID;

      const result = await this.agentExecutionRegistry.executeAgent({
        tenantId,
        agentName,
        executionId,
        traceId,
        token,
        payload: {
          operation: 'bootstrap',
          websiteUrl,
        },
      });

      return result.success;
    } catch (error) {
      this.logger.error(`Failed to execute ${agentName}`, { tenantId, error });
      return false;
    }
  }

  /**
   * Get execution bootstrap status
   */
  async getExecutionBootstrapStatus(tenantId: UUID, token: string): Promise<{
    completed: boolean;
    agents: Record<string, boolean>;
  }> {
    const supabase = createClerkSupabaseClient(token);

    const agents = ['ARIA', 'PULSE', 'CORE', 'LINX', 'PRISM', 'LOCL', 'REPUTE'];
    const agentsStatus: Record<string, boolean> = {};

    for (const agent of agents) {
      const { data } = await supabase
        .from('agent_executions')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('agent_name', agent)
        .maybeSingle();

      agentsStatus[agent] = !!data;
    }

    const completed = Object.values(agentsStatus).every((v) => v === true);

    return { completed, agents: agentsStatus };
  }
}

/**
 * Singleton instance
 */
export const executionBootstrapService = new ExecutionBootstrapService();
