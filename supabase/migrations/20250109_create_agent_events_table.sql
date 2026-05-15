-- Migration: Create agent_events table
-- Purpose: Central event stream for event-driven architecture
-- Sprint: Phase 1 / Sprint 1 - Agent Runtime Foundation

CREATE TABLE IF NOT EXISTS agent_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  execution_id UUID REFERENCES agent_executions(id) ON DELETE SET NULL,
  event_name TEXT NOT NULL,
  event_source TEXT NOT NULL,
  payload JSONB DEFAULT '{}'::jsonb,
  event_version TEXT DEFAULT '1.0',
  correlation_id TEXT,
  causation_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_agent_events_tenant_id ON agent_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_agent_events_execution_id ON agent_events(execution_id);
CREATE INDEX IF NOT EXISTS idx_agent_events_event_name ON agent_events(event_name);
CREATE INDEX IF NOT EXISTS idx_agent_events_event_source ON agent_events(event_source);
CREATE INDEX IF NOT EXISTS idx_agent_events_created_at ON agent_events(created_at);
CREATE INDEX IF NOT EXISTS idx_agent_events_tenant_event ON agent_events(tenant_id, event_name);
CREATE INDEX IF NOT EXISTS idx_agent_events_correlation_id ON agent_events(correlation_id);
CREATE INDEX IF NOT EXISTS idx_agent_events_causation_id ON agent_events(causation_id);

-- Composite index for event streaming queries
CREATE INDEX IF NOT EXISTS idx_agent_events_tenant_created 
  ON agent_events(tenant_id, created_at DESC);

-- Composite index for workflow event queries
CREATE INDEX IF NOT EXISTS idx_agent_events_execution_created 
  ON agent_events(execution_id, created_at DESC);

-- GIN index for payload searches
CREATE INDEX IF NOT EXISTS idx_agent_events_payload_gin 
  ON agent_events USING GIN (payload);

-- RLS policies
ALTER TABLE agent_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own agent events"
  ON agent_events FOR SELECT
  USING (
    tenant_id::text IN (
      SELECT tenant_id FROM profiles WHERE id = auth.jwt() ->> 'sub'
    )
  );

CREATE POLICY "System can insert agent events"
  ON agent_events FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update agent events"
  ON agent_events FOR UPDATE
  WITH CHECK (true);

CREATE POLICY "System can delete agent events"
  ON agent_events FOR DELETE
  WITH CHECK (true);

-- Comments for documentation
COMMENT ON TABLE agent_events IS 'Central event stream for event-driven architecture';
COMMENT ON COLUMN agent_events.id IS 'Unique identifier for the event';
COMMENT ON COLUMN agent_events.tenant_id IS 'Tenant identifier for multi-tenancy';
COMMENT ON COLUMN agent_events.execution_id IS 'Reference to associated execution';
COMMENT ON COLUMN agent_events.event_name IS 'Name of the event (e.g., audit.completed, content.generated)';
COMMENT ON COLUMN agent_events.event_source IS 'Source of the event (e.g., LOCL, ARIA, system)';
COMMENT ON COLUMN agent_events.payload IS 'Event payload data';
COMMENT ON COLUMN agent_events.event_version IS 'Version of the event schema';
COMMENT ON COLUMN agent_events.correlation_id IS 'ID for correlating related events';
COMMENT ON COLUMN agent_events.causation_id IS 'ID of the event that caused this event';
COMMENT ON COLUMN agent_events.created_at IS 'When the event was created';

-- Retention Policy: Delete events older than 180 days
-- This policy runs daily and removes events older than 180 days
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'clean-agent-events',
  '0 3 * * *', -- Run daily at 3 AM UTC
  $$
  DELETE FROM agent_events
  WHERE created_at < NOW() - INTERVAL '180 days'
  $$
);

COMMENT ON POLICY "System can delete agent events" ON agent_events IS 'Allows system to delete old events via retention policy';
