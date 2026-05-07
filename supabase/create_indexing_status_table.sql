-- Create indexing_status table for tracking URL indexing requests
-- Stores indexing status for published URLs

CREATE TABLE IF NOT EXISTS indexing_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  submitted_at TIMESTAMPTZ,
  indexed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_indexing_status_tenant_id ON indexing_status(tenant_id);
CREATE INDEX IF NOT EXISTS idx_indexing_status_url ON indexing_status(url);
CREATE INDEX IF NOT EXISTS idx_indexing_status_tenant_url ON indexing_status(tenant_id, url);
CREATE INDEX IF NOT EXISTS idx_indexing_status_status ON indexing_status(status);
CREATE INDEX IF NOT EXISTS idx_indexing_status_submitted_at ON indexing_status(submitted_at);

-- Unique constraint to prevent duplicate entries for same tenant and URL
CREATE UNIQUE INDEX IF NOT EXISTS idx_indexing_status_tenant_url_unique ON indexing_status(tenant_id, url);

-- RLS policies
ALTER TABLE indexing_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own indexing status"
  ON indexing_status FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "System can insert indexing status"
  ON indexing_status FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update indexing status"
  ON indexing_status FOR UPDATE
  WITH CHECK (true);

CREATE POLICY "System can delete indexing status"
  ON indexing_status FOR DELETE
  WITH CHECK (true);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_indexing_status_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER indexing_status_updated_at_trigger
  BEFORE UPDATE ON indexing_status
  FOR EACH ROW
  EXECUTE FUNCTION update_indexing_status_updated_at();

-- Add CHECK constraint for status field
ALTER TABLE indexing_status
  ADD CONSTRAINT status_check 
  CHECK (status IN ('pending', 'submitted', 'indexed', 'failed'));
