-- Migration: Add publish deduplication constraint
-- Purpose: Prevent duplicate publishes to same CMS target for same content
-- Sprint: Phase 2 / Sprint 5 - Schema Concurrency Foundation
-- Dependencies: create_publish_jobs_table.sql

-- Enable migration
BEGIN;

-- Add fingerprint column to publish_jobs for publish deduplication
ALTER TABLE publish_jobs 
  ADD COLUMN IF NOT EXISTS fingerprint TEXT;

COMMENT ON COLUMN publish_jobs.fingerprint IS 'SHA-256 fingerprint of publish parameters for deduplication (nullable during migration)';

-- Add unique constraint for tenant-scoped publish deduplication
-- This prevents duplicate publishes of the same content to the same CMS target within a time window
-- Note: Constraint is DEFERRABLE INITIALLY DEFERRED to allow bulk operations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'uk_publish_jobs_tenant_content_cms'
  ) THEN
    ALTER TABLE publish_jobs 
      ADD CONSTRAINT uk_publish_jobs_tenant_content_cms 
      UNIQUE (tenant_id, content_id, cms_type) 
      DEFERRABLE INITIALLY DEFERRED;
  END IF;
END $$;

COMMENT ON CONSTRAINT uk_publish_jobs_tenant_content_cms ON publish_jobs IS 
  'Prevents duplicate publishes of same content to same CMS within tenant (deferred for bulk operations)';

-- Add index for publish deduplication queries
CREATE INDEX IF NOT EXISTS idx_publish_jobs_tenant_content_cms 
  ON publish_jobs(tenant_id, content_id, cms_type, status);

COMMIT;

-- Rollback script
-- BEGIN;
-- DROP INDEX IF EXISTS idx_publish_jobs_tenant_content_cms_completed;
-- DROP INDEX IF EXISTS idx_publish_jobs_tenant_content_cms;
-- ALTER TABLE publish_jobs DROP CONSTRAINT IF EXISTS uk_publish_jobs_tenant_content_cms;
-- ALTER TABLE publish_jobs DROP COLUMN IF EXISTS fingerprint;
-- COMMIT;
