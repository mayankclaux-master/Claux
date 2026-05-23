/**
 * Thinking Log Integration
 * 
 * Integrates thinking logs into execution detail pages, task drilldowns, report provenance
 * Supports phase grouping, artifact references, model/provider metadata
 */

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export interface ThinkingLog {
  id: string;
  execution_id: string;
  tenant_id: string;
  agent_name: string;
  task_id?: string;
  phase?: string;
  step: string;
  thought: string;
  reasoning: string;
  reasoning_summary?: string;
  confidence?: number;
  artifact_id?: string;
  artifact_type?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

export interface ThinkingLogGroup {
  phase?: string;
  logs: ThinkingLog[];
  start_time: string;
  end_time: string;
}

/**
 * Get thinking logs for execution
 */
export async function getExecutionThinkingLogs(executionId: string): Promise<ThinkingLog[]> {
  try {
    const supabase = createSupabaseBrowserClient();
    
    // Updated to use canonical agent_logs table (Phase 2A.3)
    const { data, error } = await supabase
      .from("agent_logs")
      .select("*")
      .eq("execution_id", executionId)
      .order("created_at", { ascending: true });

    if (error || !data) {
      return [];
    }

    return data as ThinkingLog[];
  } catch (error) {
    console.error("Error fetching execution thinking logs:", error);
    return [];
  }
}

/**
 * Get thinking logs for task
 */
export async function getTaskThinkingLogs(taskId: string): Promise<ThinkingLog[]> {
  try {
    const supabase = createSupabaseBrowserClient();
    
    // Updated to use canonical agent_logs table (Phase 2A.3)
    const { data, error } = await supabase
      .from("agent_logs")
      .select("*")
      .eq("task_id", taskId)
      .order("created_at", { ascending: true });

    if (error || !data) {
      return [];
    }

    return data as ThinkingLog[];
  } catch (error) {
    console.error("Error fetching task thinking logs:", error);
    return [];
  }
}

/**
 * Group thinking logs by phase
 */
export function groupThinkingLogsByPhase(logs: ThinkingLog[]): ThinkingLogGroup[] {
  const phaseMap = new Map<string, ThinkingLog[]>();

  for (const log of logs) {
    const phase = log.phase || 'ungrouped';
    if (!phaseMap.has(phase)) {
      phaseMap.set(phase, []);
    }
    phaseMap.get(phase)!.push(log);
  }

  const groups: ThinkingLogGroup[] = [];

  for (const [phase, phaseLogs] of phaseMap.entries()) {
    groups.push({
      phase: phase === 'ungrouped' ? undefined : phase,
      logs: phaseLogs,
      start_time: phaseLogs[0].timestamp,
      end_time: phaseLogs[phaseLogs.length - 1].timestamp,
    });
  }

  return groups.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
}

/**
 * Get thinking logs with artifact references
 */
export function getThinkingLogsWithArtifacts(logs: ThinkingLog[]): Map<string, ThinkingLog[]> {
  const artifactMap = new Map<string, ThinkingLog[]>();

  for (const log of logs) {
    if (log.artifact_id) {
      if (!artifactMap.has(log.artifact_id)) {
        artifactMap.set(log.artifact_id, []);
      }
      artifactMap.get(log.artifact_id)!.push(log);
    }
  }

  return artifactMap;
}

/**
 * Get thinking logs for report provenance
 */
export async function getReportThinkingLogs(reportId: string): Promise<ThinkingLog[]> {
  try {
    const supabase = createSupabaseBrowserClient();
    
    // Get report execution from seo_reports
    const { data: report, error: reportError } = await supabase
      .from("seo_reports")
      .select("execution_id")
      .eq("id", reportId)
      .maybeSingle();

    if (reportError || !report?.execution_id) {
      return [];
    }

    // Get thinking logs for that execution
    return await getExecutionThinkingLogs(report.execution_id);
  } catch (error) {
    console.error("Error fetching report thinking logs:", error);
    return [];
  }
}
