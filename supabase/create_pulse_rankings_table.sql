-- Create pulse_rankings table for PULSE agent
-- Tracks keyword rankings over time

CREATE TABLE IF NOT EXISTS pulse_rankings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  keyword TEXT NOT NULL,
  url TEXT NOT NULL,
  search_engine TEXT NOT NULL DEFAULT 'google',
  location TEXT NOT NULL DEFAULT 'us',
  device TEXT NOT NULL DEFAULT 'desktop',
  current_rank INTEGER,
  previous_rank INTEGER,
  rank_change INTEGER,
  tracking_priority TEXT NOT NULL DEFAULT 'medium' CHECK (tracking_priority IN ('high', 'medium', 'low')),
  visibility_score INTEGER,
  status TEXT NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'failed')),
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_pulse_rankings_tenant_id ON pulse_rankings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pulse_rankings_keyword ON pulse_rankings(keyword);
CREATE INDEX IF NOT EXISTS idx_pulse_rankings_checked_at ON pulse_rankings(checked_at);
CREATE INDEX IF NOT EXISTS idx_pulse_rankings_tenant_keyword ON pulse_rankings(tenant_id, keyword);
CREATE INDEX IF NOT EXISTS idx_pulse_rankings_tenant_checked_at ON pulse_rankings(tenant_id, checked_at);

-- Update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- RLS policies
ALTER TABLE pulse_rankings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own pulse rankings"
  ON pulse_rankings FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "System can insert pulse rankings"
  ON pulse_rankings FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update pulse rankings"
  ON pulse_rankings FOR UPDATE
  WITH CHECK (true);
