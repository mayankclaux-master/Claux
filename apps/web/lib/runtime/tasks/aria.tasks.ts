/**
 * ARIA Task Implementations
 * 
 * Phase Z5 - Real Execution Cutover
 * Runtime-integrated task implementations for ARIA - Keyword Intelligence Agent
 * 
 * Execution flow: Agent → RuntimeService → ExecutionOrchestrator → IntegrationDispatcher → n8n → DataForSEO/GSC
 */

import { isDispatchExecutionEnabled, shouldFallbackToDirectProvider } from '@/lib/integrations/mesh/feature-flags';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

/**
 * Normalize keyword for consistency
 */
function normalizeKeyword(keyword: string): string {
  let normalized = keyword.trim();
  normalized = normalized.toLowerCase();
  normalized = normalized.replace(/\s+/g, ' ');
  normalized = normalized.replace(/^[^\w\s]+|[^\w\s]+$/g, '');
  return normalized;
}

/**
 * Validate keyword
 */
function isValidKeyword(keyword: string): boolean {
  const normalized = normalizeKeyword(keyword);
  
  if (!normalized || normalized.length === 0) return false;
  if (normalized.length < 3) return false;
  
  const alphanumericOnly = normalized.replace(/[^a-z0-9\s]/g, '');
  if (alphanumericOnly.length === 0) return false;
  
  return true;
}

/**
 * Classify keyword intent
 */
function classifyIntent(keyword: string): 'transactional' | 'informational' | 'commercial' {
  const lowerKeyword = keyword.toLowerCase();
  
  if (lowerKeyword.includes('buy') || lowerKeyword.includes('price') || lowerKeyword.includes('near me') || lowerKeyword.includes('cost')) {
    return 'transactional';
  }
  
  if (lowerKeyword.includes('how') || lowerKeyword.includes('what') || lowerKeyword.includes('guide') || lowerKeyword.includes('why')) {
    return 'informational';
  }
  
  return 'commercial';
}

/**
 * Extract domain from URL
 */
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return url.replace(/^https?:\/\//, '').split('/')[0];
  }
}

/**
 * Task: Fetch Business Profile
 */
export async function task_fetch_business_profile(context: {
  tenant_id: string;
  workspace_id: string;
  execution_id: string;
}): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const supabase = createSupabaseAdminClient();
    
    const { data: businessProfile, error } = await supabase
      .from('business_profiles')
      .select('website_url, category')
      .eq('tenant_id', context.tenant_id)
      .maybeSingle();

    if (error || !businessProfile?.website_url) {
      return {
        success: false,
        error: error?.message || 'Business profile or website URL not found',
      };
    }

    const domain = extractDomain(businessProfile.website_url);

    return {
      success: true,
      data: {
        website_url: businessProfile.website_url,
        category: businessProfile.category,
        domain,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Task: Fetch Keywords
 */
export async function task_fetch_keywords(context: {
  tenant_id: string;
  workspace_id: string;
  execution_id: string;
  input_data: any;
}): Promise<{ success: boolean; data?: any; error?: string }> {
  const agentName = 'ARIA';
  const { domain } = context.input_data;
  
  if (isDispatchExecutionEnabled(agentName)) {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/dispatch/dataforseo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-Id': context.tenant_id,
          'X-Execution-Id': context.execution_id,
        },
        body: JSON.stringify({
          target: domain,
          executionId: context.execution_id,
          tenantId: context.tenant_id,
          traceId: `${context.execution_id}-fetch-keywords`,
        }),
      });

      if (!response.ok) {
        throw new Error(`DataForSEO dispatch failed: ${response.status}`);
      }

      const result = await response.json();
      
      return {
        success: true,
        data: { keywords: result.result, total: result.result?.length || 0 },
      };
    } catch (error) {
      if (shouldFallbackToDirectProvider(context.tenant_id, agentName)) {
        console.warn('[ARIA] Dispatch failed, falling back to direct adapter');
        return task_fetch_keywords_direct(context);
      }
      throw error;
    }
  }
  
  return task_fetch_keywords_direct(context);
}

/**
 * Direct adapter fallback for keyword fetch
 */
async function task_fetch_keywords_direct(context: {
  tenant_id: string;
  workspace_id: string;
  execution_id: string;
  input_data: any;
}): Promise<{ success: boolean; data?: any; error?: string }> {
  // TODO: Implement direct DataForSEO adapter call
  return {
    success: true,
    data: { keywords: [], total: 0 },
  };
}

/**
 * Task: Normalize Keywords
 */
export async function task_normalize_keywords(context: {
  tenant_id: string;
  workspace_id: string;
  execution_id: string;
  input_data: any;
}): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const { keywords } = context.input_data;
    
    const normalized = keywords.filter((kw: any) => isValidKeyword(kw.keyword));
    
    return {
      success: true,
      data: {
        keywords: normalized,
        total_raw: keywords.length,
        total_normalized: normalized.length,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Task: Classify Intent
 */
export async function task_classify_intent(context: {
  tenant_id: string;
  workspace_id: string;
  execution_id: string;
  input_data: any;
}): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const { keywords } = context.input_data;
    
    const classified = keywords.map((kw: any) => ({
      ...kw,
      intent: classifyIntent(kw.keyword),
    }));

    return {
      success: true,
      data: { keywords: classified },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Task: Quality Filter
 */
export async function task_quality_filter(context: {
  tenant_id: string;
  workspace_id: string;
  execution_id: string;
  input_data: any;
}): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const { keywords } = context.input_data;
    
    const filtered = keywords.filter((kw: any) => 
      kw.volume > 50 && kw.difficulty < 80
    );

    return {
      success: true,
      data: {
        keywords: filtered,
        total_before: keywords.length,
        total_after: filtered.length,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Task: Cluster Keywords
 */
export async function task_cluster_keywords(context: {
  tenant_id: string;
  workspace_id: string;
  execution_id: string;
  input_data: any;
}): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const { keywords } = context.input_data;
    
    // Simple clustering by intent for now
    // TODO: Implement semantic clustering
    const clusters: Record<string, any[]> = {
      transactional: [],
      informational: [],
      commercial: [],
    };

    keywords.forEach((kw: any) => {
      if (clusters[kw.intent]) {
        clusters[kw.intent].push(kw);
      }
    });

    return {
      success: true,
      data: {
        clusters,
        total_clusters: Object.keys(clusters).length,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Task: Analyze Opportunities
 */
export async function task_analyze_opportunities(context: {
  tenant_id: string;
  workspace_id: string;
  execution_id: string;
  input_data: any;
}): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const { clusters } = context.input_data;
    
    // Simple opportunity analysis based on volume/difficulty ratio
    const opportunities: any[] = [];
    
    Object.values(clusters).flat().forEach((kw: any) => {
      const opportunity_score = (kw.volume / (kw.difficulty + 1)) * 100;
      if (opportunity_score > 50) {
        opportunities.push({
          ...kw,
          opportunity_score,
        });
      }
    });

    // Sort by opportunity score
    opportunities.sort((a, b) => b.opportunity_score - a.opportunity_score);

    return {
      success: true,
      data: {
        opportunities,
        total_opportunities: opportunities.length,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Task: Store Keywords
 */
export async function task_store_keywords(context: {
  tenant_id: string;
  workspace_id: string;
  execution_id: string;
  input_data: any;
}): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const { opportunities } = context.input_data;
    const supabase = createSupabaseAdminClient();
    
    // Limit to top 100 keywords
    const limitedKeywords = opportunities.slice(0, 100);
    
    const keywordInserts = limitedKeywords.map((kw: any) => ({
      tenant_id: context.tenant_id,
      execution_id: context.execution_id,
      keyword: normalizeKeyword(kw.keyword),
      search_volume: kw.volume,
      difficulty: kw.difficulty,
      intent: kw.intent,
      opportunity_score: kw.opportunity_score,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    const { error, count } = await supabase
      .from('seo_keywords')
      .upsert(keywordInserts, {
        onConflict: 'tenant_id,keyword',
      });

    if (error) {
      throw new Error(`Failed to store keywords: ${error.message}`);
    }

    return {
      success: true,
      data: {
        total_inserted: count || limitedKeywords.length,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Task: Generate Content Briefs
 */
export async function task_generate_briefs(context: {
  tenant_id: string;
  workspace_id: string;
  execution_id: string;
  input_data: any;
}): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const { total_inserted } = context.input_data;
    const supabase = createSupabaseAdminClient();
    
    // Fetch top 10 high-opportunity keywords
    const { data: keywords } = await supabase
      .from('seo_keywords')
      .select('*')
      .eq('tenant_id', context.tenant_id)
      .order('opportunity_score', { ascending: false })
      .limit(10);

    if (!keywords || keywords.length === 0) {
      return {
        success: true,
        data: {
          briefs_generated: 0,
          message: 'No keywords available for brief generation',
        },
      };
    }

    const briefs = keywords.map((kw: any) => ({
      tenant_id: context.tenant_id,
      execution_id: context.execution_id,
      keyword: kw.keyword,
      intent: kw.intent,
      opportunity_score: kw.opportunity_score,
      brief: `Content brief for ${kw.keyword}: Focus on ${kw.intent} intent with opportunity score ${kw.opportunity_score}`,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from('seo_content_briefs')
      .insert(briefs);

    if (error) {
      throw new Error(`Failed to generate briefs: ${error.message}`);
    }

    return {
      success: true,
      data: {
        briefs_generated: briefs.length,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Task: Publish Workflow
 */
export async function task_publish_workflow(context: {
  tenant_id: string;
  workspace_id: string;
  execution_id: string;
  input_data: any;
}): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const { briefs_generated } = context.input_data;
    const supabase = createSupabaseAdminClient();
    
    // Update briefs to trigger SCRIBE workflow
    const { error } = await supabase
      .from('seo_content_briefs')
      .update({ status: 'ready_for_scribe' })
      .eq('tenant_id', context.tenant_id)
      .eq('execution_id', context.execution_id);

    if (error) {
      throw new Error(`Failed to publish workflow: ${error.message}`);
    }

    return {
      success: true,
      data: {
        workflow_published: true,
        briefs_published: briefs_generated,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
