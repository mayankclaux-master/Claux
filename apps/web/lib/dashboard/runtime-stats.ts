/**
 * Runtime Dashboard Stats
 * 
 * Real runtime statistics using canonical runtime tables:
 * - agent_executions
 * - agent_tasks
 * - agent_events
 * - agent_logs
 */

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export interface RuntimeStats {
  aria: {
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    totalKeywords: number;
    avgDurationMs: number;
    totalCost: number;
    totalTokens: number;
  };
  scribe: {
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    draftCount: number;
    publishedCount: number;
    avgDurationMs: number;
    totalCost: number;
    totalTokens: number;
  };
  pulse: {
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    totalRankings: number;
    avgDurationMs: number;
    totalCost: number;
  };
  linx: {
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    totalBacklinks: number;
    toxicBacklinks: number;
    avgDurationMs: number;
    totalCost: number;
  };
  overall: {
    totalExecutions: number;
    runningExecutions: number;
    totalTasks: number;
    completedTasks: number;
    failedTasks: number;
  };
}

export interface RuntimeAgentStatus {
  agent: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  lastExecutionId: string | null;
  lastExecutionAt: string | null;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
}

export interface RuntimeActivityFeedItem {
  execution_id: string;
  agent: string;
  task: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  message: string;
  timestamp: string;
}

/**
 * Get ARIA runtime stats from agent_executions and agent_tasks
 */
export async function getARIARuntimeStats(tenantId: string): Promise<RuntimeStats['aria']> {
  try {
    const supabase = createSupabaseBrowserClient();

    // Get ARIA executions
    const { data: executions, error: execError } = await supabase
      .from("agent_executions")
      .select("id, status, started_at, completed_at, total_cost, total_tokens")
      .eq("tenant_id", tenantId)
      .eq("agent_name", "ARIA")
      .order("created_at", { ascending: false })
      .limit(100);

    if (execError || !executions) {
      return {
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        totalKeywords: 0,
        avgDurationMs: 0,
        totalCost: 0,
        totalTokens: 0,
      };
    }

    const successfulExecutions = executions.filter(e => e.status === 'completed').length;
    const failedExecutions = executions.filter(e => e.status === 'failed').length;
    
    // Calculate average duration
    const completedExecutions = executions.filter(e => e.status === 'completed' && e.started_at && e.completed_at);
    const avgDurationMs = completedExecutions.length > 0
      ? completedExecutions.reduce((sum, e) => {
          const duration = new Date(e.completed_at!).getTime() - new Date(e.started_at!).getTime();
          return sum + duration;
        }, 0) / completedExecutions.length
      : 0;

    const totalCost = executions.reduce((sum, e) => sum + (e.total_cost || 0), 0);
    const totalTokens = executions.reduce((sum, e) => sum + (e.total_tokens || 0), 0);

    // Get total keywords from seo_keywords table (ARIA's output)
    const { count: totalKeywords } = await supabase
      .from("seo_keywords")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId);

    return {
      totalExecutions: executions.length,
      successfulExecutions,
      failedExecutions,
      totalKeywords: totalKeywords || 0,
      avgDurationMs: Math.round(avgDurationMs),
      totalCost: Math.round(totalCost * 100) / 100,
      totalTokens,
    };
  } catch (error) {
    console.error("Error fetching ARIA runtime stats:", error);
    return {
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      totalKeywords: 0,
      avgDurationMs: 0,
      totalCost: 0,
      totalTokens: 0,
    };
  }
}

/**
 * Get SCRIBE runtime stats from agent_executions and agent_tasks
 */
export async function getSCRIBERuntimeStats(tenantId: string): Promise<RuntimeStats['scribe']> {
  try {
    const supabase = createSupabaseBrowserClient();

    // Get SCRIBE executions
    const { data: executions, error: execError } = await supabase
      .from("agent_executions")
      .select("id, status, started_at, completed_at, total_cost, total_tokens")
      .eq("tenant_id", tenantId)
      .eq("agent_name", "SCRIBE")
      .order("created_at", { ascending: false })
      .limit(100);

    if (execError || !executions) {
      return {
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        draftCount: 0,
        publishedCount: 0,
        avgDurationMs: 0,
        totalCost: 0,
        totalTokens: 0,
      };
    }

    const successfulExecutions = executions.filter(e => e.status === 'completed').length;
    const failedExecutions = executions.filter(e => e.status === 'failed').length;
    
    // Calculate average duration
    const completedExecutions = executions.filter(e => e.status === 'completed' && e.started_at && e.completed_at);
    const avgDurationMs = completedExecutions.length > 0
      ? completedExecutions.reduce((sum, e) => {
          const duration = new Date(e.completed_at!).getTime() - new Date(e.started_at!).getTime();
          return sum + duration;
        }, 0) / completedExecutions.length
      : 0;

    const totalCost = executions.reduce((sum, e) => sum + (e.total_cost || 0), 0);
    const totalTokens = executions.reduce((sum, e) => sum + (e.total_tokens || 0), 0);

    // Get draft and published counts from seo_drafts table (SCRIBE's output)
    const { count: draftCount } = await supabase
      .from("seo_drafts")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("status", "draft");

    const { count: publishedCount } = await supabase
      .from("seo_drafts")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("status", "published");

    return {
      totalExecutions: executions.length,
      successfulExecutions,
      failedExecutions,
      draftCount: draftCount || 0,
      publishedCount: publishedCount || 0,
      avgDurationMs: Math.round(avgDurationMs),
      totalCost: Math.round(totalCost * 100) / 100,
      totalTokens,
    };
  } catch (error) {
    console.error("Error fetching SCRIBE runtime stats:", error);
    return {
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      draftCount: 0,
      publishedCount: 0,
      avgDurationMs: 0,
      totalCost: 0,
      totalTokens: 0,
    };
  }
}

/**
 * Get overall runtime stats
 */
export async function getOverallRuntimeStats(tenantId: string): Promise<RuntimeStats['overall']> {
  try {
    const supabase = createSupabaseBrowserClient();

    // Get total executions
    const { count: totalExecutions } = await supabase
      .from("agent_executions")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId);

    // Get running executions
    const { count: runningExecutions } = await supabase
      .from("agent_executions")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("status", "running");

    // Get total tasks
    const { count: totalTasks } = await supabase
      .from("agent_tasks")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId);

    // Get completed tasks
    const { count: completedTasks } = await supabase
      .from("agent_tasks")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("status", "completed");

    // Get failed tasks
    const { count: failedTasks } = await supabase
      .from("agent_tasks")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("status", "failed");

    return {
      totalExecutions: totalExecutions || 0,
      runningExecutions: runningExecutions || 0,
      totalTasks: totalTasks || 0,
      completedTasks: completedTasks || 0,
      failedTasks: failedTasks || 0,
    };
  } catch (error) {
    console.error("Error fetching overall runtime stats:", error);
    return {
      totalExecutions: 0,
      runningExecutions: 0,
      totalTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
    };
  }
}

/**
 * Get runtime stats for all agents
 */
export async function getRuntimeStats(tenantId: string): Promise<RuntimeStats> {
  const [ariaStats, scribeStats, overallStats] = await Promise.all([
    getARIARuntimeStats(tenantId),
    getSCRIBERuntimeStats(tenantId),
    getOverallRuntimeStats(tenantId),
  ]);

  // Get PULSE and LINX stats from extended module
  const [pulseStats, linxStats] = await Promise.all([
    (async () => {
      try {
        const { getPulseRuntimeStats } = await import("./runtime-stats-extended");
        return await getPulseRuntimeStats(tenantId);
      } catch {
        return {
          totalExecutions: 0,
          successfulExecutions: 0,
          failedExecutions: 0,
          totalRankings: 0,
          avgDurationMs: 0,
          totalCost: 0,
        };
      }
    })(),
    (async () => {
      try {
        const { getLinxRuntimeStats } = await import("./runtime-stats-extended");
        return await getLinxRuntimeStats(tenantId);
      } catch {
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
    })(),
  ]);

  return {
    aria: ariaStats,
    scribe: scribeStats,
    pulse: pulseStats,
    linx: linxStats,
    overall: overallStats,
  };
}

/**
 * Get runtime agent status from agent_executions
 */
export async function getRuntimeAgentStatus(tenantId: string): Promise<RuntimeAgentStatus[]> {
  try {
    const supabase = createSupabaseBrowserClient();

    // Get latest execution for each agent
    const { data: latestExecutions, error: execError } = await supabase
      .from("agent_executions")
      .select("agent_name, id, status, created_at")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });

    if (execError || !latestExecutions) {
      return [];
    }

    // Group by agent and get latest status
    const agentMap = new Map<string, RuntimeAgentStatus>();
    
    for (const exec of latestExecutions) {
      if (!agentMap.has(exec.agent_name)) {
        agentMap.set(exec.agent_name, {
          agent: exec.agent_name,
          status: exec.status as RuntimeAgentStatus['status'],
          lastExecutionId: exec.id,
          lastExecutionAt: exec.created_at,
          totalExecutions: 0,
          successfulExecutions: 0,
          failedExecutions: 0,
        });
      }
    }

    // Get counts for each agent
    const agentNames = Array.from(agentMap.keys());
    
    for (const agentName of agentNames) {
      const { count: totalExecutions } = await supabase
        .from("agent_executions")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .eq("agent_name", agentName);

      const { count: successfulExecutions } = await supabase
        .from("agent_executions")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .eq("agent_name", agentName)
        .eq("status", "completed");

      const { count: failedExecutions } = await supabase
        .from("agent_executions")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .eq("agent_name", agentName)
        .eq("status", "failed");

      const status = agentMap.get(agentName);
      if (status) {
        status.totalExecutions = totalExecutions || 0;
        status.successfulExecutions = successfulExecutions || 0;
        status.failedExecutions = failedExecutions || 0;
      }
    }

    return Array.from(agentMap.values());
  } catch (error) {
    console.error("Error fetching runtime agent status:", error);
    return [];
  }
}

/**
 * Get runtime activity feed from agent_events and agent_logs
 */
export async function getRuntimeActivityFeed(tenantId: string): Promise<RuntimeActivityFeedItem[]> {
  try {
    const supabase = createSupabaseBrowserClient();

    // Get recent events
    const { data: events, error: eventError } = await supabase
      .from("agent_events")
      .select("execution_id, event_name, event_source, payload, created_at")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (eventError || !events) {
      return [];
    }

    // Get execution details for each event
    const executionIds = [...new Set(events.map(e => e.execution_id))];
    const { data: executions } = await supabase
      .from("agent_executions")
      .select("id, agent_name")
      .in("id", executionIds);

    const executionMap = new Map(executions?.map(e => [e.id, e.agent_name]) || []);

    // Map events to activity feed items
    const activityFeed: RuntimeActivityFeedItem[] = events.map(event => {
      const agent = executionMap.get(event.execution_id) || 'Unknown';
      const payload = event.payload as any;
      
      return {
        execution_id: event.execution_id,
        agent,
        task: event.event_name,
        status: 'completed' as RuntimeActivityFeedItem['status'], // Events are completed actions
        message: payload?.message || event.event_name,
        timestamp: event.created_at,
      };
    });

    return activityFeed;
  } catch (error) {
    console.error("Error fetching runtime activity feed:", error);
    return [];
  }
}
