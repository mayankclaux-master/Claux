/**
 * PRISM Thinking Logs
 * 
 * PRISM thinking logs:
 * - asset generation reasoning
 * - brand consistency reasoning
 * - media optimization rationale
 */

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export async function logPrismAssetGenerationReasoning(executionId: string, tenantId: string, reasoning: string, assetType: string, confidence: number) {
  const supabase = createSupabaseBrowserClient();
  
  await supabase.from("runtime_thinking_logs").insert({
    execution_id: executionId,
    tenant_id: tenantId,
    agent_name: "PRISM",
    phase: "asset_generation",
    step: "generation_reasoning",
    thought: `Generated ${assetType} asset`,
    reasoning: reasoning,
    reasoning_summary: `${assetType} generated with ${Math.round(confidence * 100)}% confidence`,
    confidence,
    metadata: {
      asset_type: assetType,
    },
  });
}

export async function logPrismBrandConsistencyReasoning(executionId: string, tenantId: string, reasoning: string, consistencyScore: number) {
  const supabase = createSupabaseBrowserClient();
  
  await supabase.from("runtime_thinking_logs").insert({
    execution_id: executionId,
    tenant_id: tenantId,
    agent_name: "PRISM",
    phase: "brand_consistency",
    step: "consistency_check",
    thought: `Validated brand consistency`,
    reasoning: reasoning,
    reasoning_summary: `Brand consistency score: ${Math.round(consistencyScore * 100)}%`,
    confidence: consistencyScore,
    metadata: {
      consistency_score: consistencyScore,
    },
  });
}

export async function logPrismMediaOptimizationRationale(executionId: string, tenantId: string, reasoning: string, optimizationType: string) {
  const supabase = createSupabaseBrowserClient();
  
  await supabase.from("runtime_thinking_logs").insert({
    execution_id: executionId,
    tenant_id: tenantId,
    agent_name: "PRISM",
    phase: "media_optimization",
    step: "optimization_rationale",
    thought: `Optimized media for ${optimizationType}`,
    reasoning: reasoning,
    reasoning_summary: `Media optimization applied: ${optimizationType}`,
    metadata: {
      optimization_type: optimizationType,
    },
  });
}
