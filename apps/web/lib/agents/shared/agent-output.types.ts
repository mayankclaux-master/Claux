/**
 * CLAUX V1 Canonical Agent Output Types
 * Simple, deterministic types for agent outputs
 * NO abstractions, NO enterprise patterns
 */

/**
 * ARIA Output
 */
export interface AriaOutput {
  total_keywords: number;
  keywords: Array<{
    keyword: string;
    search_volume: number;
    difficulty: number;
    opportunity_score: number;
  }>;
}

/**
 * SCRIBE Output
 */
export interface ScribeOutput {
  title: string;
  slug: string;
  content: string;
  word_count: number;
  meta_title: string;
  meta_description: string;
  schema_json: Record<string, unknown>;
  internal_links: Array<{
    url: string;
    anchor_text: string;
  }>;
  featured_image_prompt: string;
  cta_recommendations: string[];
}

/**
 * PUBLISH Output
 */
export interface PublishOutput {
  publishing_package: {
    title: string;
    slug: string;
    meta_title: string;
    meta_description: string;
    schema_json: Record<string, unknown>;
    internal_links: Array<{
      url: string;
      anchor_text: string;
    }>;
    featured_image_prompt: string;
    categories: string[];
    cta_recommendations: string[];
  };
}

/**
 * PULSE Output
 */
export interface PulseOutput {
  ranking_changes: Array<{
    keyword: string;
    current_position: number;
    previous_position: number;
    change: number;
  }>;
  visibility_score: number;
  average_position: number;
}

/**
 * LOCL Output
 */
export interface LoclOutput {
  gmb_optimization_score: number;
  citation_opportunities: Array<{
    source: string;
    url: string;
    priority: string;
  }>;
  local_ranking: number;
}

/**
 * REPUTE Output
 */
export interface ReputeOutput {
  reviews_pending_reply: number;
  sentiment_trends: {
    positive: number;
    neutral: number;
    negative: number;
  };
  average_rating: number;
  total_reviews: number;
}

/**
 * LINX Output
 */
export interface LinxOutput {
  backlink_opportunities: Array<{
    target_domain: string;
    domain_authority: number;
    relevance_score: number;
  }>;
  outreach_targets: Array<{
    domain: string;
    email: string;
    template: string;
  }>;
  domain_authority: number;
}

/**
 * PRISM Output
 */
export interface PrismOutput {
  traffic_analytics: {
    sessions: number;
    users: number;
    page_views: number;
  };
  conversion_summaries: {
    conversion_rate: number;
    total_conversions: number;
  };
  bounce_rate: number;
}

/**
 * CORE Output
 */
export interface CoreOutput {
  technical_health: number;
  schema_issues: Array<{
    url: string;
    issue_type: string;
    severity: string;
  }>;
  crawl_issues: Array<{
    url: string;
    issue_type: string;
    severity: string;
  }>;
  total_pages_audited: number;
}
