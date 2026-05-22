-- Migration: Create publish_jobs table for PUBLISH agent
-- Purpose: Tracks publishing jobs to external CMS platforms
-- Sprint: Phase 2 / Sprint 5 - Schema Concurrency Foundation

-- Enable migration
BEGIN;

-- Create publish_jobs table
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

DROP TRIGGER IF EXISTS update_publish_jobs_updated_at ON publish_jobs;
CREATE TRIGGER update_publish_jobs_updated_at
  BEFORE UPDATE ON publish_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS policies - table already exists in production with existing policies
-- Skipping policy recreation to avoid conflicts

COMMIT;

-- Rollback script
-- BEGIN;
-- DROP POLICY IF EXISTS "System can update publish jobs" ON publish_jobs;
-- DROP POLICY IF EXISTS "System can insert publish jobs" ON publish_jobs;
-- DROP POLICY IF EXISTS "Users can view their own publish jobs" ON publish_jobs;
-- ALTER TABLE publish_jobs DISABLE ROW LEVEL SECURITY;
-- DROP TRIGGER IF EXISTS update_publish_jobs_updated_at ON publish_jobs;
-- DROP FUNCTION IF EXISTS update_updated_at_column;
-- DROP INDEX IF EXISTS idx_publish_jobs_tenant_status;
-- DROP INDEX IF EXISTS idx_publish_jobs_status;
-- DROP INDEX IF EXISTS idx_publish_jobs_content_id;
-- DROP INDEX IF EXISTS idx_publish_jobs_tenant_id;
-- DROP TABLE IF EXISTS publish_jobs;
-- COMMIT;
