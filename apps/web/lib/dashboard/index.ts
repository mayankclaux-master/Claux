import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export interface ARIAStats {
  totalKeywords: number;
  topKeywords: Array<{ keyword: string; search_volume: number; intent: string }>;
  intentBreakdown: { [key: string]: number };
}

export interface SCRIBEStats {
  draftCount: number;
  publishedCount: number;
}

export interface PUBLISHStats {
  successCount: number;
  failedCount: number;
  latestPublishedUrls: Array<{ url: string; published_at: string }>;
}

export interface PULSEStats {
  averageRank: number | null;
  averageVisibilityScore: number | null;
  topImprovingKeywords: Array<{ keyword: string; rank_change: number }>;
}

export interface LOCLStats {
  optimizationScore: number | null;
  completenessScore: number | null;
  recommendations: string[];
}

export interface AgentStatus {
  agent: string;
  status: string;
  lastRun: string | null;
}

export interface ActivityFeedItem {
  agent: string;
  status: string;
  message: string;
  timestamp: string;
}

/**
 * Get ARIA agent stats
 */
export async function getARIAStats(tenantId: string): Promise<ARIAStats | null> {
  try {
    const supabase = createSupabaseBrowserClient();

    // Get total keywords
    const { count: totalKeywords } = await supabase
      .from("aria_keywords")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId);

    // Get top keywords
    const { data: topKeywords } = await supabase
      .from("aria_keywords")
      .select("keyword, search_volume, intent")
      .eq("tenant_id", tenantId)
      .order("search_volume", { ascending: false })
      .limit(5);

    // Get intent breakdown
    const { data: keywords } = await supabase
      .from("aria_keywords")
      .select("intent")
      .eq("tenant_id", tenantId);

    const intentBreakdown: { [key: string]: number } = {};
    if (keywords) {
      keywords.forEach((k: { intent: string | null }) => {
        const intent = k.intent || "unknown";
        intentBreakdown[intent] = (intentBreakdown[intent] || 0) + 1;
      });
    }

    return {
      totalKeywords: totalKeywords || 0,
      topKeywords: topKeywords || [],
      intentBreakdown
    };
  } catch (error) {
    console.error("Error fetching ARIA stats:", error);
    return null;
  }
}

/**
 * Get SCRIBE agent stats
 */
export async function getSCRIBEStats(tenantId: string): Promise<SCRIBEStats | null> {
  try {
    const supabase = createSupabaseBrowserClient();

    // Get draft count
    const { count: draftCount } = await supabase
      .from("scribe_content")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("status", "draft");

    // Get published count
    const { count: publishedCount } = await supabase
      .from("scribe_content")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("status", "published");

    return {
      draftCount: draftCount || 0,
      publishedCount: publishedCount || 0
    };
  } catch (error) {
    console.error("Error fetching SCRIBE stats:", error);
    return null;
  }
}

/**
 * Get PUBLISH agent stats
 */
export async function getPUBLISHStats(tenantId: string): Promise<PUBLISHStats | null> {
  try {
    const supabase = createSupabaseBrowserClient();

    // Get success count
    const { count: successCount } = await supabase
      .from("publish_jobs")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("status", "success");

    // Get failed count
    const { count: failedCount } = await supabase
      .from("publish_jobs")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("status", "failed");

    // Get latest published URLs
    const { data: publishedContent } = await supabase
      .from("scribe_content")
      .select("published_url, published_at")
      .eq("tenant_id", tenantId)
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(5);

    const latestPublishedUrls = (publishedContent || [])
      .filter((item: { published_url: string | null }) => item.published_url)
      .map((item: { published_url: string; published_at: string }) => ({
        url: item.published_url,
        published_at: item.published_at
      }));

    return {
      successCount: successCount || 0,
      failedCount: failedCount || 0,
      latestPublishedUrls
    };
  } catch (error) {
    console.error("Error fetching PUBLISH stats:", error);
    return null;
  }
}

/**
 * Get PULSE agent stats
 */
export async function getPULSEStats(tenantId: string): Promise<PULSEStats | null> {
  try {
    const supabase = createSupabaseBrowserClient();

    // Get average rank
    const { data: rankData } = await supabase
      .from("pulse_rankings")
      .select("current_rank")
      .eq("tenant_id", tenantId)
      .eq("status", "success")
      .not("current_rank", "is", null);

    const averageRank = rankData && rankData.length > 0
      ? rankData.reduce((sum: number, r: { current_rank: number | null }) => sum + (r.current_rank || 0), 0) / rankData.length
      : null;

    // Get average visibility score
    const { data: visibilityData } = await supabase
      .from("pulse_rankings")
      .select("visibility_score")
      .eq("tenant_id", tenantId)
      .eq("status", "success")
      .not("visibility_score", "is", null);

    const averageVisibilityScore = visibilityData && visibilityData.length > 0
      ? visibilityData.reduce((sum: number, r: { visibility_score: number | null }) => sum + (r.visibility_score || 0), 0) / visibilityData.length
      : null;

    // Get top improving keywords (positive rank_change)
    const { data: improvingKeywords } = await supabase
      .from("pulse_rankings")
      .select("keyword, rank_change")
      .eq("tenant_id", tenantId)
      .not("rank_change", "is", null)
      .gt("rank_change", 0)
      .order("rank_change", { ascending: false })
      .limit(5);

    const topImprovingKeywords = (improvingKeywords || []).map((item: { keyword: string; rank_change: number }) => ({
      keyword: item.keyword,
      rank_change: item.rank_change
    }));

    return {
      averageRank,
      averageVisibilityScore,
      topImprovingKeywords
    };
  } catch (error) {
    console.error("Error fetching PULSE stats:", error);
    return null;
  }
}

/**
 * Get LOCL agent stats
 */
export async function getLOCLStats(tenantId: string): Promise<LOCLStats | null> {
  try {
    const supabase = createSupabaseBrowserClient();

    // Get latest audit
    const { data: latestAudit } = await supabase
      .from("locl_audits")
      .select("optimization_score, completeness_score, recommendations")
      .eq("tenant_id", tenantId)
      .order("checked_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!latestAudit) {
      return {
        optimizationScore: null,
        completenessScore: null,
        recommendations: []
      };
    }

    return {
      optimizationScore: latestAudit.optimization_score,
      completenessScore: latestAudit.completeness_score,
      recommendations: latestAudit.recommendations as string[]
    };
  } catch (error) {
    console.error("Error fetching LOCL stats:", error);
    return null;
  }
}

/**
 * Get agent status for all agents
 * MIGRATED: Now uses canonical agent_executions table (Phase 2B)
 */
export async function getAgentStatus(tenantId: string): Promise<AgentStatus[]> {
  try {
    const supabase = createSupabaseBrowserClient();

    // REMOVED: Query from deprecated agent_states table
    // Using canonical agent_executions table instead
    const { data: executions } = await supabase
      .from("agent_executions")
      .select("agent_name, status, updated_at")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });

    if (!executions) return [];

    // Group by agent and get latest status per agent
    const agentStatusMap = new Map<string, AgentStatus>();
    executions.forEach((exec: { agent_name: string; status: string; updated_at: string }) => {
      if (!agentStatusMap.has(exec.agent_name)) {
        agentStatusMap.set(exec.agent_name, {
          agent: exec.agent_name,
          status: exec.status,
          lastRun: exec.updated_at
        });
      }
    });

    return Array.from(agentStatusMap.values());
  } catch (error) {
    console.error("Error fetching agent status:", error);
    return [];
  }
}

/**
 * Get activity feed (latest 20 events)
 * MIGRATED: Now uses canonical agent_events table (Phase 2B)
 */
export async function getActivityFeed(tenantId: string): Promise<ActivityFeedItem[]> {
  try {
    const supabase = createSupabaseBrowserClient();

    // REMOVED: Query from deprecated agent_activities table
    // Using canonical agent_events table instead
    const { data: events } = await supabase
      .from("agent_events")
      .select("event_name, event_source, payload, created_at")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (!events) return [];

    return events.map((event: { event_name: string; event_source: string; payload: Record<string, unknown>; created_at: string }) => ({
      agent: event.event_source,
      status: "event",
      message: event.event_name,
      timestamp: event.created_at
    }));
  } catch (error) {
    console.error("Error fetching activity feed:", error);
    return [];
  }
}
