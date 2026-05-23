-- CLAUX Phase 2B — Command Centre Foundation
-- Canonical human execution task system
-- Multitenant task infrastructure
-- Client keyword universe

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLE: command_center_tasks
-- ============================================================
-- Purpose: Canonical human execution task table

CREATE TABLE IF NOT EXISTS command_center_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  client_id UUID,
  agent_name TEXT NOT NULL,
  task_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'blocked', 'cancelled')),
  source_execution_id UUID,
  source_task_id UUID,
  metadata JSONB DEFAULT '{}',
  action_payload JSONB DEFAULT '{}',
  assigned_to UUID,
  due_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_command_center_tasks_tenant ON command_center_tasks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_command_center_tasks_status ON command_center_tasks(status);
CREATE INDEX IF NOT EXISTS idx_command_center_tasks_priority ON command_center_tasks(priority);
CREATE INDEX IF NOT EXISTS idx_command_center_tasks_agent ON command_center_tasks(agent_name);
CREATE INDEX IF NOT EXISTS idx_command_center_tasks_created_at ON command_center_tasks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_command_center_tasks_assigned_to ON command_center_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_command_center_tasks_source_execution ON command_center_tasks(source_execution_id);

-- RLS
ALTER TABLE command_center_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own tenant's tasks
CREATE POLICY "Users can view own tenant tasks" ON command_center_tasks
  FOR SELECT USING (tenant_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can insert own tenant tasks" ON command_center_tasks
  FOR INSERT WITH CHECK (tenant_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update own tenant tasks" ON command_center_tasks
  FOR UPDATE USING (tenant_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can delete own tenant tasks" ON command_center_tasks
  FOR DELETE USING (tenant_id = auth.jwt() ->> 'sub');

-- Trigger for updated_at
CREATE TRIGGER update_command_center_tasks_updated_at
  BEFORE UPDATE ON command_center_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- TABLE: task_activity_logs
-- ============================================================
-- Purpose: Track human task execution events

CREATE TABLE IF NOT EXISTS task_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  task_id UUID NOT NULL,
  action_type TEXT NOT NULL,
  actor_id UUID,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_task_activity_logs_tenant ON task_activity_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_task_activity_logs_task ON task_activity_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_task_activity_logs_created_at ON task_activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_task_activity_logs_action_type ON task_activity_logs(action_type);

-- RLS
ALTER TABLE task_activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own tenant's activity logs
CREATE POLICY "Users can view own tenant activity logs" ON task_activity_logs
  FOR SELECT USING (tenant_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can insert own tenant activity logs" ON task_activity_logs
  FOR INSERT WITH CHECK (tenant_id = auth.jwt() ->> 'sub');

-- ============================================================
-- TABLE: client_keyword_universe
-- ============================================================
-- Purpose: Tenant-isolated keyword intelligence store
-- CRITICAL: NO SHARED KEYWORD TABLES - EVERYTHING TENANT ISOLATED

CREATE TABLE IF NOT EXISTS client_keyword_universe (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  client_id UUID,
  keyword TEXT NOT NULL,
  search_volume INTEGER DEFAULT 0,
  keyword_difficulty NUMERIC(5, 2) DEFAULT 0,
  opportunity_score NUMERIC(5, 2) DEFAULT 0,
  ranking_position INTEGER,
  ranking_url TEXT,
  search_intent TEXT,
  source_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, keyword)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_client_keyword_universe_tenant ON client_keyword_universe(tenant_id);
CREATE INDEX IF NOT EXISTS idx_client_keyword_universe_keyword ON client_keyword_universe(keyword);
CREATE INDEX IF NOT EXISTS idx_client_keyword_universe_opportunity ON client_keyword_universe(opportunity_score DESC);
CREATE INDEX IF NOT EXISTS idx_client_keyword_universe_ranking ON client_keyword_universe(ranking_position);
CREATE INDEX IF NOT EXISTS idx_client_keyword_universe_client ON client_keyword_universe(client_id);

-- RLS
ALTER TABLE client_keyword_universe ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own tenant's keyword universe
CREATE POLICY "Users can view own tenant keywords" ON client_keyword_universe
  FOR SELECT USING (tenant_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can insert own tenant keywords" ON client_keyword_universe
  FOR INSERT WITH CHECK (tenant_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update own tenant keywords" ON client_keyword_universe
  FOR UPDATE USING (tenant_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can delete own tenant keywords" ON client_keyword_universe
  FOR DELETE USING (tenant_id = auth.jwt() ->> 'sub');

-- Trigger for updated_at
CREATE TRIGGER update_client_keyword_universe_updated_at
  BEFORE UPDATE ON client_keyword_universe
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- HELPER FUNCTION FOR updated_at TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
