-- Create locl_audits table for LOCL agent
-- Tracks Google My Business (GMB) audit results

CREATE TABLE IF NOT EXISTS locl_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  gmb_name TEXT NOT NULL,
  primary_category TEXT NOT NULL,
  review_count INTEGER NOT NULL,
  average_rating NUMERIC(3, 2) NOT NULL,
  photos_count INTEGER NOT NULL,
  posts_count INTEGER NOT NULL,
  completeness_score INTEGER NOT NULL,
  optimization_score INTEGER NOT NULL,
  missing_items JSONB NOT NULL,
  recommendations JSONB NOT NULL,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_locl_audits_tenant_id ON locl_audits(tenant_id);
CREATE INDEX IF NOT EXISTS idx_locl_audits_checked_at ON locl_audits(checked_at);
CREATE INDEX IF NOT EXISTS idx_locl_audits_tenant_checked_at ON locl_audits(tenant_id, checked_at);

-- RLS policies
ALTER TABLE locl_audits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own locl audits"
  ON locl_audits FOR SELECT
  USING (
    tenant_id::text IN (
      SELECT tenant_id FROM profiles WHERE id = auth.jwt() ->> 'sub'
    )
  );

CREATE POLICY "System can insert locl audits"
  ON locl_audits FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update locl audits"
  ON locl_audits FOR UPDATE
  WITH CHECK (true);
