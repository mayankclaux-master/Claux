/**
 * CLAUX V1 Canonical Dashboard Types
 * Simple, deterministic types for dashboard metrics
 * NO abstractions, NO enterprise patterns
 */

/**
 * ARIA Dashboard Metrics
 */
export interface AriaDashboardMetrics {
  keyword_opportunities: number;
  keyword_difficulty: number;
  ranking_movement: number;
  total_keywords: number;
}

/**
 * SCRIBE Dashboard Metrics
 */
export interface ScribeDashboardMetrics {
  content_generated: number;
  content_score: number;
  publishing_readiness: number;
  word_count: number;
}

/**
 * PUBLISH Dashboard Metrics
 */
export interface PublishDashboardMetrics {
  publishing_packages_ready: number;
  metadata_generated: number;
  schema_generated: number;
  image_prompts_generated: number;
}

/**
 * PULSE Dashboard Metrics
 */
export interface PulseDashboardMetrics {
  ranking_changes: number;
  visibility_movement: number;
  average_position: number;
  total_keywords_tracked: number;
}

/**
 * LOCL Dashboard Metrics
 */
export interface LoclDashboardMetrics {
  gmb_optimization_score: number;
  citation_opportunities: number;
  local_ranking: number;
  total_locations: number;
}

/**
 * REPUTE Dashboard Metrics
 */
export interface ReputeDashboardMetrics {
  reviews_pending_reply: number;
  sentiment_trends: number;
  average_rating: number;
  total_reviews: number;
}

/**
 * LINX Dashboard Metrics
 */
export interface LinxDashboardMetrics {
  backlink_opportunities: number;
  outreach_targets: number;
  domain_authority: number;
  total_backlinks: number;
}

/**
 * PRISM Dashboard Metrics
 */
export interface PrismDashboardMetrics {
  traffic_analytics: number;
  conversion_summaries: number;
  bounce_rate: number;
  total_sessions: number;
}

/**
 * CORE Dashboard Metrics
 */
export interface CoreDashboardMetrics {
  technical_health: number;
  schema_issues: number;
  crawl_issues: number;
  total_pages_audited: number;
}
