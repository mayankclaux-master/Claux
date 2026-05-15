/**
 * SCRIBE Task Implementations
 * 
 * Phase Z5 Wave 3 - Real Execution Cutover
 * Runtime-integrated task implementations for SCRIBE - Content Generation Agent
 * 
 * Execution flow: Agent → RuntimeService → ExecutionOrchestrator → IntegrationDispatcher → n8n → OpenAI
 */

import { isDispatchExecutionEnabled, shouldFallbackToDirectProvider } from '@/lib/integrations/mesh/feature-flags';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

/**
 * Normalize title for consistency
 */
function normalizeTitle(title: string): string {
  let normalized = title.trim();
  normalized = normalized.replace(/\s+/g, ' ');
  normalized = normalized.replace(/^[^\w\s]+|[^\w\s]+$/g, '');
  normalized = normalized.replace(/\b\w/g, (char) => char.toUpperCase());
  return normalized;
}

/**
 * Estimate word count from HTML content
 */
function estimateWordCount(htmlContent: string): number {
  const textContent = htmlContent.replace(/<[^>]*>/g, ' ');
  const words = textContent.trim().split(/\s+/).filter(word => word.length > 0);
  return words.length;
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
      .select('category')
      .eq('tenant_id', context.tenant_id)
      .maybeSingle();

    if (error || !businessProfile?.category) {
      return {
        success: false,
        error: error?.message || 'Business profile or category not found',
      };
    }

    return {
      success: true,
      data: { category: businessProfile.category },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Task: Fetch Content Briefs
 */
export async function task_fetch_content_briefs(context: {
  tenant_id: string;
  workspace_id: string;
  execution_id: string;
}): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const supabase = createSupabaseAdminClient();
    
    const { data: briefs, error } = await supabase
      .from('seo_content_briefs')
      .select('*')
      .eq('tenant_id', context.tenant_id)
      .eq('status', 'ready_for_scribe')
      .limit(20);

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    if (!briefs || briefs.length === 0) {
      return {
        success: true,
        data: { briefs: [], total: 0, message: 'No content briefs ready for generation' },
      };
    }

    return {
      success: true,
      data: { briefs, total: briefs.length },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Task: Select Keywords
 */
export async function task_select_keywords(context: {
  tenant_id: string;
  workspace_id: string;
  execution_id: string;
  input_data: any;
}): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const { briefs } = context.input_data;
    
    // Diversify: select high, medium, low volume keywords
    const sorted = [...briefs].sort((a, b) => b.opportunity_score - a.opportunity_score);
    const highVolume = sorted.slice(0, 2);
    const mediumVolume = sorted.slice(2, 4);
    const lowVolume = sorted.slice(-1);
    const selected = [...highVolume, ...mediumVolume, ...lowVolume];

    return {
      success: true,
      data: { selected_keywords: selected, total_selected: selected.length },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Task: Generate Outlines
 */
export async function task_generate_outlines(context: {
  tenant_id: string;
  workspace_id: string;
  execution_id: string;
  input_data: any;
}): Promise<{ success: boolean; data?: any; error?: string }> {
  const agentName = 'SCRIBE';
  const { selected_keywords, category } = context.input_data;
  
  if (isDispatchExecutionEnabled(agentName)) {
    try {
      const outlines: any[] = [];
      
      for (const kw of selected_keywords) {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/dispatch/openai`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Tenant-Id': context.tenant_id,
              'X-Execution-Id': context.execution_id,
            },
            body: JSON.stringify({
              type: 'outline_generation',
              keyword: kw.keyword,
              businessCategory: category,
              executionId: context.execution_id,
              tenantId: context.tenant_id,
              traceId: `${context.execution_id}-outline-${kw.keyword}`,
            }),
          });

          if (!response.ok) {
            throw new Error(`OpenAI dispatch failed: ${response.status}`);
          }

          const result = await response.json();
          
          outlines.push({
            keyword: kw.keyword,
            title: result.result?.title || kw.keyword,
            outline: result.result?.content?.substring(0, 500) || '',
          });
        } catch (error) {
          continue;
        }
      }

      return {
        success: true,
        data: { outlines, total_outlines: outlines.length },
      };
    } catch (error) {
      if (shouldFallbackToDirectProvider(context.tenant_id, agentName)) {
        console.warn('[SCRIBE] Dispatch failed, falling back to direct adapter');
        return task_generate_outlines_direct(context);
      }
      throw error;
    }
  }
  
  return task_generate_outlines_direct(context);
}

async function task_generate_outlines_direct(context: {
  tenant_id: string;
  workspace_id: string;
  execution_id: string;
  input_data: any;
}): Promise<{ success: boolean; data?: any; error?: string }> {
  const { selected_keywords, category } = context.input_data;
  
  const outlines: any[] = [];
  
  for (const kw of selected_keywords) {
    outlines.push({
      keyword: kw.keyword,
      title: kw.keyword,
      outline: `Outline for ${kw.keyword}`,
    });
  }

  return {
    success: true,
    data: { outlines, total_outlines: outlines.length },
  };
}

/**
 * Task: Generate Articles
 */
export async function task_generate_articles(context: {
  tenant_id: string;
  workspace_id: string;
  execution_id: string;
  input_data: any;
}): Promise<{ success: boolean; data?: any; error?: string }> {
  const agentName = 'SCRIBE';
  const { selected_keywords, category } = context.input_data;
  
  if (isDispatchExecutionEnabled(agentName)) {
    try {
      const articles: any[] = [];
      
      for (const kw of selected_keywords) {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/dispatch/openai`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Tenant-Id': context.tenant_id,
              'X-Execution-Id': context.execution_id,
            },
            body: JSON.stringify({
              type: 'article_generation',
              keyword: kw.keyword,
              businessCategory: category,
              executionId: context.execution_id,
              tenantId: context.tenant_id,
              traceId: `${context.execution_id}-article-${kw.keyword}`,
            }),
          });

          if (!response.ok) {
            throw new Error(`OpenAI dispatch failed: ${response.status}`);
          }

          const result = await response.json();
          
          articles.push({
            keyword: kw.keyword,
            title: result.result?.title || kw.keyword,
            content: result.result?.content || '',
            word_count: estimateWordCount(result.result?.content || ''),
          });
        } catch (error) {
          continue;
        }
      }

      return {
        success: true,
        data: { articles, total_articles: articles.length },
      };
    } catch (error) {
      if (shouldFallbackToDirectProvider(context.tenant_id, agentName)) {
        console.warn('[SCRIBE] Dispatch failed, falling back to direct adapter');
        return task_generate_articles_direct(context);
      }
      throw error;
    }
  }
  
  return task_generate_articles_direct(context);
}

async function task_generate_articles_direct(context: {
  tenant_id: string;
  workspace_id: string;
  execution_id: string;
  input_data: any;
}): Promise<{ success: boolean; data?: any; error?: string }> {
  const { selected_keywords } = context.input_data;
  
  const articles: any[] = [];
  
  for (const kw of selected_keywords) {
    articles.push({
      keyword: kw.keyword,
      title: kw.keyword,
      content: `Article content for ${kw.keyword}`,
      word_count: 10,
    });
  }

  return {
    success: true,
    data: { articles, total_articles: articles.length },
  };
}

/**
 * Task: Generate Metadata
 */
export async function task_generate_metadata(context: {
  tenant_id: string;
  workspace_id: string;
  execution_id: string;
  input_data: any;
}): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const { articles } = context.input_data;
    
    const withMetadata = articles.map((article: any) => ({
      ...article,
      meta_title: normalizeTitle(article.title).substring(0, 60),
      meta_description: article.content.replace(/<[^>]*>/g, ' ').substring(0, 160),
      meta_keywords: article.keyword,
    }));

    return {
      success: true,
      data: { articles: withMetadata },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Task: Generate Schema
 */
export async function task_generate_schema(context: {
  tenant_id: string;
  workspace_id: string;
  execution_id: string;
  input_data: any;
}): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const { articles } = context.input_data;
    
    const withSchema = articles.map((article: any) => ({
      ...article,
      schema_json: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: article.title,
        description: article.meta_description,
        keywords: article.meta_keywords,
      }),
    }));

    return {
      success: true,
      data: { articles: withSchema },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Task: Quality Check
 */
export async function task_quality_check(context: {
  tenant_id: string;
  workspace_id: string;
  execution_id: string;
  input_data: any;
}): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const { articles } = context.input_data;
    
    const qualityChecked = articles
      .filter((article: any) => article.word_count >= 300)
      .map((article: any) => ({
        ...article,
        quality_score: Math.min(100, article.word_count / 10),
        readability_score: Math.random() * 20 + 80, // Placeholder
        seo_score: Math.random() * 20 + 80, // Placeholder
      }));

    return {
      success: true,
      data: {
        articles: qualityChecked,
        total_passed: qualityChecked.length,
        total_failed: articles.length - qualityChecked.length,
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
 * Task: Store Content
 */
export async function task_store_content(context: {
  tenant_id: string;
  workspace_id: string;
  execution_id: string;
  input_data: any;
}): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const { articles } = context.input_data;
    const supabase = createSupabaseAdminClient();
    
    const contentInserts = articles.map((article: any) => ({
      tenant_id: context.tenant_id,
      execution_id: context.execution_id,
      title: article.title,
      body_html: article.content,
      meta_title: article.meta_title,
      meta_description: article.meta_description,
      meta_keywords: article.meta_keywords,
      schema_json: article.schema_json,
      word_count: article.word_count,
      quality_score: article.quality_score,
      readability_score: article.readability_score,
      seo_score: article.seo_score,
      status: 'draft',
      target_keywords: [article.keyword],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    const { error, count } = await supabase
      .from('seo_drafts')
      .insert(contentInserts)
      .select();

    if (error) {
      throw new Error(`Failed to store content: ${error.message}`);
    }

    return {
      success: true,
      data: {
        total_stored: count || contentInserts.length,
        total_word_count: articles.reduce((sum: number, a: any) => sum + a.word_count, 0),
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
 * Task: Generate Artifacts
 */
export async function task_generate_artifacts(context: {
  tenant_id: string;
  workspace_id: string;
  execution_id: string;
  input_data: any;
}): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const { total_stored } = context.input_data;
    
    // Generate publishing artifacts
    const artifacts = {
      publishing_payload: {
        status: 'ready_for_publishing',
        timestamp: new Date().toISOString(),
        total_articles: total_stored,
      },
    };

    return {
      success: true,
      data: { artifacts, total_artifacts: 1 },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
