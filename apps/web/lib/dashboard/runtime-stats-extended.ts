/**
 * Extended Runtime Stats for PULSE and LINX
 * 
 * Extends runtime stats to include PULSE and LINX metrics
 */

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export interface PulseRuntimeStats {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  totalRankings: number;
  avgDurationMs: number;
  totalCost: number;
}

export interface LinxRuntimeStats {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  totalBacklinks: number;
  toxicBacklinks: number;
  avgDurationMs: number;
  totalCost: number;
}

export async function getPulseRuntimeStats(tenantId: string): Promise<PulseRuntimeStats> {
  try {
    const supabase = createSupabaseBrowserClient();

    const { data: executions } = await supabase
      .from("agent_executions")
      .select("id, status, started_at, completed_at, total_cost")
      .eq("tenant_id", tenantId)
      .eq("agent_name", "PULSE")
      .order("created_at", { ascending: false })
      .limit(100);

    if (!executions) {
      return {
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        totalRankings: 0,
        avgDurationMs: 0,
        totalCost: 0,
      };
    }

    const successfulExecutions = executions.filter(e => e.status === 'completed').length;
    const failedExecutions = executions.filter(e => e.status === 'failed').length;

    const completedExecutions = executions.filter(e => e.status === 'completed' && e.started_at && e.completed_at);
    const avgDurationMs = completedExecutions.length > 0
      ? completedExecutions.reduce((sum, e) => sum + (new Date(e.completed_at!).getTime() - new Date(e.started_at!).getTime()), 0) / completedExecutions.length
      : 0;

    const totalCost = executions.reduce((sum, e) => sum + (e.total_cost || 0), 0);

    const { count: totalRankings } = await supabase
      .from("pulse_rankings")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId);

    return {
      totalExecutions: executions.length,
      successfulExecutions,
      failedExecutions,
      totalRankings: totalRankings || 0,
      avgDurationMs: Math.round(avgDurationMs),
      totalCost: Math.round(totalCost * 100) / 100,
    };
  } catch (error) {
    console.error("Error fetching PULSE stats:", error);
    return {
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      totalRankings: 0,
      avgDurationMs: 0,
      totalCost: 0,
    };
  }
}

export async function getLinxRuntimeStats(tenantId: string): Promise<LinxRuntimeStats> {
  try {
    const supabase = createSupabaseBrowserClient();

    const { data: executions } = await supabase
      .from("agent_executions")
      .select("id, status, started_at, completed_at, total_cost")
      .eq("tenant_id", tenantId)
      .eq("agent_name", "LINX")
      .order("created_at", { ascending: false })
      .limit(100);

    if (!executions) {
      return {
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        totalBacklinks: 0,
        toxicBacklinks: 0,
        avgDurationMs: 0,
        totalCost: 0,
      };
    }

    const successfulExecutions = executions.filter(e => e.status === 'completed').length;
    const failedExecutions = executions.filter(e => e.status === 'failed').length;

    const completedExecutions = executions.filter(e => e.status === 'completed' && e.started_at && e.completed_at);
    const avgDurationMs = completedExecutions.length > 0
      ? completedExecutions.reduce((sum, e) => sum + (new Date(e.completed_at!).getTime() - new Date(e.started_at!).getTime()), 0) / completedExecutions.length
      : 0;

    const totalCost = executions.reduce((sum, e) => sum + (e.total_cost || 0), 0);

    const { count: totalBacklinks } = await supabase
      .from("linx_backlinks")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId);

    const { count: toxicBacklinks } = await supabase
      .from("linx_backlinks")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("is_toxic", true);

    return {
      totalExecutions: executions.length,
      successfulExecutions,
      failedExecutions,
      totalBacklinks: totalBacklinks || 0,
      toxicBacklinks: toxicBacklinks || 0,
      avgDurationMs: Math.round(avgDurationMs),
      totalCost: Math.round(totalCost * 100) / 100,
    };
  } catch (error) {
    console.error("Error fetching LINX stats:", error);
    return {
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      totalBacklinks: 0,
      toxicBacklinks: 0,
      avgDurationMs: 0,
      totalCost: 0,
    };
  }
}
