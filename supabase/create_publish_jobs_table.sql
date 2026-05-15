-- Create publish_jobs table for PUBLISH agent
-- Tracks publishing jobs to external CMS platforms

CREATE TABLE IF NOT EXISTS publish_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  content_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'publishing', 'success', 'failed')),
  cms_type TEXT NOT NULL,
  error_message TEXT,
  published_url TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_publish_jobs_tenant_id ON publish_jobs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_publish_jobs_content_id ON publish_jobs(content_id);
CREATE INDEX IF NOT EXISTS idx_publish_jobs_status ON publish_jobs(status);
CREATE INDEX IF NOT EXISTS idx_publish_jobs_tenant_status ON publish_jobs(tenant_id, status);

-- Update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER IF NOT EXISTS update_publish_jobs_updated_at
  BEFORE UPDATE ON publish_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS policies
ALTER TABLE publish_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own publish jobs"
  ON publish_jobs FOR SELECT
  USING (
    tenant_id::text IN (
      SELECT tenant_id FROM profiles WHERE id = auth.jwt() ->> 'sub'
    )
  );

CREATE POLICY "System can insert publish jobs"
  ON publish_jobs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update publish jobs"
  ON publish_jobs FOR UPDATE
  WITH CHECK (true);
