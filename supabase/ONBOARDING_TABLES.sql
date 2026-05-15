-- Onboarding Tables for Phase 1B
-- Tenant onboarding and website asset ingestion

CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS business_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  website_url TEXT NOT NULL,
  category TEXT NOT NULL,
  brand_voice TEXT,
  publishing_preferences JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id)
);

CREATE TABLE IF NOT EXISTS gsc_credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  site_url TEXT NOT NULL,
  property_id TEXT,
  api_key TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id)
);

CREATE TABLE IF NOT EXISTS credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  credential_type TEXT NOT NULL,
  credential_data JSONB NOT NULL,
  encrypted BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, credential_type)
);

CREATE TABLE IF NOT EXISTS sitemaps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  website_url TEXT NOT NULL,
  sitemap_url TEXT NOT NULL,
  total_entries INTEGER,
  last_crawled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, website_url)
);

CREATE TABLE IF NOT EXISTS pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  website_url TEXT NOT NULL,
  title TEXT,
  description TEXT,
  headings TEXT[],
  internal_links TEXT[],
  word_count INTEGER,
  status TEXT DEFAULT 'pending',
  last_crawled_at TIMESTAMPTZ,
  last_modified TEXT,
  change_frequency TEXT,
  priority DECIMAL(3, 2),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, url)
);

CREATE TABLE IF NOT EXISTS ranking_seeds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  seed_type TEXT NOT NULL,
  opportunity_score DECIMAL(10, 2),
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ranking_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  position INTEGER,
  search_volume INTEGER,
  difficulty INTEGER,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ranking_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  previous_position INTEGER,
  current_position INTEGER,
  movement INTEGER,
  movement_type TEXT NOT NULL,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ranking_volatility (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  volatility_score DECIMAL(10, 2),
  volatility_level TEXT NOT NULL,
  period_days INTEGER,
  calculated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tenants_created ON tenants(created_at);
CREATE INDEX IF NOT EXISTS idx_workspaces_tenant ON workspaces(tenant_id);
CREATE INDEX IF NOT EXISTS idx_business_profiles_tenant ON business_profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sitemaps_tenant ON sitemaps(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pages_tenant ON pages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pages_status ON pages(status);
CREATE INDEX IF NOT EXISTS idx_ranking_seeds_tenant ON ranking_seeds(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ranking_history_tenant_keyword ON ranking_history(tenant_id, keyword);
CREATE INDEX IF NOT EXISTS idx_ranking_history_recorded ON ranking_history(recorded_at);
CREATE INDEX IF NOT EXISTS idx_ranking_movements_tenant ON ranking_movements(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ranking_volatility_tenant ON ranking_volatility(tenant_id);

-- RLS
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE gsc_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE sitemaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ranking_seeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE ranking_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE ranking_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE ranking_volatility ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own tenant data" ON tenants FOR SELECT USING (id = current_setting('app.current_tenant')::TEXT);
CREATE POLICY "Users can view own workspace data" ON workspaces FOR SELECT USING (tenant_id = current_setting('app.current_tenant')::TEXT);
CREATE POLICY "Users can view own business profiles" ON business_profiles FOR SELECT USING (tenant_id = current_setting('app.current_tenant')::TEXT);
CREATE POLICY "Users can view own sitemaps" ON sitemaps FOR SELECT USING (tenant_id = current_setting('app.current_tenant')::TEXT);
CREATE POLICY "Users can view own pages" ON pages FOR SELECT USING (tenant_id = current_setting('app.current_tenant')::TEXT);
CREATE POLICY "Users can view own ranking seeds" ON ranking_seeds FOR SELECT USING (tenant_id = current_setting('app.current_tenant')::TEXT);
CREATE POLICY "Users can view own ranking history" ON ranking_history FOR SELECT USING (tenant_id = current_setting('app.current_tenant')::TEXT);
CREATE POLICY "Users can view own ranking movements" ON ranking_movements FOR SELECT USING (tenant_id = current_setting('app.current_tenant')::TEXT);
CREATE POLICY "Users can view own ranking volatility" ON ranking_volatility FOR SELECT USING (tenant_id = current_setting('app.current_tenant')::TEXT);
