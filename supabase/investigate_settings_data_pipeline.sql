-- INVESTIGATION: Settings Page Data Pipeline
-- Purpose: Verify data flow from database to settings page
-- Issue: Settings page hangs on loading with loading=true, hasTenant=false, tenantId=undefined

==================================================
STEP 1: CHECK TABLE SCHEMAS
==================================================

-- Check profiles table schema
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- Check tenants table schema
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'tenants'
ORDER BY ordinal_position;

-- Check business_profiles table schema
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'business_profiles'
ORDER BY ordinal_position;

==================================================
STEP 2: CHECK DATA EXISTENCE
==================================================

-- Count total profiles
SELECT COUNT(*) as total_profiles FROM profiles;

-- Count profiles with tenant_id
SELECT 
  COUNT(*) as profiles_with_tenant,
  COUNT(*) FILTER (WHERE tenant_id IS NOT NULL) as profiles_with_tenant_id,
  COUNT(*) FILTER (WHERE tenant_id IS NULL) as profiles_without_tenant_id
FROM profiles;

-- Count total tenants
SELECT COUNT(*) as total_tenants FROM tenants;

-- Count tenants by status
SELECT 
  status,
  COUNT(*) as count
FROM tenants
GROUP BY status;

-- Count total business_profiles
SELECT COUNT(*) as total_business_profiles FROM business_profiles;

-- Count business_profiles by tenant_id presence
SELECT 
  COUNT(*) as business_profiles_with_tenant_id,
  COUNT(*) FILTER (WHERE tenant_id IS NOT NULL) as with_tenant_id,
  COUNT(*) FILTER (WHERE tenant_id IS NULL) as without_tenant_id
FROM business_profiles;

==================================================
STEP 3: CHECK DATA PIPELINE CONNECTIONS
==================================================

-- Check profiles -> tenants connection
SELECT 
  p.id as profile_id,
  p.tenant_id,
  t.id as tenant_exists,
  t.name as tenant_name,
  t.status as tenant_status,
  t.onboarding_completed as tenant_onboarding_completed
FROM profiles p
LEFT JOIN tenants t ON p.tenant_id = t.id
LIMIT 10;

-- Check tenants -> business_profiles connection
SELECT 
  t.id as tenant_id,
  t.name as tenant_name,
  t.onboarding_completed,
  bp.id as business_profile_exists,
  bp.business_name,
  bp.cms_type
FROM tenants t
LEFT JOIN business_profiles bp ON t.id = bp.tenant_id
LIMIT 10;

-- Check profiles -> business_profiles connection (via tenant)
SELECT 
  p.id as profile_id,
  p.tenant_id,
  bp.id as business_profile_exists,
  bp.business_name,
  bp.cms_type
FROM profiles p
LEFT JOIN business_profiles bp ON p.tenant_id = bp.tenant_id
LIMIT 10;

==================================================
STEP 4: CHECK RECENT DATA
==================================================

-- Most recent profiles
SELECT 
  id,
  tenant_id,
  full_name,
  provisioning_status,
  created_at
FROM profiles
ORDER BY created_at DESC
LIMIT 10;

-- Most recent tenants
SELECT 
  id,
  name,
  status,
  onboarding_completed,
  created_at
FROM tenants
ORDER BY created_at DESC
LIMIT 10;

-- Most recent business_profiles
SELECT 
  id,
  tenant_id,
  business_name,
  cms_type,
  created_at
FROM business_profiles
ORDER BY created_at DESC
LIMIT 10;

==================================================
STEP 5: CHECK FOR ORPHANED DATA
==================================================

-- Profiles with tenant_id that doesn't exist in tenants
SELECT 
  p.id as profile_id,
  p.tenant_id as orphan_tenant_id
FROM profiles p
WHERE p.tenant_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM tenants t WHERE t.id = p.tenant_id);

-- Business profiles with tenant_id that doesn't exist in tenants
SELECT 
  bp.id as business_profile_id,
  bp.tenant_id as orphan_tenant_id
FROM business_profiles bp
WHERE NOT EXISTS (SELECT 1 FROM tenants t WHERE t.id = bp.tenant_id);

-- Tenants without business profiles
SELECT 
  t.id as tenant_id,
  t.name as tenant_name,
  t.onboarding_completed
FROM tenants t
WHERE NOT EXISTS (SELECT 1 FROM business_profiles bp WHERE bp.tenant_id = t.id);

==================================================
STEP 6: CHECK SPECIFIC USER DATA
==================================================

-- Replace 'USER_ID_HERE' with actual Clerk user ID from logs
-- SELECT 
--   p.id as profile_id,
--   p.tenant_id,
--   p.full_name,
--   p.provisioning_status,
--   t.id as tenant_id,
--   t.name as tenant_name,
--   t.status as tenant_status,
--   t.onboarding_completed,
--   bp.id as business_profile_id,
--   bp.business_name,
--   bp.cms_type
-- FROM profiles p
-- LEFT JOIN tenants t ON p.tenant_id = t.id
-- LEFT JOIN business_profiles bp ON t.id = bp.tenant_id
-- WHERE p.id = 'USER_ID_HERE';

==================================================
STEP 7: CHECK API ROUTE EXPECTED RESPONSE STRUCTURE
==================================================

-- Simulate /api/dashboard/profile query
-- This should return: { data: { profile, tenant, businessProfile } }

-- Query for profile
SELECT * FROM profiles WHERE id = 'USER_ID_HERE' LIMIT 1;

-- Query for tenant (if profile has tenant_id)
SELECT * FROM tenants WHERE id = 'TENANT_ID_HERE' LIMIT 1;

-- Query for business_profile (if tenant exists)
SELECT * FROM business_profiles WHERE tenant_id = 'TENANT_ID_HERE' LIMIT 1;

==================================================
STEP 8: CHECK FOR NULL/EMPTY VALUES
==================================================

-- Profiles with NULL tenant_id
SELECT COUNT(*) as profiles_with_null_tenant_id
FROM profiles
WHERE tenant_id IS NULL;

-- Business profiles with NULL tenant_id
SELECT COUNT(*) as business_profiles_with_null_tenant_id
FROM business_profiles
WHERE tenant_id IS NULL;

-- Business profiles with NULL business_name
SELECT COUNT(*) as business_profiles_with_null_business_name
FROM business_profiles
WHERE business_name IS NULL OR business_name = '';

-- Business profiles with NULL cms_type
SELECT COUNT(*) as business_profiles_with_null_cms_type
FROM business_profiles
WHERE cms_type IS NULL OR cms_type = '';

==================================================
STEP 9: CHECK ENUM VALUES
==================================================

-- Check cms_type enum values
SELECT 
  t.typname,
  e.enumlabel
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typname = 'cms_type'
ORDER BY e.enumsortorder;

-- Check distinct cms_type values in business_profiles
SELECT 
  cms_type,
  COUNT(*) as count
FROM business_profiles
GROUP BY cms_type
ORDER BY count DESC;
