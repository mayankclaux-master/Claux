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
  gmb_profile: {
    business_name: string;
    location: string;
    review_count: number;
    average_rating: number;
    photos_count: number;
    posts_count: number;
    categories: string[];
  };
  gmb_recommendations: Array<{
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    action: string;
    impact: string;
  }>;
  citation_opportunities: Array<{
    source: string;
    url: string;
    status: 'missing' | 'inconsistent' | 'verified';
  }>;
  local_visibility_score: number;
  total_locations: number;
}

/**
 * REPUTE Output
 */
export interface ReputeOutput {
  new_reviews: Array<{
    id: string;
    author: string;
    rating: number;
    text: string;
    date: string;
    sentiment: string;
    suggested_reply: string;
  }>;
  sentiment_score: number;
  average_rating: number;
  review_velocity: number;
  total_reviews: number;
  platform: string;
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
    total_sessions: number;
    organic_traffic: number;
    direct_traffic: number;
    referral_traffic: number;
    social_traffic: number;
    bounce_rate: number;
    avg_session_duration: number;
    conversion_rate: number;
  };
  traffic_anomalies: Array<{
    page: string;
    type: string;
    change_percentage: number;
    severity: string;
    description: string;
  }>;
  top_pages: Array<{
    page: string;
    sessions: number;
    bounce_rate: number;
    avg_position: number;
  }>;
  property_id: string;
  date_range: string;
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
