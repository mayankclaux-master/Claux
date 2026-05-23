-- Phase 6C: Execution Schedules Table
-- Canonical scheduling table for recurring agent execution in CLAUX V1
-- Supports cron orchestration, execution locking, and tenant-safe scheduling

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Execution Schedules Table
-- ============================================
CREATE TABLE IF NOT EXISTS execution_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  agent_name TEXT NOT NULL,
  schedule_type TEXT NOT NULL, -- 'cron', 'interval', 'manual'
  cron_expression TEXT, -- cron expression for schedule_type='cron'
  next_run_at TIMESTAMP WITH TIME ZONE NOT NULL,
  last_run_at TIMESTAMP WITH TIME ZONE,
  enabled BOOLEAN NOT NULL DEFAULT true,
  execution_timeout_ms INTEGER NOT NULL DEFAULT 30000, -- 30 seconds default
  retry_limit INTEGER NOT NULL DEFAULT 3,
  retry_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT execution_schedules_tenant_fk FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  CONSTRAINT execution_schedules_cron_required CHECK (
    (schedule_type = 'cron' AND cron_expression IS NOT NULL) OR 
    (schedule_type != 'cron')
  ),
  CONSTRAINT execution_schedules_timeout_positive CHECK (execution_timeout_ms > 0),
  CONSTRAINT execution_schedules_retry_limit_positive CHECK (retry_limit >= 0),
  CONSTRAINT execution_schedules_retry_count_valid CHECK (retry_count >= 0 AND retry_count <= retry_limit)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_execution_schedules_tenant_id ON execution_schedules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_execution_schedules_next_run_at ON execution_schedules(next_run_at);
CREATE INDEX IF NOT EXISTS idx_execution_schedules_enabled ON execution_schedules(enabled);
CREATE INDEX IF NOT EXISTS idx_execution_schedules_agent_name ON execution_schedules(agent_name);
CREATE INDEX IF NOT EXISTS idx_execution_schedules_tenant_enabled_next ON execution_schedules(tenant_id, enabled, next_run_at);

-- RLS Policy
ALTER TABLE execution_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant can view own execution schedules" ON execution_schedules
  FOR SELECT USING (tenant_id = auth.uid());
CREATE POLICY "Tenant can insert own execution schedules" ON execution_schedules
  FOR INSERT WITH CHECK (tenant_id = auth.uid());
CREATE POLICY "Tenant can update own execution schedules" ON execution_schedules
  FOR UPDATE USING (tenant_id = auth.uid());
CREATE POLICY "Tenant can delete own execution schedules" ON execution_schedules
  FOR DELETE USING (tenant_id = auth.uid());

-- ============================================
-- Execution Locks Table
-- ============================================
CREATE TABLE IF NOT EXISTS execution_locks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  lock_key TEXT NOT NULL, -- unique key for the lock (e.g., 'agent:ARIA:tenant:123')
  execution_id UUID,
  locked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT execution_locks_tenant_fk FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  CONSTRAINT execution_locks_expires_future CHECK (expires_at > locked_at),
  CONSTRAINT execution_locks_unique_key UNIQUE (lock_key)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_execution_locks_tenant_id ON execution_locks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_execution_locks_lock_key ON execution_locks(lock_key);
CREATE INDEX IF NOT EXISTS idx_execution_locks_expires_at ON execution_locks(expires_at);
CREATE INDEX IF NOT EXISTS idx_execution_locks_execution_id ON execution_locks(execution_id);

-- RLS Policy
ALTER TABLE execution_locks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant can view own execution locks" ON execution_locks
  FOR SELECT USING (tenant_id = auth.uid());
CREATE POLICY "Tenant can insert own execution locks" ON execution_locks
  FOR INSERT WITH CHECK (tenant_id = auth.uid());
CREATE POLICY "Tenant can delete own execution locks" ON execution_locks
  FOR DELETE USING (tenant_id = auth.uid());

-- ============================================
-- Execution Audit Table
-- ============================================
CREATE TABLE IF NOT EXISTS execution_audit (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  execution_id UUID NOT NULL,
  trace_id UUID NOT NULL,
  agent_name TEXT NOT NULL,
  execution_type TEXT NOT NULL, -- 'cron', 'manual', 'api'
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_ms INTEGER,
  status TEXT NOT NULL, -- 'success', 'failed', 'timeout', 'cancelled'
  error_type TEXT, -- 'transient', 'permanent', 'timeout', 'connector', 'validation', 'auth', 'tenant', 'persistence'
  error_message TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  timeout_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT execution_audit_tenant_fk FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  CONSTRAINT execution_audit_duration_positive CHECK (duration_ms IS NULL OR duration_ms >= 0),
  CONSTRAINT execution_audit_retry_count_positive CHECK (retry_count >= 0)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_execution_audit_tenant_id ON execution_audit(tenant_id);
CREATE INDEX IF NOT EXISTS idx_execution_audit_execution_id ON execution_audit(execution_id);
CREATE INDEX IF NOT EXISTS idx_execution_audit_trace_id ON execution_audit(trace_id);
CREATE INDEX IF NOT EXISTS idx_execution_audit_agent_name ON execution_audit(agent_name);
CREATE INDEX IF NOT EXISTS idx_execution_audit_status ON execution_audit(status);
CREATE INDEX IF NOT EXISTS idx_execution_audit_started_at ON execution_audit(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_execution_audit_tenant_agent_started ON execution_audit(tenant_id, agent_name, started_at DESC);

-- RLS Policy
ALTER TABLE execution_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant can view own execution audit" ON execution_audit
  FOR SELECT USING (tenant_id = auth.uid());
CREATE POLICY "Tenant can insert own execution audit" ON execution_audit
  FOR INSERT WITH CHECK (tenant_id = auth.uid());

-- ============================================
-- Function to update updated_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for execution_schedules
CREATE TRIGGER update_execution_schedules_updated_at
  BEFORE UPDATE ON execution_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Function to clean up expired locks
-- ============================================
CREATE OR REPLACE FUNCTION cleanup_expired_locks()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM execution_locks
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Comments for documentation
-- ============================================
COMMENT ON TABLE execution_schedules IS 'Execution schedules for recurring agent execution';
COMMENT ON TABLE execution_locks IS 'Execution locks for preventing duplicate execution';
COMMENT ON TABLE execution_audit IS 'Execution audit log for observability and reliability tracking';
