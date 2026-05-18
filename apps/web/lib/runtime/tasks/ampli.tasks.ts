/**
 * AMPLI Task Implementations
 * 
 * Phase Z5 Wave 3 - Real Execution Cutover
 * Runtime-integrated task implementations for AMPLI - Distribution + Publishing Agent
 * 
 * Execution flow: Agent → RuntimeService → ExecutionOrchestrator → Direct Connector Execution
 * 
 * Canonical multitenant credential injection at runtime layer.
 */

import { isDispatchExecutionEnabled, shouldFallbackToDirectProvider } from '@/lib/integrations/mesh/feature-flags';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { 
  getTenantIntegrations, 
  getWordPressAppPassword, 
  getCustomApiKey,
  getShopifyAccessToken
} from '@/lib/integrations/utils';
import { publishPost as publishWordPressPost } from '@/lib/connectors/wordpress.connector';
import { publishPost as publishCustomPost } from '@/lib/connectors/custom.connector';
import { EventService, LogService } from '@/lib/runtime/services';
import { LogLevel } from '@/lib/runtime/types/log.types';

/**
 * Task: Fetch Drafts for Publishing
 */
export async function task_fetch_drafts(context: {
  tenant_id: string;
  workspace_id: string;
  execution_id: string;
}): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const supabase = createSupabaseAdminClient();
    
    const { data: drafts, error } = await supabase
      .from('seo_drafts')
      .select('*')
      .eq('tenant_id', context.tenant_id)
      .eq('status', 'draft')
      .limit(20);

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data: { drafts: drafts || [], total: drafts?.length || 0 },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Task: Validate Approval Gate
 */
export async function task_validate_approval_gate(context: {
  tenant_id: string;
  workspace_id: string;
  execution_id: string;
  input_data: any;
}): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const { drafts } = context.input_data;
    const supabase = createSupabaseAdminClient();
    
    const approvedDrafts: any[] = [];
    
    for (const draft of drafts) {
      const { data: approvals } = await supabase
        .from('publishing_approvals')
        .select('*')
        .eq('tenant_id', context.tenant_id)
        .eq('draft_id', draft.id)
        .eq('status', 'approved')
        .maybeSingle();
      
      if (approvals) {
        approvedDrafts.push(draft);
      }
    }

    return {
      success: true,
      data: { approved_drafts: approvedDrafts, total_approved: approvedDrafts.length },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Task: WordPress Publishing
 * 
 * Canonical multitenant credential injection at runtime.
 * Credentials retrieved dynamically from integrations table.
 */
export async function task_publish_wordpress(context: {
  tenant_id: string;
  workspace_id: string;
  execution_id: string;
  input_data: any;
}): Promise<{ success: boolean; data?: any; error?: string }> {
  const agentName = 'AMPLI';
  const { approved_drafts } = context.input_data;
  
  // Initialize runtime services for logging
  const eventService = new EventService({ 
    tenantId: context.tenant_id, 
    logOperations: true, 
    enableMetrics: false 
  });
  const logService = new LogService({ 
    tenantId: context.tenant_id, 
    logOperations: true, 
    enableMetrics: false 
  });
  
  // Publish start event
  await eventService.publishEvent({
    tenant_id: context.tenant_id,
    execution_id: context.execution_id,
    event_name: 'wordpress_publishing_started',
    event_source: 'ampli',
    event_version: '1.0',
    payload: { draft_count: approved_drafts?.length || 0 },
  });
  
  await logService.writeLog({
    execution_id: context.execution_id,
    log_level: LogLevel.INFO,
    message: 'WordPress publishing started',
    metadata: { draft_count: approved_drafts?.length || 0 },
  });
  
  if (isDispatchExecutionEnabled(agentName)) {
    try {
      const published: any[] = [];
      
      for (const draft of approved_drafts) {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/dispatch/cms`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Tenant-Id': context.tenant_id,
              'X-Execution-Id': context.execution_id,
            },
            body: JSON.stringify({
              cmsType: 'wordpress',
              content: {
                title: draft.title,
                content: draft.body_html,
                meta_title: draft.meta_title,
                meta_description: draft.meta_description,
              },
              executionId: context.execution_id,
              tenantId: context.tenant_id,
              traceId: `${context.execution_id}-wordpress-${draft.id}`,
            }),
          });

          if (!response.ok) {
            throw new Error(`CMS dispatch failed: ${response.status}`);
          }

          const result = await response.json();
          
          published.push({
            draft_id: draft.id,
            cms_post_id: result.result?.post_id,
            status: 'published',
          });
          
          await logService.writeLog({
            execution_id: context.execution_id,
            log_level: LogLevel.INFO,
            message: `WordPress draft published successfully: ${draft.id}`,
            metadata: { draft_id: draft.id, cms_post_id: result.result?.post_id },
          });
        } catch (error) {
          published.push({
            draft_id: draft.id,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          
          await logService.writeLog({
            execution_id: context.execution_id,
            log_level: LogLevel.ERROR,
            message: `WordPress draft publishing failed: ${draft.id}`,
            metadata: { draft_id: draft.id, error: error instanceof Error ? error.message : 'Unknown error' },
          });
        }
      }

      await eventService.publishEvent({
        tenant_id: context.tenant_id,
        execution_id: context.execution_id,
        event_name: 'wordpress_publishing_completed',
        event_source: 'ampli',
        event_version: '1.0',
        payload: { 
          total_published: published.filter(p => p.status === 'published').length,
          total_failed: published.filter(p => p.status === 'failed').length,
        },
      });

      return {
        success: true,
        data: { published, total_published: published.filter(p => p.status === 'published').length },
      };
    } catch (error) {
      await logService.writeLog({
        execution_id: context.execution_id,
        log_level: LogLevel.ERROR,
        message: 'WordPress dispatch failed, falling back to direct adapter',
        metadata: { error: error instanceof Error ? error.message : 'Unknown error' },
      });
      
      if (shouldFallbackToDirectProvider(context.tenant_id, agentName)) {
        return task_publish_wordpress_direct(context, eventService, logService);
      }
      throw error;
    }
  }
  
  return task_publish_wordpress_direct(context, eventService, logService);
}

/**
 * Direct WordPress Publishing - Canonical Implementation
 * 
 * Retrieves credentials dynamically from integrations table.
 * Uses WordPress connector for actual publishing.
 */
async function task_publish_wordpress_direct(
  context: {
    tenant_id: string;
    workspace_id: string;
    execution_id: string;
    input_data: any;
  },
  eventService: EventService,
  logService: LogService
): Promise<{ success: boolean; data?: any; error?: string }> {
  const { approved_drafts } = context.input_data;
  const published: any[] = [];
  
  await logService.writeLog({
    execution_id: context.execution_id,
    log_level: LogLevel.INFO,
    message: 'WordPress direct adapter execution started',
    metadata: { draft_count: approved_drafts?.length || 0 },
  });
  
  // Retrieve tenant credentials dynamically
  const integrations = await getTenantIntegrations(context.tenant_id);
  
  if (!integrations) {
    await logService.writeLog({
      execution_id: context.execution_id,
      log_level: LogLevel.ERROR,
      message: 'WordPress integrations not found for tenant',
      metadata: { tenant_id: context.tenant_id },
    });
    
    return {
      success: false,
      error: 'WordPress integrations not configured',
    };
  }
  
  const siteUrl = integrations.wp_site_url;
  const username = integrations.wp_username;
  const appPassword = await getWordPressAppPassword(context.tenant_id);
  
  if (!siteUrl || !username || !appPassword) {
    await logService.writeLog({
      execution_id: context.execution_id,
      log_level: LogLevel.ERROR,
      message: 'WordPress credentials incomplete',
      metadata: { has_site_url: !!siteUrl, has_username: !!username, has_app_password: !!appPassword },
    });
    
    return {
      success: false,
      error: 'WordPress credentials not configured',
    };
  }
  
  await logService.writeLog({
    execution_id: context.execution_id,
    log_level: LogLevel.INFO,
    message: 'WordPress credentials retrieved successfully',
    metadata: { site_url: siteUrl, username: username },
  });
  
  // Publish each draft
  for (const draft of approved_drafts) {
    try {
      const result = await publishWordPressPost({
        title: draft.title,
        html: draft.body_html,
        siteUrl: siteUrl,
        username: username,
        applicationPassword: appPassword,
      });
      
      if (result.success) {
        published.push({
          draft_id: draft.id,
          cms_post_id: result.url,
          url: result.url,
          status: 'published',
        });
        
        await logService.writeLog({
          execution_id: context.execution_id,
          log_level: LogLevel.INFO,
          message: `WordPress draft published successfully: ${draft.id}`,
          metadata: { draft_id: draft.id, url: result.url },
        });
      } else {
        published.push({
          draft_id: draft.id,
          status: 'failed',
          error: result.error,
        });
        
        await logService.writeLog({
          execution_id: context.execution_id,
          log_level: LogLevel.ERROR,
          message: `WordPress draft publishing failed: ${draft.id}`,
          metadata: { draft_id: draft.id, error: result.error },
        });
      }
    } catch (error) {
      published.push({
        draft_id: draft.id,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      await logService.writeLog({
        execution_id: context.execution_id,
        log_level: LogLevel.ERROR,
        message: `WordPress draft publishing failed: ${draft.id}`,
        metadata: { draft_id: draft.id, error: error instanceof Error ? error.message : 'Unknown error' },
      });
    }
  }
  
  await eventService.publishEvent({
    tenant_id: context.tenant_id,
    execution_id: context.execution_id,
    event_name: 'wordpress_direct_publishing_completed',
    event_source: 'ampli',
    event_version: '1.0',
    payload: { 
      total_published: published.filter(p => p.status === 'published').length,
      total_failed: published.filter(p => p.status === 'failed').length,
    },
  });
  
  return {
    success: true,
    data: { published, total_published: published.filter(p => p.status === 'published').length },
  };
}

/**
 * Task: Custom API Publishing
 * 
 * Canonical multitenant credential injection at runtime.
 * Credentials retrieved dynamically from integrations table.
 */
export async function task_publish_custom(context: {
  tenant_id: string;
  workspace_id: string;
  execution_id: string;
  input_data: any;
}): Promise<{ success: boolean; data?: any; error?: string }> {
  const agentName = 'AMPLI';
  const { approved_drafts } = context.input_data;
  
  // Initialize runtime services for logging
  const eventService = new EventService({ 
    tenantId: context.tenant_id, 
    logOperations: true, 
    enableMetrics: false 
  });
  const logService = new LogService({ 
    tenantId: context.tenant_id, 
    logOperations: true, 
    enableMetrics: false 
  });
  
  // Publish start event
  await eventService.publishEvent({
    tenant_id: context.tenant_id,
    execution_id: context.execution_id,
    event_name: 'custom_api_publishing_started',
    event_source: 'ampli',
    event_version: '1.0',
    payload: { draft_count: approved_drafts?.length || 0 },
  });
  
  await logService.writeLog({
    execution_id: context.execution_id,
    log_level: LogLevel.INFO,
    message: 'Custom API publishing started',
    metadata: { draft_count: approved_drafts?.length || 0 },
  });
  
  if (isDispatchExecutionEnabled(agentName)) {
    try {
      const published: any[] = [];
      
      for (const draft of approved_drafts) {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/dispatch/cms`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Tenant-Id': context.tenant_id,
              'X-Execution-Id': context.execution_id,
            },
            body: JSON.stringify({
              cmsType: 'custom',
              content: {
                title: draft.title,
                content: draft.body_html,
                meta_title: draft.meta_title,
                meta_description: draft.meta_description,
              },
              executionId: context.execution_id,
              tenantId: context.tenant_id,
              traceId: `${context.execution_id}-custom-${draft.id}`,
            }),
          });

          if (!response.ok) {
            throw new Error(`CMS dispatch failed: ${response.status}`);
          }

          const result = await response.json();
          
          published.push({
            draft_id: draft.id,
            cms_post_id: result.result?.post_id,
            status: 'published',
          });
          
          await logService.writeLog({
            execution_id: context.execution_id,
            log_level: LogLevel.INFO,
            message: `Custom API draft published successfully: ${draft.id}`,
            metadata: { draft_id: draft.id, cms_post_id: result.result?.post_id },
          });
        } catch (error) {
          published.push({
            draft_id: draft.id,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          
          await logService.writeLog({
            execution_id: context.execution_id,
            log_level: LogLevel.ERROR,
            message: `Custom API draft publishing failed: ${draft.id}`,
            metadata: { draft_id: draft.id, error: error instanceof Error ? error.message : 'Unknown error' },
          });
        }
      }

      await eventService.publishEvent({
        tenant_id: context.tenant_id,
        execution_id: context.execution_id,
        event_name: 'custom_api_publishing_completed',
        event_source: 'ampli',
        event_version: '1.0',
        payload: { 
          total_published: published.filter(p => p.status === 'published').length,
          total_failed: published.filter(p => p.status === 'failed').length,
        },
      });

      return {
        success: true,
        data: { published, total_published: published.filter(p => p.status === 'published').length },
      };
    } catch (error) {
      await logService.writeLog({
        execution_id: context.execution_id,
        log_level: LogLevel.ERROR,
        message: 'Custom API dispatch failed, falling back to direct adapter',
        metadata: { error: error instanceof Error ? error.message : 'Unknown error' },
      });
      
      if (shouldFallbackToDirectProvider(context.tenant_id, agentName)) {
        return task_publish_custom_direct(context, eventService, logService);
      }
      throw error;
    }
  }
  
  return task_publish_custom_direct(context, eventService, logService);
}

/**
 * Direct Custom API Publishing - Canonical Implementation
 * 
 * Retrieves credentials dynamically from integrations table.
 * Uses Custom API connector for actual publishing.
 */
async function task_publish_custom_direct(
  context: {
    tenant_id: string;
    workspace_id: string;
    execution_id: string;
    input_data: any;
  },
  eventService: EventService,
  logService: LogService
): Promise<{ success: boolean; data?: any; error?: string }> {
  const { approved_drafts } = context.input_data;
  const published: any[] = [];
  
  await logService.writeLog({
    execution_id: context.execution_id,
    log_level: LogLevel.INFO,
    message: 'Custom API direct adapter execution started',
    metadata: { draft_count: approved_drafts?.length || 0 },
  });
  
  // Retrieve tenant credentials dynamically
  const integrations = await getTenantIntegrations(context.tenant_id);
  
  if (!integrations) {
    await logService.writeLog({
      execution_id: context.execution_id,
      log_level: LogLevel.ERROR,
      message: 'Custom API integrations not found for tenant',
      metadata: { tenant_id: context.tenant_id },
    });
    
    return {
      success: false,
      error: 'Custom API integrations not configured',
    };
  }
  
  const apiUrl = integrations.custom_api_url;
  const apiKey = await getCustomApiKey(context.tenant_id);
  
  if (!apiUrl || !apiKey) {
    await logService.writeLog({
      execution_id: context.execution_id,
      log_level: LogLevel.ERROR,
      message: 'Custom API credentials incomplete',
      metadata: { has_api_url: !!apiUrl, has_api_key: !!apiKey },
    });
    
    return {
      success: false,
      error: 'Custom API credentials not configured',
    };
  }
  
  await logService.writeLog({
    execution_id: context.execution_id,
    log_level: LogLevel.INFO,
    message: 'Custom API credentials retrieved successfully',
    metadata: { api_url: apiUrl },
  });
  
  // Publish each draft
  for (const draft of approved_drafts) {
    try {
      const slug = draft.title.toLowerCase().replace(/\s+/g, '-');
      const result = await publishCustomPost({
        title: draft.title,
        html: draft.body_html,
        slug: slug,
        apiUrl: apiUrl,
        apiKey: apiKey,
      });
      
      if (result.success) {
        published.push({
          draft_id: draft.id,
          cms_post_id: result.url,
          url: result.url,
          status: 'published',
        });
        
        await logService.writeLog({
          execution_id: context.execution_id,
          log_level: LogLevel.INFO,
          message: `Custom API draft published successfully: ${draft.id}`,
          metadata: { draft_id: draft.id, url: result.url },
        });
      } else {
        published.push({
          draft_id: draft.id,
          status: 'failed',
          error: result.error,
        });
        
        await logService.writeLog({
          execution_id: context.execution_id,
          log_level: LogLevel.ERROR,
          message: `Custom API draft publishing failed: ${draft.id}`,
          metadata: { draft_id: draft.id, error: result.error },
        });
      }
    } catch (error) {
      published.push({
        draft_id: draft.id,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      await logService.writeLog({
        execution_id: context.execution_id,
        log_level: LogLevel.ERROR,
        message: `Custom API draft publishing failed: ${draft.id}`,
        metadata: { draft_id: draft.id, error: error instanceof Error ? error.message : 'Unknown error' },
      });
    }
  }
  
  await eventService.publishEvent({
    tenant_id: context.tenant_id,
    execution_id: context.execution_id,
    event_name: 'custom_api_direct_publishing_completed',
    event_source: 'ampli',
    event_version: '1.0',
    payload: { 
      total_published: published.filter(p => p.status === 'published').length,
      total_failed: published.filter(p => p.status === 'failed').length,
    },
  });
  
  return {
    success: true,
    data: { published, total_published: published.filter(p => p.status === 'published').length },
  };
}

/**
 * Task: Shopify Publishing
 * 
 * Canonical multitenant credential injection at runtime.
 * Credentials retrieved dynamically from integrations table.
 */
export async function task_publish_shopify(context: {
  tenant_id: string;
  workspace_id: string;
  execution_id: string;
  input_data: any;
}): Promise<{ success: boolean; data?: any; error?: string }> {
  const agentName = 'AMPLI';
  const { approved_drafts } = context.input_data;
  
  // Initialize runtime services for logging
  const eventService = new EventService({ 
    tenantId: context.tenant_id, 
    logOperations: true, 
    enableMetrics: false 
  });
  const logService = new LogService({ 
    tenantId: context.tenant_id, 
    logOperations: true, 
    enableMetrics: false 
  });
  
  // Publish start event
  await eventService.publishEvent({
    tenant_id: context.tenant_id,
    execution_id: context.execution_id,
    event_name: 'shopify_publishing_started',
    event_source: 'ampli',
    event_version: '1.0',
    payload: { draft_count: approved_drafts?.length || 0 },
  });
  
  await logService.writeLog({
    execution_id: context.execution_id,
    log_level: LogLevel.INFO,
    message: 'Shopify publishing started',
    metadata: { draft_count: approved_drafts?.length || 0 },
  });
  
  if (isDispatchExecutionEnabled(agentName)) {
    try {
      const published: any[] = [];
      
      for (const draft of approved_drafts) {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/dispatch/cms`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Tenant-Id': context.tenant_id,
              'X-Execution-Id': context.execution_id,
            },
            body: JSON.stringify({
              cmsType: 'shopify',
              content: {
                title: draft.title,
                description: draft.meta_description,
                body_html: draft.body_html,
              },
              executionId: context.execution_id,
              tenantId: context.tenant_id,
              traceId: `${context.execution_id}-shopify-${draft.id}`,
            }),
          });

          if (!response.ok) {
            throw new Error(`CMS dispatch failed: ${response.status}`);
          }

          const result = await response.json();
          
          published.push({
            draft_id: draft.id,
            cms_product_id: result.result?.product_id,
            status: 'published',
          });
          
          await logService.writeLog({
            execution_id: context.execution_id,
            log_level: LogLevel.INFO,
            message: `Shopify draft published successfully: ${draft.id}`,
            metadata: { draft_id: draft.id, cms_product_id: result.result?.product_id },
          });
        } catch (error) {
          published.push({
            draft_id: draft.id,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          
          await logService.writeLog({
            execution_id: context.execution_id,
            log_level: LogLevel.ERROR,
            message: `Shopify draft publishing failed: ${draft.id}`,
            metadata: { draft_id: draft.id, error: error instanceof Error ? error.message : 'Unknown error' },
          });
        }
      }

      await eventService.publishEvent({
        tenant_id: context.tenant_id,
        execution_id: context.execution_id,
        event_name: 'shopify_publishing_completed',
        event_source: 'ampli',
        event_version: '1.0',
        payload: { 
          total_published: published.filter(p => p.status === 'published').length,
          total_failed: published.filter(p => p.status === 'failed').length,
        },
      });

      return {
        success: true,
        data: { published, total_published: published.filter(p => p.status === 'published').length },
      };
    } catch (error) {
      await logService.writeLog({
        execution_id: context.execution_id,
        log_level: LogLevel.ERROR,
        message: 'Shopify dispatch failed, falling back to direct adapter',
        metadata: { error: error instanceof Error ? error.message : 'Unknown error' },
      });
      
      if (shouldFallbackToDirectProvider(context.tenant_id, agentName)) {
        return task_publish_shopify_direct(context, eventService, logService);
      }
      throw error;
    }
  }
  
  return task_publish_shopify_direct(context, eventService, logService);
}

async function task_publish_shopify_direct(
  context: {
    tenant_id: string;
    workspace_id: string;
    execution_id: string;
    input_data: any;
  },
  eventService: EventService,
  logService: LogService
): Promise<{ success: boolean; data?: any; error?: string }> {
  const { approved_drafts } = context.input_data;
  const published: any[] = [];
  
  await logService.writeLog({
    execution_id: context.execution_id,
    log_level: LogLevel.INFO,
    message: 'Shopify direct adapter execution started',
    metadata: { draft_count: approved_drafts?.length || 0 },
  });
  
  // Retrieve tenant credentials dynamically
  const integrations = await getTenantIntegrations(context.tenant_id);
  
  if (!integrations) {
    await logService.writeLog({
      execution_id: context.execution_id,
      log_level: LogLevel.ERROR,
      message: 'Shopify integrations not found for tenant',
      metadata: { tenant_id: context.tenant_id },
    });
    
    return {
      success: false,
      error: 'Shopify integrations not configured',
    };
  }
  
  const storeUrl = integrations.shopify_store_url;
  const accessToken = await getShopifyAccessToken(context.tenant_id);
  
  if (!storeUrl || !accessToken) {
    await logService.writeLog({
      execution_id: context.execution_id,
      log_level: LogLevel.ERROR,
      message: 'Shopify credentials incomplete',
      metadata: { has_store_url: !!storeUrl, has_access_token: !!accessToken },
    });
    
    return {
      success: false,
      error: 'Shopify credentials not configured',
    };
  }
  
  await logService.writeLog({
    execution_id: context.execution_id,
    log_level: LogLevel.INFO,
    message: 'Shopify credentials retrieved successfully',
    metadata: { store_url: storeUrl },
  });
  
  // Publish each draft (stub implementation - Shopify connector not yet created)
  for (const draft of approved_drafts) {
    published.push({
      draft_id: draft.id,
      status: 'failed',
      error: 'Shopify connector not yet implemented',
    });
    
    await logService.writeLog({
      execution_id: context.execution_id,
      log_level: LogLevel.WARN,
      message: `Shopify connector not yet implemented for draft: ${draft.id}`,
      metadata: { draft_id: draft.id },
    });
  }
  
  await eventService.publishEvent({
    tenant_id: context.tenant_id,
    execution_id: context.execution_id,
    event_name: 'shopify_direct_publishing_completed',
    event_source: 'ampli',
    event_version: '1.0',
    payload: { 
      total_published: published.filter(p => p.status === 'published').length,
      total_failed: published.filter(p => p.status === 'failed').length,
    },
  });
  
  return {
    success: true,
    data: { published, total_published: published.filter(p => p.status === 'published').length },
  };
}

/**
 * Task: Webflow Publishing
 * 
 * Canonical multitenant credential injection at runtime.
 * Credentials retrieved dynamically from integrations table.
 */
export async function task_publish_webflow(context: {
  tenant_id: string;
  workspace_id: string;
  execution_id: string;
  input_data: any;
}): Promise<{ success: boolean; data?: any; error?: string }> {
  const agentName = 'AMPLI';
  const { approved_drafts } = context.input_data;
  
  // Initialize runtime services for logging
  const eventService = new EventService({ 
    tenantId: context.tenant_id, 
    logOperations: true, 
    enableMetrics: false 
  });
  const logService = new LogService({ 
    tenantId: context.tenant_id, 
    logOperations: true, 
    enableMetrics: false 
  });
  
  // Publish start event
  await eventService.publishEvent({
    tenant_id: context.tenant_id,
    execution_id: context.execution_id,
    event_name: 'webflow_publishing_started',
    event_source: 'ampli',
    event_version: '1.0',
    payload: { draft_count: approved_drafts?.length || 0 },
  });
  
  await logService.writeLog({
    execution_id: context.execution_id,
    log_level: LogLevel.INFO,
    message: 'Webflow publishing started',
    metadata: { draft_count: approved_drafts?.length || 0 },
  });
  
  if (isDispatchExecutionEnabled(agentName)) {
    try {
      const published: any[] = [];
      
      for (const draft of approved_drafts) {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/dispatch/cms`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Tenant-Id': context.tenant_id,
              'X-Execution-Id': context.execution_id,
            },
            body: JSON.stringify({
              cmsType: 'webflow',
              content: {
                title: draft.title,
                body: draft.body_html,
                slug: draft.title.toLowerCase().replace(/\s+/g, '-'),
              },
              executionId: context.execution_id,
              tenantId: context.tenant_id,
              traceId: `${context.execution_id}-webflow-${draft.id}`,
            }),
          });

          if (!response.ok) {
            throw new Error(`CMS dispatch failed: ${response.status}`);
          }

          const result = await response.json();
          
          published.push({
            draft_id: draft.id,
            cms_item_id: result.result?.item_id,
            status: 'published',
          });
          
          await logService.writeLog({
            execution_id: context.execution_id,
            log_level: LogLevel.INFO,
            message: `Webflow draft published successfully: ${draft.id}`,
            metadata: { draft_id: draft.id, cms_item_id: result.result?.item_id },
          });
        } catch (error) {
          published.push({
            draft_id: draft.id,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          
          await logService.writeLog({
            execution_id: context.execution_id,
            log_level: LogLevel.ERROR,
            message: `Webflow draft publishing failed: ${draft.id}`,
            metadata: { draft_id: draft.id, error: error instanceof Error ? error.message : 'Unknown error' },
          });
        }
      }

      await eventService.publishEvent({
        tenant_id: context.tenant_id,
        execution_id: context.execution_id,
        event_name: 'webflow_publishing_completed',
        event_source: 'ampli',
        event_version: '1.0',
        payload: { 
          total_published: published.filter(p => p.status === 'published').length,
          total_failed: published.filter(p => p.status === 'failed').length,
        },
      });

      return {
        success: true,
        data: { published, total_published: published.filter(p => p.status === 'published').length },
      };
    } catch (error) {
      await logService.writeLog({
        execution_id: context.execution_id,
        log_level: LogLevel.ERROR,
        message: 'Webflow dispatch failed, falling back to direct adapter',
        metadata: { error: error instanceof Error ? error.message : 'Unknown error' },
      });
      
      if (shouldFallbackToDirectProvider(context.tenant_id, agentName)) {
        return task_publish_webflow_direct(context, eventService, logService);
      }
      throw error;
    }
  }
  
  return task_publish_webflow_direct(context, eventService, logService);
}

async function task_publish_webflow_direct(
  context: {
    tenant_id: string;
    workspace_id: string;
    execution_id: string;
    input_data: any;
  },
  eventService: EventService,
  logService: LogService
): Promise<{ success: boolean; data?: any; error?: string }> {
  const { approved_drafts } = context.input_data;
  const published: any[] = [];
  
  await logService.writeLog({
    execution_id: context.execution_id,
    log_level: LogLevel.INFO,
    message: 'Webflow direct adapter execution started',
    metadata: { draft_count: approved_drafts?.length || 0 },
  });
  
  // Publish each draft (stub implementation - Webflow connector not yet created)
  for (const draft of approved_drafts) {
    published.push({
      draft_id: draft.id,
      status: 'failed',
      error: 'Webflow connector not yet implemented',
    });
    
    await logService.writeLog({
      execution_id: context.execution_id,
      log_level: LogLevel.WARN,
      message: `Webflow connector not yet implemented for draft: ${draft.id}`,
      metadata: { draft_id: draft.id },
    });
  }
  
  await eventService.publishEvent({
    tenant_id: context.tenant_id,
    execution_id: context.execution_id,
    event_name: 'webflow_direct_publishing_completed',
    event_source: 'ampli',
    event_version: '1.0',
    payload: { 
      total_published: published.filter(p => p.status === 'published').length,
      total_failed: published.filter(p => p.status === 'failed').length,
    },
  });
  
  return {
    success: true,
    data: { published, total_published: published.filter(p => p.status === 'published').length },
  };
}

/**
 * Task: Ghost Publishing
 * 
 * Canonical multitenant credential injection at runtime.
 * Credentials retrieved dynamically from integrations table.
 */
export async function task_publish_ghost(context: {
  tenant_id: string;
  workspace_id: string;
  execution_id: string;
  input_data: any;
}): Promise<{ success: boolean; data?: any; error?: string }> {
  const agentName = 'AMPLI';
  const { approved_drafts } = context.input_data;
  
  // Initialize runtime services for logging
  const eventService = new EventService({ 
    tenantId: context.tenant_id, 
    logOperations: true, 
    enableMetrics: false 
  });
  const logService = new LogService({ 
    tenantId: context.tenant_id, 
    logOperations: true, 
    enableMetrics: false 
  });
  
  // Publish start event
  await eventService.publishEvent({
    tenant_id: context.tenant_id,
    execution_id: context.execution_id,
    event_name: 'ghost_publishing_started',
    event_source: 'ampli',
    event_version: '1.0',
    payload: { draft_count: approved_drafts?.length || 0 },
  });
  
  await logService.writeLog({
    execution_id: context.execution_id,
    log_level: LogLevel.INFO,
    message: 'Ghost publishing started',
    metadata: { draft_count: approved_drafts?.length || 0 },
  });
  
  if (isDispatchExecutionEnabled(agentName)) {
    try {
      const published: any[] = [];
      
      for (const draft of approved_drafts) {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/dispatch/cms`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Tenant-Id': context.tenant_id,
              'X-Execution-Id': context.execution_id,
            },
            body: JSON.stringify({
              cmsType: 'ghost',
              content: {
                title: draft.title,
                html: draft.body_html,
                meta_title: draft.meta_title,
                meta_description: draft.meta_description,
              },
              executionId: context.execution_id,
              tenantId: context.tenant_id,
              traceId: `${context.execution_id}-ghost-${draft.id}`,
            }),
          });

          if (!response.ok) {
            throw new Error(`CMS dispatch failed: ${response.status}`);
          }

          const result = await response.json();
          
          published.push({
            draft_id: draft.id,
            cms_post_id: result.result?.post_id,
            status: 'published',
          });
          
          await logService.writeLog({
            execution_id: context.execution_id,
            log_level: LogLevel.INFO,
            message: `Ghost draft published successfully: ${draft.id}`,
            metadata: { draft_id: draft.id, cms_post_id: result.result?.post_id },
          });
        } catch (error) {
          published.push({
            draft_id: draft.id,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          
          await logService.writeLog({
            execution_id: context.execution_id,
            log_level: LogLevel.ERROR,
            message: `Ghost draft publishing failed: ${draft.id}`,
            metadata: { draft_id: draft.id, error: error instanceof Error ? error.message : 'Unknown error' },
          });
        }
      }

      await eventService.publishEvent({
        tenant_id: context.tenant_id,
        execution_id: context.execution_id,
        event_name: 'ghost_publishing_completed',
        event_source: 'ampli',
        event_version: '1.0',
        payload: { 
          total_published: published.filter(p => p.status === 'published').length,
          total_failed: published.filter(p => p.status === 'failed').length,
        },
      });

      return {
        success: true,
        data: { published, total_published: published.filter(p => p.status === 'published').length },
      };
    } catch (error) {
      await logService.writeLog({
        execution_id: context.execution_id,
        log_level: LogLevel.ERROR,
        message: 'Ghost dispatch failed, falling back to direct adapter',
        metadata: { error: error instanceof Error ? error.message : 'Unknown error' },
      });
      
      if (shouldFallbackToDirectProvider(context.tenant_id, agentName)) {
        return task_publish_ghost_direct(context, eventService, logService);
      }
      throw error;
    }
  }
  
  return task_publish_ghost_direct(context, eventService, logService);
}

async function task_publish_ghost_direct(
  context: {
    tenant_id: string;
    workspace_id: string;
    execution_id: string;
    input_data: any;
  },
  eventService: EventService,
  logService: LogService
): Promise<{ success: boolean; data?: any; error?: string }> {
  const { approved_drafts } = context.input_data;
  const published: any[] = [];
  
  await logService.writeLog({
    execution_id: context.execution_id,
    log_level: LogLevel.INFO,
    message: 'Ghost direct adapter execution started',
    metadata: { draft_count: approved_drafts?.length || 0 },
  });
  
  // Publish each draft (stub implementation - Ghost connector not yet created)
  for (const draft of approved_drafts) {
    published.push({
      draft_id: draft.id,
      status: 'failed',
      error: 'Ghost connector not yet implemented',
    });
    
    await logService.writeLog({
      execution_id: context.execution_id,
      log_level: LogLevel.WARN,
      message: `Ghost connector not yet implemented for draft: ${draft.id}`,
      metadata: { draft_id: draft.id },
    });
  }
  
  await eventService.publishEvent({
    tenant_id: context.tenant_id,
    execution_id: context.execution_id,
    event_name: 'ghost_direct_publishing_completed',
    event_source: 'ampli',
    event_version: '1.0',
    payload: { 
      total_published: published.filter(p => p.status === 'published').length,
      total_failed: published.filter(p => p.status === 'failed').length,
    },
  });
  
  return {
    success: true,
    data: { published, total_published: published.filter(p => p.status === 'published').length },
  };
}

/**
 * Task: Scheduled Publishing
 */
export async function task_schedule_publishing(context: {
  tenant_id: string;
  workspace_id: string;
  execution_id: string;
  input_data: any;
}): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const { approved_drafts, schedule_config } = context.input_data;
    const supabase = createSupabaseAdminClient();
    
    const scheduled = approved_drafts.map((draft: any) => ({
      tenant_id: context.tenant_id,
      execution_id: context.execution_id,
      draft_id: draft.id,
      scheduled_at: schedule_config.scheduled_at,
      status: 'scheduled',
      created_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from('publishing_schedule')
      .insert(scheduled);

    if (error) {
      throw new Error(`Failed to schedule publishing: ${error.message}`);
    }

    return {
      success: true,
      data: { total_scheduled: scheduled.length },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Task: Rollback Publishing
 */
export async function task_rollback_publishing(context: {
  tenant_id: string;
  workspace_id: string;
  execution_id: string;
  input_data: any;
}): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const { cms_post_ids, cms_type } = context.input_data;
    const agentName = 'AMPLI';
    
    // Initialize runtime services for logging
    const eventService = new EventService({ 
      tenantId: context.tenant_id, 
      logOperations: true, 
      enableMetrics: false 
    });
    const logService = new LogService({ 
      tenantId: context.tenant_id, 
      logOperations: true, 
      enableMetrics: false 
    });
    
    // Publish start event
    await eventService.publishEvent({
      tenant_id: context.tenant_id,
      execution_id: context.execution_id,
      event_name: 'rollback_publishing_started',
      event_source: 'ampli',
      event_version: '1.0',
      payload: { cms_type, post_count: cms_post_ids?.length || 0 },
    });
    
    await logService.writeLog({
      execution_id: context.execution_id,
      log_level: LogLevel.INFO,
      message: 'Rollback publishing started',
      metadata: { cms_type, post_count: cms_post_ids?.length || 0 },
    });
    
    if (isDispatchExecutionEnabled(agentName)) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/dispatch/cms`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Tenant-Id': context.tenant_id,
            'X-Execution-Id': context.execution_id,
          },
          body: JSON.stringify({
            cmsType: cms_type,
            action: 'rollback',
            postIds: cms_post_ids,
            executionId: context.execution_id,
            tenantId: context.tenant_id,
            traceId: `${context.execution_id}-rollback`,
          }),
        });

        if (!response.ok) {
          throw new Error(`CMS dispatch failed: ${response.status}`);
        }

        const result = await response.json();
        
        await eventService.publishEvent({
          tenant_id: context.tenant_id,
          execution_id: context.execution_id,
          event_name: 'rollback_publishing_completed',
          event_source: 'ampli',
          event_version: '1.0',
          payload: { rolled_back: result.result?.rolled_back || [], total_rolled_back: cms_post_ids.length },
        });
        
        return {
          success: true,
          data: { rolled_back: result.result?.rolled_back || [], total_rolled_back: cms_post_ids.length },
        };
      } catch (error) {
        await logService.writeLog({
          execution_id: context.execution_id,
          log_level: LogLevel.ERROR,
          message: 'Rollback dispatch failed, falling back to direct adapter',
          metadata: { error: error instanceof Error ? error.message : 'Unknown error' },
        });
        
        if (shouldFallbackToDirectProvider(context.tenant_id, agentName)) {
          return task_rollback_publishing_direct(context, eventService, logService);
        }
        throw error;
      }
    }
    
    return task_rollback_publishing_direct(context, eventService, logService);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function task_rollback_publishing_direct(
  context: {
    tenant_id: string;
    workspace_id: string;
    execution_id: string;
    input_data: any;
  },
  eventService: EventService,
  logService: LogService
): Promise<{ success: boolean; data?: any; error?: string }> {
  const { cms_post_ids, cms_type } = context.input_data;
  
  await logService.writeLog({
    execution_id: context.execution_id,
    log_level: LogLevel.INFO,
    message: 'Rollback direct adapter execution started',
    metadata: { cms_type, post_count: cms_post_ids?.length || 0 },
  });
  
  // Stub implementation - rollback not yet implemented
  await logService.writeLog({
    execution_id: context.execution_id,
    log_level: LogLevel.WARN,
    message: 'Rollback connector not yet implemented',
    metadata: { cms_type },
  });
  
  await eventService.publishEvent({
    tenant_id: context.tenant_id,
    execution_id: context.execution_id,
    event_name: 'rollback_direct_publishing_completed',
    event_source: 'ampli',
    event_version: '1.0',
    payload: { rolled_back: [], total_rolled_back: 0 },
  });
  
  return {
    success: true,
    data: { rolled_back: [], total_rolled_back: 0 },
  };
}

/**
 * Task: Update Publishing Status
 */
export async function task_update_publishing_status(context: {
  tenant_id: string;
  workspace_id: string;
  execution_id: string;
  input_data: any;
}): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const { published } = context.input_data;
    const supabase = createSupabaseAdminClient();
    
    for (const pub of published) {
      await supabase
        .from('seo_drafts')
        .update({ 
          status: pub.status,
          cms_post_id: pub.cms_post_id || pub.cms_product_id || pub.cms_item_id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', pub.draft_id);
    }

    return {
      success: true,
      data: { total_updated: published.length },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
