/**
 * REPUTE Thinking Logs
 * 
 * REPUTE thinking logs:
 * - sentiment reasoning
 * - escalation rationale
 * - reputation risk interpretation
 * - response drafting rationale
 */

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export async function logReputeSentimentReasoning(executionId: string, tenantId: string, reasoning: string, sentiment: string, confidence: number) {
  const supabase = createSupabaseBrowserClient();
  
  await supabase.from("runtime_thinking_logs").insert({
    execution_id: executionId,
    tenant_id: tenantId,
    agent_name: "REPUTE",
    phase: "sentiment_analysis",
    step: "sentiment_reasoning",
    thought: `Analyzed review sentiment`,
    reasoning: reasoning,
    reasoning_summary: `Sentiment: ${sentiment} with ${Math.round(confidence * 100)}% confidence`,
    confidence,
    metadata: {
      sentiment,
    },
  });
}

export async function logReputeEscalationRationale(executionId: string, tenantId: string, reasoning: string, escalationLevel: string, riskScore: number) {
  const supabase = createSupabaseBrowserClient();
  
  await supabase.from("runtime_thinking_logs").insert({
    execution_id: executionId,
    tenant_id: tenantId,
    agent_name: "REPUTE",
    phase: "escalation_analysis",
    step: "escalation_rationale",
    thought: `Evaluated escalation requirements`,
    reasoning: reasoning,
    reasoning_summary: `Escalation level: ${escalationLevel}, Risk score: ${riskScore}`,
    confidence: riskScore / 100,
    metadata: {
      escalation_level: escalationLevel,
      risk_score: riskScore,
    },
  });
}

export async function logReputeReputationRiskInterpretation(executionId: string, tenantId: string, reasoning: string, riskType: string, impact: string) {
  const supabase = createSupabaseBrowserClient();
  
  await supabase.from("runtime_thinking_logs").insert({
    execution_id: executionId,
    tenant_id: tenantId,
    agent_name: "REPUTE",
    phase: "risk_analysis",
    step: "risk_interpretation",
    thought: `Interpreted reputation risk`,
    reasoning: reasoning,
    reasoning_summary: `Risk type: ${riskType}, Impact: ${impact}`,
    metadata: {
      risk_type: riskType,
      impact,
    },
  });
}

export async function logReputeResponseDraftingRationale(executionId: string, tenantId: string, reasoning: string, responseTone: string) {
  const supabase = createSupabaseBrowserClient();
  
  await supabase.from("runtime_thinking_logs").insert({
    execution_id: executionId,
    tenant_id: tenantId,
    agent_name: "REPUTE",
    phase: "response_drafting",
    step: "drafting_rationale",
    thought: `Drafted review response`,
    reasoning: reasoning,
    reasoning_summary: `Response tone: ${responseTone}`,
    metadata: {
      response_tone: responseTone,
    },
  });
}
