-- Phase 6B: Live Data Persistence Pipeline
-- Canonical snapshot tables for historical SEO intelligence
-- All tables are append-only, multitenant, and support trend analysis

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. SERP Snapshots
-- ============================================
CREATE TABLE IF NOT EXISTS serp_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  trace_id UUID NOT NULL,
  execution_id UUID NOT NULL,
  keyword TEXT NOT NULL,
  location TEXT NOT NULL,
  language TEXT NOT NULL,
  rankings JSONB NOT NULL,
  featured_snippet JSONB,
  ai_overview JSONB,
  total_results INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT serp_snapshots_tenant_fk FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_serp_snapshots_tenant_id ON serp_snapshots(tenant_id);
CREATE INDEX IF NOT EXISTS idx_serp_snapshots_execution_id ON serp_snapshots(execution_id);
CREATE INDEX IF NOT EXISTS idx_serp_snapshots_keyword ON serp_snapshots(keyword);
CREATE INDEX IF NOT EXISTS idx_serp_snapshots_created_at ON serp_snapshots(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_serp_snapshots_tenant_created ON serp_snapshots(tenant_id, created_at DESC);

-- RLS Policy
ALTER TABLE serp_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant can view own serp snapshots" ON serp_snapshots
  FOR SELECT USING (tenant_id = auth.uid());
CREATE POLICY "Tenant can insert own serp snapshots" ON serp_snapshots
  FOR INSERT WITH CHECK (tenant_id = auth.uid());

-- ============================================
-- 2. Ranking History
-- ============================================
CREATE TABLE IF NOT EXISTS ranking_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  trace_id UUID NOT NULL,
  execution_id UUID NOT NULL,
  keyword TEXT NOT NULL,
  url TEXT NOT NULL,
  position INTEGER NOT NULL,
  previous_position INTEGER,
  change INTEGER,
  title TEXT,
  snippet TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT ranking_history_tenant_fk FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ranking_history_tenant_id ON ranking_history(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ranking_history_execution_id ON ranking_history(execution_id);
CREATE INDEX IF NOT EXISTS idx_ranking_history_keyword ON ranking_history(keyword);
CREATE INDEX IF NOT EXISTS idx_ranking_history_url ON ranking_history(url);
CREATE INDEX IF NOT EXISTS idx_ranking_history_created_at ON ranking_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ranking_history_tenant_keyword_created ON ranking_history(tenant_id, keyword, created_at DESC);

-- RLS Policy
ALTER TABLE ranking_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant can view own ranking history" ON ranking_history
  FOR SELECT USING (tenant_id = auth.uid());
CREATE POLICY "Tenant can insert own ranking history" ON ranking_history
  FOR INSERT WITH CHECK (tenant_id = auth.uid());

-- ============================================
-- 3. Backlink Snapshots
-- ============================================
CREATE TABLE IF NOT EXISTS backlink_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  trace_id UUID NOT NULL,
  execution_id UUID NOT NULL,
  target_url TEXT NOT NULL,
  source_domain TEXT NOT NULL,
  source_url TEXT NOT NULL,
  domain_authority INTEGER,
  page_authority INTEGER,
  dofollow BOOLEAN NOT NULL,
  anchor_text TEXT,
  link_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT backlink_snapshots_tenant_fk FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_backlink_snapshots_tenant_id ON backlink_snapshots(tenant_id);
CREATE INDEX IF NOT EXISTS idx_backlink_snapshots_execution_id ON backlink_snapshots(execution_id);
CREATE INDEX IF NOT EXISTS idx_backlink_snapshots_target_url ON backlink_snapshots(target_url);
CREATE INDEX IF NOT EXISTS idx_backlink_snapshots_source_domain ON backlink_snapshots(source_domain);
CREATE INDEX IF NOT EXISTS idx_backlink_snapshots_created_at ON backlink_snapshots(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_backlink_snapshots_tenant_target_created ON backlink_snapshots(tenant_id, target_url, created_at DESC);

-- RLS Policy
ALTER TABLE backlink_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant can view own backlink snapshots" ON backlink_snapshots
  FOR SELECT USING (tenant_id = auth.uid());
CREATE POLICY "Tenant can insert own backlink snapshots" ON backlink_snapshots
  FOR INSERT WITH CHECK (tenant_id = auth.uid());

-- ============================================
-- 4. Technical Audit Snapshots
-- ============================================
CREATE TABLE IF NOT EXISTS technical_audit_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  trace_id UUID NOT NULL,
  execution_id UUID NOT NULL,
  url TEXT NOT NULL,
  crawl_id TEXT,
  status_code INTEGER,
  title TEXT,
  meta_description TEXT,
  h1 TEXT,
  h2 TEXT,
  canonical TEXT,
  indexability TEXT,
  technical_health_score INTEGER,
  issues JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT technical_audit_snapshots_tenant_fk FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_technical_audit_snapshots_tenant_id ON technical_audit_snapshots(tenant_id);
CREATE INDEX IF NOT EXISTS idx_technical_audit_snapshots_execution_id ON technical_audit_snapshots(execution_id);
CREATE INDEX IF NOT EXISTS idx_technical_audit_snapshots_url ON technical_audit_snapshots(url);
CREATE INDEX IF NOT EXISTS idx_technical_audit_snapshots_crawl_id ON technical_audit_snapshots(crawl_id);
CREATE INDEX IF NOT EXISTS idx_technical_audit_snapshots_created_at ON technical_audit_snapshots(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_technical_audit_snapshots_tenant_url_created ON technical_audit_snapshots(tenant_id, url, created_at DESC);

-- RLS Policy
ALTER TABLE technical_audit_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant can view own technical audit snapshots" ON technical_audit_snapshots
  FOR SELECT USING (tenant_id = auth.uid());
CREATE POLICY "Tenant can insert own technical audit snapshots" ON technical_audit_snapshots
  FOR INSERT WITH CHECK (tenant_id = auth.uid());

-- ============================================
-- 5. GA4 Snapshots
-- ============================================
CREATE TABLE IF NOT EXISTS ga4_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  trace_id UUID NOT NULL,
  execution_id UUID NOT NULL,
  property_id TEXT NOT NULL,
  date_range_start DATE NOT NULL,
  date_range_end DATE NOT NULL,
  sessions INTEGER,
  users INTEGER,
  pageviews INTEGER,
  bounce_rate NUMERIC,
  avg_session_duration NUMERIC,
  conversions INTEGER,
  traffic_sources JSONB,
  top_pages JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT ga4_snapshots_tenant_fk FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ga4_snapshots_tenant_id ON ga4_snapshots(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ga4_snapshots_execution_id ON ga4_snapshots(execution_id);
CREATE INDEX IF NOT EXISTS idx_ga4_snapshots_property_id ON ga4_snapshots(property_id);
CREATE INDEX IF NOT EXISTS idx_ga4_snapshots_date_range ON ga4_snapshots(date_range_start, date_range_end);
CREATE INDEX IF NOT EXISTS idx_ga4_snapshots_created_at ON ga4_snapshots(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ga4_snapshots_tenant_property_created ON ga4_snapshots(tenant_id, property_id, created_at DESC);

-- RLS Policy
ALTER TABLE ga4_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant can view own ga4 snapshots" ON ga4_snapshots
  FOR SELECT USING (tenant_id = auth.uid());
CREATE POLICY "Tenant can insert own ga4 snapshots" ON ga4_snapshots
  FOR INSERT WITH CHECK (tenant_id = auth.uid());

-- ============================================
-- 6. GSC Snapshots
-- ============================================
CREATE TABLE IF NOT EXISTS gsc_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  trace_id UUID NOT NULL,
  execution_id UUID NOT NULL,
  site_url TEXT NOT NULL,
  date_range_start DATE NOT NULL,
  date_range_end DATE NOT NULL,
  clicks INTEGER,
  impressions INTEGER,
  ctr NUMERIC,
  avg_position NUMERIC,
  queries JSONB,
  pages JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT gsc_snapshots_tenant_fk FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_gsc_snapshots_tenant_id ON gsc_snapshots(tenant_id);
CREATE INDEX IF NOT EXISTS idx_gsc_snapshots_execution_id ON gsc_snapshots(execution_id);
CREATE INDEX IF NOT EXISTS idx_gsc_snapshots_site_url ON gsc_snapshots(site_url);
CREATE INDEX IF NOT EXISTS idx_gsc_snapshots_date_range ON gsc_snapshots(date_range_start, date_range_end);
CREATE INDEX IF NOT EXISTS idx_gsc_snapshots_created_at ON gsc_snapshots(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gsc_snapshots_tenant_site_created ON gsc_snapshots(tenant_id, site_url, created_at DESC);

-- RLS Policy
ALTER TABLE gsc_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant can view own gsc snapshots" ON gsc_snapshots
  FOR SELECT USING (tenant_id = auth.uid());
CREATE POLICY "Tenant can insert own gsc snapshots" ON gsc_snapshots
  FOR INSERT WITH CHECK (tenant_id = auth.uid());

-- ============================================
-- 7. Review Snapshots
-- ============================================
CREATE TABLE IF NOT EXISTS review_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  trace_id UUID NOT NULL,
  execution_id UUID NOT NULL,
  platform TEXT NOT NULL,
  location_id TEXT,
  location_name TEXT,
  total_reviews INTEGER,
  average_rating NUMERIC,
  rating_distribution JSONB,
  recent_reviews JSONB,
  sentiment_score NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT review_snapshots_tenant_fk FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_review_snapshots_tenant_id ON review_snapshots(tenant_id);
CREATE INDEX IF NOT EXISTS idx_review_snapshots_execution_id ON review_snapshots(execution_id);
CREATE INDEX IF NOT EXISTS idx_review_snapshots_platform ON review_snapshots(platform);
CREATE INDEX IF NOT EXISTS idx_review_snapshots_location_id ON review_snapshots(location_id);
CREATE INDEX IF NOT EXISTS idx_review_snapshots_created_at ON review_snapshots(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_review_snapshots_tenant_platform_created ON review_snapshots(tenant_id, platform, created_at DESC);

-- RLS Policy
ALTER TABLE review_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant can view own review snapshots" ON review_snapshots
  FOR SELECT USING (tenant_id = auth.uid());
CREATE POLICY "Tenant can insert own review snapshots" ON review_snapshots
  FOR INSERT WITH CHECK (tenant_id = auth.uid());

-- ============================================
-- 8. AI Visibility Snapshots
-- ============================================
CREATE TABLE IF NOT EXISTS ai_visibility_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  trace_id UUID NOT NULL,
  execution_id UUID NOT NULL,
  keyword TEXT NOT NULL,
  location TEXT NOT NULL,
  ai_overview_present BOOLEAN,
  ai_overview_text TEXT,
  ai_overview_sources JSONB,
  featured_snippet_present BOOLEAN,
  featured_snippet_text TEXT,
  ai_visibility_score INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT ai_visibility_snapshots_tenant_fk FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_visibility_snapshots_tenant_id ON ai_visibility_snapshots(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ai_visibility_snapshots_execution_id ON ai_visibility_snapshots(execution_id);
CREATE INDEX IF NOT EXISTS idx_ai_visibility_snapshots_keyword ON ai_visibility_snapshots(keyword);
CREATE INDEX IF NOT EXISTS idx_ai_visibility_snapshots_ai_overview_present ON ai_visibility_snapshots(ai_overview_present);
CREATE INDEX IF NOT EXISTS idx_ai_visibility_snapshots_created_at ON ai_visibility_snapshots(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_visibility_snapshots_tenant_keyword_created ON ai_visibility_snapshots(tenant_id, keyword, created_at DESC);

-- RLS Policy
ALTER TABLE ai_visibility_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant can view own ai visibility snapshots" ON ai_visibility_snapshots
  FOR SELECT USING (tenant_id = auth.uid());
CREATE POLICY "Tenant can insert own ai visibility snapshots" ON ai_visibility_snapshots
  FOR INSERT WITH CHECK (tenant_id = auth.uid());

-- ============================================
-- 9. Keyword Universe History
-- ============================================
CREATE TABLE IF NOT EXISTS keyword_universe_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  trace_id UUID NOT NULL,
  execution_id UUID NOT NULL,
  keyword TEXT NOT NULL,
  location TEXT NOT NULL,
  language TEXT NOT NULL,
  search_volume INTEGER,
  keyword_difficulty INTEGER,
  cpc NUMERIC,
  search_intent TEXT,
  opportunity_score INTEGER,
  competition_score INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT keyword_universe_history_tenant_fk FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_keyword_universe_history_tenant_id ON keyword_universe_history(tenant_id);
CREATE INDEX IF NOT EXISTS idx_keyword_universe_history_execution_id ON keyword_universe_history(execution_id);
CREATE INDEX IF NOT EXISTS idx_keyword_universe_history_keyword ON keyword_universe_history(keyword);
CREATE INDEX IF NOT EXISTS idx_keyword_universe_history_location ON keyword_universe_history(location);
CREATE INDEX IF NOT EXISTS idx_keyword_universe_history_created_at ON keyword_universe_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_keyword_universe_history_tenant_keyword_created ON keyword_universe_history(tenant_id, keyword, created_at DESC);

-- RLS Policy
ALTER TABLE keyword_universe_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant can view own keyword universe history" ON keyword_universe_history
  FOR SELECT USING (tenant_id = auth.uid());
CREATE POLICY "Tenant can insert own keyword universe history" ON keyword_universe_history
  FOR INSERT WITH CHECK (tenant_id = auth.uid());

-- ============================================
-- 10. Execution Artifacts
-- ============================================
CREATE TABLE IF NOT EXISTS execution_artifacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  trace_id UUID NOT NULL,
  execution_id UUID NOT NULL,
  agent_name TEXT NOT NULL,
  artifact_type TEXT NOT NULL,
  artifact_name TEXT NOT NULL,
  artifact_data JSONB NOT NULL,
  artifact_size_bytes INTEGER,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT execution_artifacts_tenant_fk FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_execution_artifacts_tenant_id ON execution_artifacts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_execution_artifacts_execution_id ON execution_artifacts(execution_id);
CREATE INDEX IF NOT EXISTS idx_execution_artifacts_agent_name ON execution_artifacts(agent_name);
CREATE INDEX IF NOT EXISTS idx_execution_artifacts_artifact_type ON execution_artifacts(artifact_type);
CREATE INDEX IF NOT EXISTS idx_execution_artifacts_created_at ON execution_artifacts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_execution_artifacts_tenant_execution_created ON execution_artifacts(tenant_id, execution_id, created_at DESC);

-- RLS Policy
ALTER TABLE execution_artifacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant can view own execution artifacts" ON execution_artifacts
  FOR SELECT USING (tenant_id = auth.uid());
CREATE POLICY "Tenant can insert own execution artifacts" ON execution_artifacts
  FOR INSERT WITH CHECK (tenant_id = auth.uid());

-- ============================================
-- Comments for documentation
-- ============================================
COMMENT ON TABLE serp_snapshots IS 'SERP snapshot history for ranking tracking';
COMMENT ON TABLE ranking_history IS 'Historical ranking positions for trend analysis';
COMMENT ON TABLE backlink_snapshots IS 'Backlink profile snapshots for link building tracking';
COMMENT ON TABLE technical_audit_snapshots IS 'Technical SEO audit snapshots for health tracking';
COMMENT ON TABLE ga4_snapshots IS 'GA4 metric snapshots for traffic analysis';
COMMENT ON TABLE gsc_snapshots IS 'Google Search Console metric snapshots for search analysis';
COMMENT ON TABLE review_snapshots IS 'Review snapshots for reputation tracking';
COMMENT ON TABLE ai_visibility_snapshots IS 'AI visibility snapshots for SGE/AI overview tracking';
COMMENT ON TABLE keyword_universe_history IS 'Keyword universe history for opportunity tracking';
COMMENT ON TABLE execution_artifacts IS 'Execution artifacts for intelligence persistence';
