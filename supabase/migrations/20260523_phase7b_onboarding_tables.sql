-- Phase 7B: Canonical Production Onboarding System
-- Onboarding database foundation

-- Onboarding Sessions Table
CREATE TABLE IF NOT EXISTS onboarding_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  trace_id UUID,
  status TEXT NOT NULL CHECK (status IN (
    'account_created',
    'connectors_pending',
    'domain_verification',
    'keyword_bootstrap',
    'execution_bootstrap',
    'dashboard_activation',
    'command_center_activation',
    'production_ready',
    'failed'
  )),
  retry_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE(tenant_id)
);

-- Indexes for onboarding_sessions
CREATE INDEX IF NOT EXISTS idx_onboarding_sessions_tenant_id ON onboarding_sessions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_sessions_user_id ON onboarding_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_sessions_status ON onboarding_sessions(status);
CREATE INDEX IF NOT EXISTS idx_onboarding_sessions_trace_id ON onboarding_sessions(trace_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_sessions_created_at ON onboarding_sessions(created_at);

-- Onboarding Events Table (Append-only event log)
CREATE TABLE IF NOT EXISTS onboarding_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  onboarding_session_id UUID NOT NULL REFERENCES onboarding_sessions(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  execution_id UUID,
  trace_id UUID,
  event_type TEXT NOT NULL,
  event_stage TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  success BOOLEAN NOT NULL,
  error_message TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for onboarding_events
CREATE INDEX IF NOT EXISTS idx_onboarding_events_session_id ON onboarding_events(onboarding_session_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_events_tenant_id ON onboarding_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_events_execution_id ON onboarding_events(execution_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_events_trace_id ON onboarding_events(trace_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_events_event_type ON onboarding_events(event_type);
CREATE INDEX IF NOT EXISTS idx_onboarding_events_event_stage ON onboarding_events(event_stage);
CREATE INDEX IF NOT EXISTS idx_onboarding_events_created_at ON onboarding_events(created_at);

-- Onboarding Failures Table
CREATE TABLE IF NOT EXISTS onboarding_failures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  onboarding_session_id UUID NOT NULL REFERENCES onboarding_sessions(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  execution_id UUID,
  trace_id UUID,
  failure_stage TEXT NOT NULL,
  failure_type TEXT NOT NULL,
  failure_message TEXT NOT NULL,
  failure_context JSONB DEFAULT '{}',
  retry_count INTEGER DEFAULT 0,
  last_retry_at TIMESTAMPTZ,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for onboarding_failures
CREATE INDEX IF NOT EXISTS idx_onboarding_failures_session_id ON onboarding_failures(onboarding_session_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_failures_tenant_id ON onboarding_failures(tenant_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_failures_execution_id ON onboarding_failures(execution_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_failures_trace_id ON onboarding_failures(trace_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_failures_failure_stage ON onboarding_failures(failure_stage);
CREATE INDEX IF NOT EXISTS idx_onboarding_failures_resolved ON onboarding_failures(resolved);
CREATE INDEX IF NOT EXISTS idx_onboarding_failures_created_at ON onboarding_failures(created_at);

-- RLS Policies
ALTER TABLE onboarding_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_failures ENABLE ROW LEVEL SECURITY;

-- RLS Policy for onboarding_sessions
CREATE POLICY "Users can view their own onboarding sessions"
  ON onboarding_sessions FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage onboarding sessions"
  ON onboarding_sessions FOR ALL
  USING (auth.role() = 'service_role');

-- RLS Policy for onboarding_events
CREATE POLICY "Users can view their own onboarding events"
  ON onboarding_events FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage onboarding events"
  ON onboarding_events FOR ALL
  USING (auth.role() = 'service_role');

-- RLS Policy for onboarding_failures
CREATE POLICY "Users can view their own onboarding failures"
  ON onboarding_failures FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage onboarding failures"
  ON onboarding_failures FOR ALL
  USING (auth.role() = 'service_role');

-- Updated_at trigger for onboarding_sessions
CREATE OR REPLACE FUNCTION update_onboarding_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_onboarding_sessions_updated_at
  BEFORE UPDATE ON onboarding_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_onboarding_sessions_updated_at();
