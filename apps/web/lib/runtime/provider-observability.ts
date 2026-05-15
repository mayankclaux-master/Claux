/**
 * Provider Observability
 * 
 * Tracks telemetry for OpenAI and DataForSEO providers:
 * - latency
 * - retries
 * - failures
 * - rate limits
 * - token usage
 * - request volume
 * - cost estimation
 */

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export interface ProviderMetrics {
  provider: string;
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  avg_latency_ms: number;
  total_tokens: number;
  total_cost: number;
  rate_limit_hits: number;
  last_request_at: string;
}

export interface ProviderTelemetry {
  provider: string;
  timestamp: string;
  operation: string;
  latency_ms: number;
  success: boolean;
  tokens_used?: number;
  cost?: number;
  error_message?: string;
  rate_limited?: boolean;
  metadata?: Record<string, unknown>;
}

/**
 * Get provider metrics from agent_logs
 */
export async function getProviderMetrics(tenantId: string, provider?: string): Promise<ProviderMetrics[]> {
  try {
    const supabase = createSupabaseBrowserClient();

    // Get logs with provider context
    let query = supabase
      .from("agent_logs")
      .select("*")
      .eq("tenant_id", tenantId)
      .not("context", "is", null);

    if (provider) {
      query = query.filter('context->>provider', 'eq', provider);
    }

    const { data: logs, error } = await query
      .order("created_at", { ascending: false })
      .limit(1000);

    if (error || !logs) {
      return [];
    }

    // Group by provider and calculate metrics
    const providerMap = new Map<string, {
      total_requests: number;
      successful_requests: number;
      failed_requests: number;
      total_latency: number;
      total_tokens: number;
      total_cost: number;
      rate_limit_hits: number;
      last_request_at: string;
    }>();

    for (const log of logs) {
      const context = log.context as Record<string, unknown> | null;
      if (!context?.provider) continue;

      const providerName = context.provider as string;

      if (!providerMap.has(providerName)) {
        providerMap.set(providerName, {
          total_requests: 0,
          successful_requests: 0,
          failed_requests: 0,
          total_latency: 0,
          total_tokens: 0,
          total_cost: 0,
          rate_limit_hits: 0,
          last_request_at: log.created_at,
        });
      }

      const metrics = providerMap.get(providerName)!;
      metrics.total_requests++;

      const latency = context.latency_ms as number | undefined;
      const success = context.success !== false;
      const tokens = context.tokens_used as number | undefined;
      const cost = context.cost as number | undefined;
      const rateLimited = context.rate_limited as boolean | undefined;

      if (success) {
        metrics.successful_requests++;
      } else {
        metrics.failed_requests++;
      }

      if (latency) {
        metrics.total_latency += latency;
      }

      if (tokens) {
        metrics.total_tokens += tokens;
      }

      if (cost) {
        metrics.total_cost += cost;
      }

      if (rateLimited) {
        metrics.rate_limit_hits++;
      }

      if (log.created_at > metrics.last_request_at) {
        metrics.last_request_at = log.created_at;
      }
    }

    const metrics: ProviderMetrics[] = [];

    for (const [providerName, data] of providerMap.entries()) {
      metrics.push({
        provider: providerName,
        total_requests: data.total_requests,
        successful_requests: data.successful_requests,
        failed_requests: data.failed_requests,
        avg_latency_ms: data.total_requests > 0 ? Math.round(data.total_latency / data.total_requests) : 0,
        total_tokens: data.total_tokens,
        total_cost: Math.round(data.total_cost * 100) / 100,
        rate_limit_hits: data.rate_limit_hits,
        last_request_at: data.last_request_at,
      });
    }

    return metrics.sort((a, b) => new Date(b.last_request_at).getTime() - new Date(a.last_request_at).getTime());
  } catch (error) {
    console.error("Error fetching provider metrics:", error);
    return [];
  }
}

/**
 * Record provider telemetry
 */
export async function recordProviderTelemetry(telemetry: ProviderTelemetry, tenantId: string): Promise<void> {
  try {
    const supabase = createSupabaseBrowserClient();

    // Record as a log entry with provider context
    await supabase.from("agent_logs").insert({
      tenant_id: tenantId,
      execution_id: telemetry.metadata?.execution_id as string | undefined,
      task_id: telemetry.metadata?.task_id as string | undefined,
      log_level: telemetry.success ? 'info' : 'error',
      message: `Provider ${telemetry.provider}: ${telemetry.operation}`,
      context: {
        provider: telemetry.provider,
        operation: telemetry.operation,
        latency_ms: telemetry.latency_ms,
        success: telemetry.success,
        tokens_used: telemetry.tokens_used,
        cost: telemetry.cost,
        rate_limited: telemetry.rate_limited,
        ...telemetry.metadata,
      },
      created_at: telemetry.timestamp,
    });
  } catch (error) {
    console.error("Error recording provider telemetry:", error);
  }
}
