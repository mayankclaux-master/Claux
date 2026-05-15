/**
 * PULSE Thinking Logs
 * 
 * PULSE thinking logs:
 * - clustering reasoning
 * - ranking movement interpretation
 * - volatility interpretation
 * - opportunity scoring reasoning
 */

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export interface PulseThinkingLog {
  execution_id: string;
  tenant_id: string;
  phase: string;
  step: string;
  thought: string;
  reasoning: string;
  confidence?: number;
  artifact_id?: string;
  metadata?: Record<string, unknown>;
}

export async function logPulseClusteringReasoning(executionId: string, tenantId: string, reasoning: string, clusterCount: number, confidence: number) {
  const supabase = createSupabaseBrowserClient();
  
  await supabase.from("runtime_thinking_logs").insert({
    execution_id: executionId,
    tenant_id: tenantId,
    agent_name: "PULSE",
    phase: "clustering",
    step: "cluster_analysis",
    thought: `Analyzed keyword clustering patterns`,
    reasoning: reasoning,
    reasoning_summary: `Clustered ${clusterCount} keyword groups with ${Math.round(confidence * 100)}% confidence`,
    confidence,
    metadata: {
      cluster_count: clusterCount,
      clustering_method: "semantic_similarity",
    },
  });
}

export async function logPulseRankingMovementInterpretation(executionId: string, tenantId: string, reasoning: string, movementType: string, impact: string) {
  const supabase = createSupabaseBrowserClient();
  
  await supabase.from("runtime_thinking_logs").insert({
    execution_id: executionId,
    tenant_id: tenantId,
    agent_name: "PULSE",
    phase: "ranking_analysis",
    step: "movement_interpretation",
    thought: `Interpreted ${movementType} ranking movement`,
    reasoning: reasoning,
    reasoning_summary: `Ranking ${movementType} detected with ${impact} impact`,
    metadata: {
      movement_type: movementType,
      impact_level: impact,
    },
  });
}

export async function logPulseVolatilityInterpretation(executionId: string, tenantId: string, reasoning: string, volatilityScore: number, volatilityLevel: string) {
  const supabase = createSupabaseBrowserClient();
  
  await supabase.from("runtime_thinking_logs").insert({
    execution_id: executionId,
    tenant_id: tenantId,
    agent_name: "PULSE",
    phase: "volatility_analysis",
    step: "volatility_interpretation",
    thought: `Analyzed ranking volatility patterns`,
    reasoning: reasoning,
    reasoning_summary: `Volatility score: ${volatilityScore} (${volatilityLevel})`,
    metadata: {
      volatility_score: volatilityScore,
      volatility_level: volatilityLevel,
    },
  });
}

export async function logPulseOpportunityScoring(executionId: string, tenantId: string, reasoning: string, opportunityScore: number, opportunityType: string) {
  const supabase = createSupabaseBrowserClient();
  
  await supabase.from("runtime_thinking_logs").insert({
    execution_id: executionId,
    tenant_id: tenantId,
    agent_name: "PULSE",
    phase: "opportunity_analysis",
    step: "opportunity_scoring",
    thought: `Scored ranking opportunity`,
    reasoning: reasoning,
    reasoning_summary: `Opportunity score: ${opportunityScore} (${opportunityType})`,
    confidence: opportunityScore / 100,
    metadata: {
      opportunity_score: opportunityScore,
      opportunity_type: opportunityType,
    },
  });
}
