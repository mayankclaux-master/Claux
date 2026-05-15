/**
 * Execution Observability
 * 
 * Persist: outbound request, webhook receipt, retries, provider failures, cooldowns, response latency, execution continuation
 * 
 * Binds to: agent_events, agent_logs
 */

import { RuntimeService } from '@/lib/runtime/services/runtime.service';
import { IntegrationRequest } from '../contracts';
import { LogLevel } from '@/lib/runtime/types/log.types';

export class IntegrationObservability {
  private runtime: RuntimeService;

  constructor(runtime: RuntimeService) {
    this.runtime = runtime;
  }

  async recordOutboundRequest(request: IntegrationRequest): Promise<void> {
    await this.runtime.event.publishEvent({
      tenant_id: request.tenantId,
      execution_id: request.executionId,
      event_name: 'outbound_request',
      event_source: 'integration_mesh',
      payload: { provider: request.provider, action: request.action },
    });
  }

  async recordWebhookReceipt(executionId: string, tenantId: string, provider: string): Promise<void> {
    await this.runtime.event.publishEvent({
      tenant_id: tenantId,
      execution_id: executionId,
      event_name: 'webhook_receipt',
      event_source: 'integration_mesh',
      payload: { provider },
    });
  }

  async recordRetry(request: IntegrationRequest, retryCount: number): Promise<void> {
    await this.runtime.event.publishEvent({
      tenant_id: request.tenantId,
      execution_id: request.executionId,
      event_name: 'integration_retry',
      event_source: 'integration_mesh',
      payload: { retryCount },
    });
  }

  async recordProviderFailure(provider: string, error: string, tenantId: string): Promise<void> {
    await this.runtime.event.publishEvent({
      tenant_id: tenantId,
      execution_id: 'system' as any,
      event_name: 'provider_failure',
      event_source: 'integration_mesh',
      payload: { provider, error },
    });
  }

  async recordCooldown(provider: string, cooldownUntil: string, tenantId: string): Promise<void> {
    await this.runtime.event.publishEvent({
      tenant_id: tenantId,
      execution_id: 'system' as any,
      event_name: 'provider_cooldown',
      event_source: 'integration_mesh',
      payload: { provider, cooldownUntil },
    });
  }

  async recordLatency(request: IntegrationRequest, latencyMs: number): Promise<void> {
    await this.runtime.log.writeLog({
      execution_id: request.executionId,
      log_level: LogLevel.INFO,
      message: 'Integration latency',
      context: { provider: request.provider, action: request.action, latencyMs },
    });
  }

  async recordExecutionContinuation(executionId: string, tenantId: string, provider: string): Promise<void> {
    await this.runtime.event.publishEvent({
      tenant_id: tenantId,
      execution_id: executionId,
      event_name: 'execution_continuation',
      event_source: 'integration_mesh',
      payload: { provider },
    });
  }
}

export function createIntegrationObservability(runtime: RuntimeService): IntegrationObservability {
  return new IntegrationObservability(runtime);
}
