-- PRODUCTION HOTFIX: Add missing enum values to cms_type
-- Issue: Onboarding fails with "invalid input value for enum cms_type: 'react'"
-- Runtime values not in enum: react, laravel, custom_php, unknown
-- Blast radius: Enum expansion only, no table changes, no data migration

-- Add missing enum values
ALTER TYPE cms_type ADD VALUE IF NOT EXISTS 'react';
ALTER TYPE cms_type ADD VALUE IF NOT EXISTS 'laravel';
ALTER TYPE cms_type ADD VALUE IF NOT EXISTS 'custom_php';
ALTER TYPE cms_type ADD VALUE IF NOT EXISTS 'unknown';

-- Verification query (run after execution)
-- SELECT t.typname, e.enumlabel
-- FROM pg_type t
-- JOIN pg_enum e ON t.oid = e.enumtypid
-- WHERE t.typname = 'cms_type'
-- ORDER BY e.enumsortorder;

-- Expected result: Enum now accepts all runtime values
-- Success criteria: Onboarding no longer fails with enum cast errors
