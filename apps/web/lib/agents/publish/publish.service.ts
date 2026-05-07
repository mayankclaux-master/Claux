import type { AgentContext } from "../base/agent.types";
import {
  updateAgentState,
  logAgentActivity,
  updateAgentRunStatus,
  releaseAgentLock
} from "../base/agent.logger";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { publishPost as publishToWordPress } from "@/lib/connectors/wordpress.connector";
import { publishPost as publishToShopify } from "@/lib/connectors/shopify.connector";
import { publishPost as publishToCustom } from "@/lib/connectors/custom.connector";
import { getTenantIntegrations, getWordPressAppPassword, getShopifyAccessToken, getCustomApiKey } from "@/lib/integrations/utils";

const EXECUTION_TIMEOUT_MS = 120000; // 2 minutes for publishing

/**
 * Generate execution correlation ID
 */
function generateExecutionId(runId: string): string {
  return `${runId}:${Date.now()}`;
}

/**
 * Structured logging helper with executionId
 */
function structuredLog(level: "info" | "error" | "warn", data: Record<string, unknown>): void {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    ...data
  }));
}

/**
 * Generate URL-friendly slug from title
 */
function generateSlug(title: string): string {
  let slug = title.toLowerCase();
  slug = slug.replace(/\s+/g, '-');
  slug = slug.replace(/[^a-z0-9-]/g, '');
  slug = slug.replace(/-+/g, '-');
  slug = slug.replace(/^-|-$/g, '');
  return slug;
}

/**
 * Sanitize HTML for safe publishing
 */
function sanitizeHTML(html: string): string {
  // Remove script tags and their content
  let sanitized = html.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "");
  
  // Remove other potentially dangerous tags
  sanitized = sanitized.replace(/<iframe\b[^>]*>([\s\S]*?)<\/iframe>/gim, "");
  sanitized = sanitized.replace(/<object\b[^>]*>([\s\S]*?)<\/object>/gim, "");
  sanitized = sanitized.replace(/<embed\b[^>]*>/gim, "");
  
  // Remove inline event handlers
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gim, "");
  
  return sanitized;
}

/**
 * Run PUBLISH agent - Content Publishing
 */
export async function runPUBLISH(context: AgentContext): Promise<void> {
  const { tenantId, agent, runId } = context;
  const executionId = generateExecutionId(runId);

  structuredLog("info", {
    runId,
    executionId,
    tenantId,
    agent,
    step: "runPUBLISH_start",
    message: "Starting PUBLISH execution"
  });

  // Timeout protection wrapper
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error("Execution timeout exceeded")), EXECUTION_TIMEOUT_MS);
  });

  try {
    await Promise.race([
      executePUBLISH(context, executionId),
      timeoutPromise
    ]);
  } catch (error) {
    structuredLog("error", {
      runId,
      executionId,
      tenantId,
      agent,
      step: "runPUBLISH_error",
      error: error instanceof Error ? error.message : "Unknown error"
    });

    // Failure handling: update states to failed
    try {
      await updateAgentState(tenantId, agent, runId, {
        status: "failed",
        last_error: error instanceof Error ? error.message : "Unknown error"
      });

      await updateAgentRunStatus(runId, tenantId, "failed", {
        error: error instanceof Error ? error.message : "Unknown error",
        failed_at: new Date().toISOString()
      });

      await logAgentActivity(tenantId, agent, runId, "failed", `PUBLISH failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    } catch (updateError) {
      structuredLog("error", {
        runId,
        executionId,
        tenantId,
        agent,
        step: "failure_handling_error",
        error: updateError instanceof Error ? updateError.message : "Failed to update error state"
      });
    }
  } finally {
    // Safety: Double check final state before exiting
    try {
      const supabase = createSupabaseAdminClient();
      const { data: currentState } = await supabase
        .from("agent_states")
        .select("status")
        .eq("tenant_id", tenantId)
        .eq("agent", agent)
        .maybeSingle();

      if (currentState && (currentState.status === "running" || currentState.status === "queued")) {
        structuredLog("warn", {
          runId,
          executionId,
          tenantId,
          agent,
          step: "final_state_safety_check",
          currentStatus: currentState.status,
          message: "State not terminal, forcing failed state"
        });

        await updateAgentState(tenantId, agent, runId, {
          status: "failed",
          last_error: "Execution did not complete properly (forced failure by safety check)"
        });

        await updateAgentRunStatus(runId, tenantId, "failed", {
          reason: "safety_check_forced_failure",
          original_status: currentState.status,
          forced_at: new Date().toISOString()
        });

        await logAgentActivity(tenantId, agent, runId, "failed", "PUBLISH forced to failed by safety check: execution did not complete");
      }
    } catch (safetyError) {
      structuredLog("error", {
        runId,
        executionId,
        tenantId,
        agent,
        step: "final_state_safety_check_error",
        error: safetyError instanceof Error ? safetyError.message : "Failed to run safety check"
      });
    }

    try {
      await releaseAgentLock(tenantId, agent);
    } catch (lockError) {
      structuredLog("error", {
        runId,
        executionId,
        tenantId,
        agent,
        step: "lock_release_error",
        error: lockError instanceof Error ? lockError.message : "Failed to release lock"
      });
    }

    structuredLog("info", {
      runId,
      executionId,
      tenantId,
      agent,
      step: "runPUBLISH_complete",
      message: "PUBLISH execution finished (cleanup complete)"
    });
  }
}

/**
 * Execute PUBLISH logic
 */
async function executePUBLISH(context: AgentContext, executionId: string): Promise<void> {
  const { tenantId, agent, runId } = context;
  const supabase = createSupabaseAdminClient();

  // Step 1: Update state to running
  await updateAgentState(tenantId, agent, runId, {
    status: "running",
    progress: 0,
    current_task: "Initializing PUBLISH agent"
  });

  await updateAgentRunStatus(runId, tenantId, "running");

  await logAgentActivity(tenantId, agent, runId, "running", "PUBLISH agent started: initialization");

  structuredLog("info", {
    runId,
    executionId,
    tenantId,
    agent,
    step: "state_running",
    progress: 0
  });

  // Step 2: Fetch CMS credentials from integrations (20%)
  await updateAgentState(tenantId, agent, runId, {
    progress: 20,
    current_task: "Fetching CMS credentials"
  });

  await logAgentActivity(tenantId, agent, runId, "running", "PUBLISH agent: fetching CMS credentials");

  const integrations = await getTenantIntegrations(tenantId);
  
  let cmsType = "wordpress";
  let cmsConfig: {
    siteUrl?: string;
    username?: string;
    applicationPassword?: string;
    storeUrl?: string;
    accessToken?: string;
    blogId?: string;
    apiUrl?: string;
    apiKey?: string;
  } = {};

  // Determine CMS type based on integrations
  if (integrations?.wp_status === "connected") {
    cmsType = "wordpress";
    const appPassword = await getWordPressAppPassword(tenantId);
    cmsConfig = {
      siteUrl: integrations.wp_site_url || undefined,
      username: integrations.wp_username || undefined,
      applicationPassword: appPassword || undefined
    };
  } else if (integrations?.shopify_status === "connected") {
    cmsType = "shopify";
    const accessToken = await getShopifyAccessToken(tenantId);
    cmsConfig = {
      storeUrl: integrations.shopify_store_url || undefined,
      accessToken: accessToken || undefined,
      blogId: integrations.shopify_blog_id || undefined
    };
  } else if (integrations?.custom_status === "connected") {
    cmsType = "custom";
    const apiKey = await getCustomApiKey(tenantId);
    cmsConfig = {
      apiUrl: integrations.custom_api_url || undefined,
      apiKey: apiKey || undefined
    };
  } else {
    structuredLog("warn", {
      runId,
      executionId,
      tenantId,
      agent,
      step: "no_cms_config",
      message: "No CMS integration found, defaulting to WordPress"
    });
  }

  structuredLog("info", {
    runId,
    executionId,
    tenantId,
    agent,
    step: "cms_config_fetched",
    cmsType
  });

  // Step 3: Fetch draft content (30%)
  await updateAgentState(tenantId, agent, runId, {
    progress: 30,
    current_task: "Fetching draft content"
  });

  await logAgentActivity(tenantId, agent, runId, "running", "PUBLISH agent: fetching draft content");

  const { data: draftContent, error: draftsError } = await supabase
    .from("scribe_content")
    .select("id, title, body_html, status")
    .eq("tenant_id", tenantId)
    .eq("status", "draft")
    .limit(10);

  if (draftsError) {
    throw new Error(`Failed to fetch draft content: ${draftsError.message}`);
  }

  if (!draftContent || draftContent.length === 0) {
    structuredLog("warn", {
      runId,
      executionId,
      tenantId,
      agent,
      step: "no_drafts_found",
      message: "No draft content found, completing without publishing"
    });

    await updateAgentState(tenantId, agent, runId, {
      status: "completed",
      progress: 100,
      current_task: "Completed (no drafts found)"
    });

    await updateAgentRunStatus(runId, tenantId, "completed", {
      jobs_created: 0,
      jobs_success: 0,
      jobs_failed: 0,
      message: "No draft content found for publishing"
    });

    await logAgentActivity(tenantId, agent, runId, "completed", "PUBLISH agent completed: no drafts found");

    return;
  }

  structuredLog("info", {
    runId,
    executionId,
    tenantId,
    agent,
    step: "drafts_fetched",
    count: draftContent.length
  });

  // Step 4: Publish content (50%)
  await updateAgentState(tenantId, agent, runId, {
    progress: 50,
    current_task: "Publishing content"
  });

  let jobsSuccess = 0;
  let jobsFailed = 0;

  for (const content of draftContent) {
    try {
      // Prevent duplicate publish: check status again
      if (content.status !== "draft") {
        structuredLog("info", {
          runId,
          executionId,
          tenantId,
          agent,
          step: "skip_non_draft",
          contentId: content.id,
          status: content.status,
          message: "Content not in draft status, skipping"
        });
        continue;
      }

      // Immediately update content status to publishing to prevent duplicate attempts
      await supabase
        .from("scribe_content")
        .update({ status: "publishing" })
        .eq("id", content.id);

      // Create publish job
      const { data: job, error: jobError } = await supabase
        .from("publish_jobs")
        .insert({
          tenant_id: tenantId,
          content_id: content.id,
          status: "queued",
          cms_type: cmsType,
          retry_count: 0,
          max_retries: 3
        })
        .select("id")
        .single();

      if (jobError || !job) {
        throw new Error(`Failed to create publish job: ${jobError?.message}`);
      }

      await logAgentActivity(tenantId, agent, runId, "running", `PUBLISH agent: publishing ${content.title}`);

      // Update job to publishing
      await supabase
        .from("publish_jobs")
        .update({ status: "publishing" })
        .eq("id", job.id);

      // Sanitize HTML before publishing
      const sanitizedHTML = sanitizeHTML(content.body_html);

      // Generate slug for custom connector
      const slug = generateSlug(content.title);

      // Route connector based on cms_type
      let result;
      if (cmsType === "wordpress") {
        result = await publishToWordPress({
          title: content.title,
          html: sanitizedHTML,
          siteUrl: cmsConfig?.siteUrl || "",
          username: cmsConfig?.username || "",
          applicationPassword: cmsConfig?.applicationPassword || ""
        });
      } else if (cmsType === "shopify") {
        result = await publishToShopify({
          title: content.title,
          html: sanitizedHTML,
          slug: slug,
          storeUrl: cmsConfig?.storeUrl || "",
          accessToken: cmsConfig?.accessToken || "",
          blogId: cmsConfig?.blogId || ""
        });
      } else if (cmsType === "custom") {
        result = await publishToCustom({
          title: content.title,
          html: sanitizedHTML,
          slug: slug,
          apiUrl: cmsConfig?.apiUrl || "",
          apiKey: cmsConfig?.apiKey || ""
        });
      } else {
        throw new Error(`Unsupported CMS type: ${cmsType}`);
      }

      if (result.success && result.url) {
        // Update job to success
        await supabase
          .from("publish_jobs")
          .update({
            status: "success",
            published_url: result.url
          })
          .eq("id", job.id);

        // Update content status to published with URL and timestamp
        await supabase
          .from("scribe_content")
          .update({
            status: "published",
            published_url: result.url,
            published_at: new Date().toISOString()
          })
          .eq("id", content.id);

        jobsSuccess++;

        structuredLog("info", {
          runId,
          executionId,
          tenantId,
          agent,
          step: "publish_success",
          contentId: content.id,
          url: result.url
        });
      } else {
        // Increment retry count
        const { data: currentJob } = await supabase
          .from("publish_jobs")
          .select("retry_count, max_retries")
          .eq("id", job.id)
          .single();

        const newRetryCount = (currentJob?.retry_count || 0) + 1;
        const maxRetries = currentJob?.max_retries || 3;

        if (newRetryCount >= maxRetries) {
          // Update job to failed after max retries
          await supabase
            .from("publish_jobs")
            .update({
              status: "failed",
              error_message: result.error || "Unknown error",
              retry_count: newRetryCount
            })
            .eq("id", job.id);

          // Revert content status to draft
          await supabase
            .from("scribe_content")
            .update({ status: "draft" })
            .eq("id", content.id);

          jobsFailed++;

          structuredLog("error", {
            runId,
            executionId,
            tenantId,
            agent,
            step: "publish_failed_max_retries",
            contentId: content.id,
            retryCount: newRetryCount,
            error: result.error
          });
        } else {
          // Update job with retry count
          await supabase
            .from("publish_jobs")
            .update({
              status: "failed",
              error_message: result.error || "Unknown error",
              retry_count: newRetryCount
            })
            .eq("id", job.id);

          // Revert content status to draft
          await supabase
            .from("scribe_content")
            .update({ status: "draft" })
            .eq("id", content.id);

          jobsFailed++;

          structuredLog("warn", {
            runId,
            executionId,
            tenantId,
            agent,
            step: "publish_failed_retry",
            contentId: content.id,
            retryCount: newRetryCount,
            maxRetries,
            error: result.error
          });
        }
      }
    } catch (error) {
      jobsFailed++;
      structuredLog("error", {
        runId,
        executionId,
        tenantId,
        agent,
        step: "publish_error",
        contentId: content.id,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  // Step 4: Complete (100%)
  await updateAgentState(tenantId, agent, runId, {
    status: "completed",
    progress: 100,
    current_task: "Completed"
  });

  await updateAgentRunStatus(runId, tenantId, "completed", {
    jobs_created: draftContent.length,
    jobs_success: jobsSuccess,
    jobs_failed: jobsFailed,
    cms_type: cmsType
  });

  await logAgentActivity(tenantId, agent, runId, "completed", `PUBLISH agent completed successfully: ${jobsSuccess} published, ${jobsFailed} failed`);

  structuredLog("info", {
    runId,
    executionId,
    tenantId,
    agent,
    step: "runPUBLISH_complete",
    progress: 100,
    jobsCreated: draftContent.length,
    jobsSuccess,
    jobsFailed,
    message: "PUBLISH execution completed successfully"
  });
}
