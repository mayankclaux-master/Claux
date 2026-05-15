/**
 * LOCL Thinking Logs
 * 
 * LOCL thinking logs:
 * - local ranking reasoning
 * - citation analysis reasoning
 * - NAP consistency interpretation
 * - map pack analysis reasoning
 */

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export async function logLoclLocalRankingReasoning(executionId: string, tenantId: string, reasoning: string, rankingPosition: number, trend: string) {
  const supabase = createSupabaseBrowserClient();
  
  await supabase.from("runtime_thinking_logs").insert({
    execution_id: executionId,
    tenant_id: tenantId,
    agent_name: "LOCL",
    phase: "local_ranking_analysis",
    step: "ranking_reasoning",
    thought: `Analyzed local ranking position`,
    reasoning: reasoning,
    reasoning_summary: `Ranking position: ${rankingPosition}, Trend: ${trend}`,
    metadata: {
      ranking_position: rankingPosition,
      trend,
    },
  });
}

export async function logLoclCitationAnalysisReasoning(executionId: string, tenantId: string, reasoning: string, citationCount: number, qualityScore: number) {
  const supabase = createSupabaseBrowserClient();
  
  await supabase.from("runtime_thinking_logs").insert({
    execution_id: executionId,
    tenant_id: tenantId,
    agent_name: "LOCL",
    phase: "citation_analysis",
    step: "citation_reasoning",
    thought: `Analyzed local citations`,
    reasoning: reasoning,
    reasoning_summary: `Citations: ${citationCount}, Quality score: ${qualityScore}`,
    confidence: qualityScore / 100,
    metadata: {
      citation_count: citationCount,
      quality_score: qualityScore,
    },
  });
}

export async function logLoclNapConsistencyInterpretation(executionId: string, tenantId: string, reasoning: string, consistencyScore: number, issues: string[]) {
  const supabase = createSupabaseBrowserClient();
  
  await supabase.from("runtime_thinking_logs").insert({
    execution_id: executionId,
    tenant_id: tenantId,
    agent_name: "LOCL",
    phase: "nap_consistency",
    step: "consistency_interpretation",
    thought: `Validated NAP consistency`,
    reasoning: reasoning,
    reasoning_summary: `Consistency score: ${consistencyScore}, Issues: ${issues.length}`,
    confidence: consistencyScore / 100,
    metadata: {
      consistency_score: consistencyScore,
      issues,
    },
  });
}

export async function logLoclMapPackAnalysisReasoning(executionId: string, tenantId: string, reasoning: string, mapPackPosition: number, competitorCount: number) {
  const supabase = createSupabaseBrowserClient();
  
  await supabase.from("runtime_thinking_logs").insert({
    execution_id: executionId,
    tenant_id: tenantId,
    agent_name: "LOCL",
    phase: "map_pack_analysis",
    step: "map_pack_reasoning",
    thought: `Analyzed map pack`,
    reasoning: reasoning,
    reasoning_summary: `Map pack position: ${mapPackPosition}, Competitors: ${competitorCount}`,
    metadata: {
      map_pack_position: mapPackPosition,
      competitor_count: competitorCount,
    },
  });
}
