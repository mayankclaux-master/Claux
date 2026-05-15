-- CLAUX Runtime Tables
-- Canonical tenant-safe tables for ARIA and SCRIBE agents
-- Phase 1A - Runtime Consolidation + ARIA/SCRIBE Productionization

-- *** DEPRECATED - DO NOT USE ***
-- This file contains the runtime_executions system which has been deprecated
-- in favor of the canonical agent_executions system (see migrations folder)
-- The runtime_executions system is frozen and should not be used for new development
-- All new execution should use agent_executions/agent_tasks/agent_events/agent_logs tables
-- This file is preserved for rollback capability only
-- *** DEPRECATED - DO NOT USE ***

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Runtime Workflows Table
CREATE TABLE IF NOT EXISTS runtime_workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id TEXT NOT NULL,
  workflow_name TEXT NOT NULL,
  workflow_type TEXT NOT NULL,
  agent_name TEXT NOT NULL,
  version TEXT NOT NULL,
  description TEXT,
  workflow_definition JSONB NOT NULL,
  tenant_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, workflow_id)
);

-- Runtime Tasks Table
CREATE TABLE IF NOT EXISTS runtime_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  execution_id UUID NOT NULL REFERENCES runtime_executions(id) ON DELETE CASCADE,
  task_id TEXT NOT NULL,
  task_name TEXT NOT NULL,
  task_type TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  input_payload JSONB,
  output_payload JSONB,
  error_payload JSONB,
  step_order INTEGER NOT NULL,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  tenant_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Runtime Executions Table
CREATE TABLE IF NOT EXISTS runtime_executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id TEXT NOT NULL,
  agent_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  execution_source TEXT NOT NULL DEFAULT 'manual',
  initiated_by TEXT,
  metadata JSONB,
  total_cost DECIMAL(10, 2) DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  error_message TEXT,
  tenant_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Runtime Thinking Logs Table
CREATE TABLE IF NOT EXISTS runtime_thinking_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  execution_id UUID NOT NULL REFERENCES runtime_executions(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL,
  agent_name TEXT NOT NULL,
  task_id UUID REFERENCES runtime_tasks(id) ON DELETE SET NULL,
  step TEXT NOT NULL,
  thought TEXT NOT NULL,
  reasoning TEXT NOT NULL,
  confidence DECIMAL(5, 2),
  metadata JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Runtime Artifacts Table
CREATE TABLE IF NOT EXISTS runtime_artifacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  execution_id UUID NOT NULL REFERENCES runtime_executions(id) ON DELETE CASCADE,
  artifact_type TEXT NOT NULL,
  artifact_name TEXT NOT NULL,
  artifact_data JSONB NOT NULL,
  artifact_url TEXT,
  tenant_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SEO Keywords Table
CREATE TABLE IF NOT EXISTS seo_keywords (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id TEXT NOT NULL,
  execution_id UUID REFERENCES runtime_executions(id) ON DELETE SET NULL,
  keyword TEXT NOT NULL,
  search_volume INTEGER NOT NULL,
  difficulty INTEGER NOT NULL,
  intent TEXT NOT NULL,
  opportunity_score DECIMAL(10, 2),
  cluster_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, keyword)
);

-- SEO Clusters Table
CREATE TABLE IF NOT EXISTS seo_clusters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id TEXT NOT NULL,
  cluster_id TEXT NOT NULL,
  cluster_name TEXT NOT NULL,
  cluster_type TEXT NOT NULL,
  keywords JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, cluster_id)
);

-- SEO Content Briefs Table
CREATE TABLE IF NOT EXISTS seo_content_briefs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id TEXT NOT NULL,
  execution_id UUID REFERENCES runtime_executions(id) ON DELETE SET NULL,
  keyword TEXT NOT NULL,
  intent TEXT NOT NULL,
  opportunity_score DECIMAL(10, 2),
  brief TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  target_keywords TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SEO Drafts Table
CREATE TABLE IF NOT EXISTS seo_drafts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id TEXT NOT NULL,
  execution_id UUID REFERENCES runtime_executions(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  body_html TEXT NOT NULL,
  meta_title TEXT,
  meta_description TEXT,
  meta_keywords TEXT[],
  schema_json JSONB,
  word_count INTEGER NOT NULL,
  quality_score DECIMAL(5, 2),
  readability_score DECIMAL(5, 2),
  seo_score DECIMAL(5, 2),
  status TEXT NOT NULL DEFAULT 'draft',
  target_keywords TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SEO Reports Table
CREATE TABLE IF NOT EXISTS seo_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id TEXT NOT NULL,
  execution_id UUID REFERENCES runtime_executions(id) ON DELETE SET NULL,
  report_type TEXT NOT NULL,
  report_data JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_runtime_executions_tenant ON runtime_executions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_runtime_executions_status ON runtime_executions(status);
CREATE INDEX IF NOT EXISTS idx_runtime_executions_workflow ON runtime_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_runtime_tasks_execution ON runtime_tasks(execution_id);
CREATE INDEX IF NOT EXISTS idx_runtime_tasks_tenant ON runtime_tasks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_runtime_tasks_status ON runtime_tasks(status);
CREATE INDEX IF NOT EXISTS idx_runtime_thinking_logs_execution ON runtime_thinking_logs(execution_id);
CREATE INDEX IF NOT EXISTS idx_runtime_thinking_logs_tenant ON runtime_thinking_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_runtime_artifacts_execution ON runtime_artifacts(execution_id);
CREATE INDEX IF NOT EXISTS idx_runtime_artifacts_tenant ON runtime_artifacts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_seo_keywords_tenant ON seo_keywords(tenant_id);
CREATE INDEX IF NOT EXISTS idx_seo_keywords_execution ON seo_keywords(execution_id);
CREATE INDEX IF NOT EXISTS idx_seo_keywords_intent ON seo_keywords(intent);
CREATE INDEX IF NOT EXISTS idx_seo_clusters_tenant ON seo_clusters(tenant_id);
CREATE INDEX IF NOT EXISTS idx_seo_content_briefs_tenant ON seo_content_briefs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_seo_content_briefs_status ON seo_content_briefs(status);
CREATE INDEX IF NOT EXISTS idx_seo_drafts_tenant ON seo_drafts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_seo_drafts_status ON seo_drafts(status);
CREATE INDEX IF NOT EXISTS idx_seo_reports_tenant ON seo_reports(tenant_id);

-- Row Level Security (RLS) for multi-tenant isolation
ALTER TABLE runtime_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE runtime_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE runtime_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE runtime_thinking_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE runtime_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_content_briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own tenant data" ON runtime_workflows
  FOR SELECT USING (tenant_id = current_setting('app.current_tenant')::TEXT);

CREATE POLICY "Users can insert own tenant data" ON runtime_workflows
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant')::TEXT);

CREATE POLICY "Users can update own tenant data" ON runtime_workflows
  FOR UPDATE USING (tenant_id = current_setting('app.current_tenant')::TEXT);

CREATE POLICY "Users can delete own tenant data" ON runtime_workflows
  FOR DELETE USING (tenant_id = current_setting('app.current_tenant')::TEXT);

-- Apply similar policies to all tables
CREATE POLICY "Users can view own tenant data" ON runtime_tasks
  FOR SELECT USING (tenant_id = current_setting('app.current_tenant')::TEXT);

CREATE POLICY "Users can insert own tenant data" ON runtime_tasks
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant')::TEXT);

CREATE POLICY "Users can update own tenant data" ON runtime_tasks
  FOR UPDATE USING (tenant_id = current_setting('app.current_tenant')::TEXT);

CREATE POLICY "Users can delete own tenant data" ON runtime_tasks
  FOR DELETE USING (tenant_id = current_setting('app.current_tenant')::TEXT);

CREATE POLICY "Users can view own tenant data" ON runtime_executions
  FOR SELECT USING (tenant_id = current_setting('app.current_tenant')::TEXT);

CREATE POLICY "Users can insert own tenant data" ON runtime_executions
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant')::TEXT);

CREATE POLICY "Users can update own tenant data" ON runtime_executions
  FOR UPDATE USING (tenant_id = current_setting('app.current_tenant')::TEXT);

CREATE POLICY "Users can delete own tenant data" ON runtime_executions
  FOR DELETE USING (tenant_id = current_setting('app.current_tenant')::TEXT);

CREATE POLICY "Users can view own tenant data" ON runtime_thinking_logs
  FOR SELECT USING (tenant_id = current_setting('app.current_tenant')::TEXT);

CREATE POLICY "Users can insert own tenant data" ON runtime_thinking_logs
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant')::TEXT);

CREATE POLICY "Users can view own tenant data" ON runtime_artifacts
  FOR SELECT USING (tenant_id = current_setting('app.current_tenant')::TEXT);

CREATE POLICY "Users can insert own tenant data" ON runtime_artifacts
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant')::TEXT);

CREATE POLICY "Users can view own tenant data" ON seo_keywords
  FOR SELECT USING (tenant_id = current_setting('app.current_tenant')::TEXT);

CREATE POLICY "Users can insert own tenant data" ON seo_keywords
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant')::TEXT);

CREATE POLICY "Users can update own tenant data" ON seo_keywords
  FOR UPDATE USING (tenant_id = current_setting('app.current_tenant')::TEXT);

CREATE POLICY "Users can view own tenant data" ON seo_clusters
  FOR SELECT USING (tenant_id = current_setting('app.current_tenant')::TEXT);

CREATE POLICY "Users can insert own tenant data" ON seo_clusters
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant')::TEXT);

CREATE POLICY "Users can view own tenant data" ON seo_content_briefs
  FOR SELECT USING (tenant_id = current_setting('app.current_tenant')::TEXT);

CREATE POLICY "Users can insert own tenant data" ON seo_content_briefs
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant')::TEXT);

CREATE POLICY "Users can update own tenant data" ON seo_content_briefs
  FOR UPDATE USING (tenant_id = current_setting('app.current_tenant')::TEXT);

CREATE POLICY "Users can view own tenant data" ON seo_drafts
  FOR SELECT USING (tenant_id = current_setting('app.current_tenant')::TEXT);

CREATE POLICY "Users can insert own tenant data" ON seo_drafts
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant')::TEXT);

CREATE POLICY "Users can update own tenant data" ON seo_drafts
  FOR UPDATE USING (tenant_id = current_setting('app.current_tenant')::TEXT);

CREATE POLICY "Users can view own tenant data" ON seo_reports
  FOR SELECT USING (tenant_id = current_setting('app.current_tenant')::TEXT);

CREATE POLICY "Users can insert own tenant data" ON seo_reports
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant')::TEXT);

CREATE POLICY "Users can update own tenant data" ON seo_reports
  FOR UPDATE USING (tenant_id = current_setting('app.current_tenant')::TEXT);

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_runtime_workflows_updated_at BEFORE UPDATE ON runtime_workflows
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_runtime_tasks_updated_at BEFORE UPDATE ON runtime_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_runtime_executions_updated_at BEFORE UPDATE ON runtime_executions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_seo_keywords_updated_at BEFORE UPDATE ON seo_keywords
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_seo_clusters_updated_at BEFORE UPDATE ON seo_clusters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_seo_content_briefs_updated_at BEFORE UPDATE ON seo_content_briefs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_seo_drafts_updated_at BEFORE UPDATE ON seo_drafts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_seo_reports_updated_at BEFORE UPDATE ON seo_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
