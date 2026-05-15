/**
 * LINX Thinking Logs
 * 
 * LINX thinking logs:
 * - backlink scoring rationale
 * - toxic link reasoning
 * - authority interpretation
 * - internal linking rationale
 */

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export async function logLinxBacklinkScoring(executionId: string, tenantId: string, reasoning: string, qualityScore: number, qualityLevel: string) {
  const supabase = createSupabaseBrowserClient();
  
  await supabase.from("runtime_thinking_logs").insert({
    execution_id: executionId,
    tenant_id: tenantId,
    agent_name: "LINX",
    phase: "backlink_analysis",
    step: "quality_scoring",
    thought: `Scored backlink quality`,
    reasoning: reasoning,
    reasoning_summary: `Quality score: ${qualityScore} (${qualityLevel})`,
    confidence: qualityScore / 100,
    metadata: {
      quality_score: qualityScore,
      quality_level: qualityLevel,
    },
  });
}

export async function logLinxToxicLinkReasoning(executionId: string, tenantId: string, reasoning: string, toxicityScore: number, toxicityType: string) {
  const supabase = createSupabaseBrowserClient();
  
  await supabase.from("runtime_thinking_logs").insert({
    execution_id: executionId,
    tenant_id: tenantId,
    agent_name: "LINX",
    phase: "toxicity_analysis",
    step: "toxicity_detection",
    thought: `Detected toxic backlink characteristics`,
    reasoning: reasoning,
    reasoning_summary: `Toxicity score: ${toxicityScore} (${toxicityType})`,
    confidence: toxicityScore / 100,
    metadata: {
      toxicity_score: toxicityScore,
      toxicity_type: toxicityType,
    },
  });
}

export async function logLinxAuthorityInterpretation(executionId: string, tenantId: string, reasoning: string, authorityScore: number, authorityLevel: string) {
  const supabase = createSupabaseBrowserClient();
  
  await supabase.from("runtime_thinking_logs").insert({
    execution_id: executionId,
    tenant_id: tenantId,
    agent_name: "LINX",
    phase: "authority_analysis",
    step: "authority_interpretation",
    thought: `Interpreted domain authority flow`,
    reasoning: reasoning,
    reasoning_summary: `Authority score: ${authorityScore} (${authorityLevel})`,
    confidence: authorityScore / 100,
    metadata: {
      authority_score: authorityScore,
      authority_level: authorityLevel,
    },
  });
}

export async function logLinxInternalLinkingRationale(executionId: string, tenantId: string, reasoning: string, linkOpportunity: string, impact: string) {
  const supabase = createSupabaseBrowserClient();
  
  await supabase.from("runtime_thinking_logs").insert({
    execution_id: executionId,
    tenant_id: tenantId,
    agent_name: "LINX",
    phase: "internal_link_analysis",
    step: "link_recommendation",
    thought: `Generated internal linking recommendation`,
    reasoning: reasoning,
    reasoning_summary: `Link opportunity: ${linkOpportunity} with ${impact} impact`,
    metadata: {
      link_opportunity: linkOpportunity,
      impact_level: impact,
    },
  });
}
