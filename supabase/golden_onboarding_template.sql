-- ============================================================================
-- GOLDEN ONBOARDING TEMPLATE
-- ============================================================================
-- This script creates a fully UI-onboarded user that the Next.js frontend will recognize.
--
-- CRITICAL: Do NOT manually insert into auth.users with crypt() - Supabase uses bcrypt/scrypt.
-- Instead, use the Supabase Admin API to create the user first, then run this script.
--
-- PREREQUISITE: User must already exist in auth.users (created via Supabase Admin API)
-- with email_confirmed_at set and a valid password hash.
--
-- USAGE:
-- 1. Create user via Supabase Dashboard or Admin API:
--    - Use supabase.auth.admin.createUser() with email, password, email_confirm: true
-- 2. Replace the placeholders below with actual values
-- 3. Run this script as service_role
-- ============================================================================

begin;

-- ============================================================================
-- CONFIGURATION - Replace these values
-- ============================================================================
-- Get the user_id from the auth.users table after creating via Admin API
-- \set user_id '00000000-0000-0000-0000-000000000000'
-- \set business_name 'My Business Name'
-- \set full_name 'John Doe'
-- \set email 'user@example.com'

-- ============================================================================
-- STEP 1: Create Organization
-- ============================================================================
-- Creates the organization with all required onboarding fields set to 'completed'
insert into public.organizations (
  id,
  name,
  website_url,
  category,
  gmb_url,
  target_market_type,
  target_city,
  primary_language,
  business_phone,
  full_physical_address,
  top_competitors,
  is_service_area_business,
  timezone,
  onboarding_status,
  onboarding_step,
  onboarding_completed,
  api_secret,
  created_by,
  created_at
) values (
  gen_random_uuid(),                          -- id
  'REPLACE_WITH_BUSINESS_NAME',               -- name
  '',                                         -- website_url (optional)
  '',                                         -- category (optional)
  '',                                         -- gmb_url (optional)
  '',                                         -- target_market_type (optional)
  '',                                         -- target_city (optional)
  '',                                         -- primary_language (optional)
  '',                                         -- business_phone (optional)
  '',                                         -- full_physical_address (optional)
  '[]'::jsonb,                                -- top_competitors (empty array)
  false,                                      -- is_service_area_business
  null,                                       -- timezone (optional)
  'completed',                                -- onboarding_status (CRITICAL)
  4,                                          -- onboarding_step (CRITICAL)
  true,                                       -- onboarding_completed (CRITICAL)
  gen_random_uuid(),                          -- api_secret (CRITICAL)
  'REPLACE_WITH_USER_ID',                    -- created_by (must reference auth.users.id)
  now()                                       -- created_at
)
on conflict (id) do nothing
returning id as org_id;

-- ============================================================================
-- STEP 2: Create Profile linking user to organization
-- ============================================================================
-- This is CRITICAL - without this, middleware will redirect to /onboarding/provisioning
insert into public.profiles (
  id,
  org_id,
  full_name,
  role,
  created_at,
  updated_at
) values (
  'REPLACE_WITH_USER_ID',                    -- id (must match auth.users.id)
  (select id from public.organizations where created_by = 'REPLACE_WITH_USER_ID' order by created_at desc limit 1), -- org_id
  'REPLACE_WITH_FULL_NAME',                  -- full_name (optional)
  'owner',                                    -- role (CRITICAL)
  now(),
  now()
)
on conflict (id) do update set
  org_id = excluded.org_id,
  updated_at = now();

-- ============================================================================
-- STEP 3: Create Connections entry
-- ============================================================================
-- Required for agent execution state tracking
insert into public.connections (
  id,
  org_id,
  website_url,
  tech_stack,
  google_api_links,
  status,
  aria_status,
  aria_progress,
  scribe_status,
  scribe_progress,
  visual_status,
  visual_progress,
  forge_status,
  forge_progress,
  core_status,
  core_progress,
  linx_status,
  linx_progress,
  locl_status,
  locl_progress,
  repute_status,
  repute_progress,
  ampli_status,
  ampli_progress,
  created_at,
  updated_at
) values (
  gen_random_uuid(),
  (select id from public.organizations where created_by = 'REPLACE_WITH_USER_ID' order by created_at desc limit 1),
  '',                                         -- website_url
  'unknown',                                  -- tech_stack
  '{}'::jsonb,                                -- google_api_links
  'pending',                                  -- status
  'pending',                                  -- aria_status
  0,                                          -- aria_progress
  'pending',                                  -- scribe_status
  0,                                          -- scribe_progress
  'pending',                                  -- visual_status
  0,                                          -- visual_progress
  'pending',                                  -- forge_status
  0,                                          -- forge_progress
  'pending',                                  -- core_status
  0,                                          -- core_progress
  'pending',                                  -- linx_status
  0,                                          -- linx_progress
  'pending',                                  -- locl_status
  0,                                          -- locl_progress
  'pending',                                  -- repute_status
  0,                                          -- repute_progress
  'pending',                                  -- ampli_status
  0,                                          -- ampli_progress
  now(),
  now()
)
on conflict (org_id) do nothing;

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================
-- Run this to verify the user is properly onboarded
select
  u.id as user_id,
  u.email,
  u.email_confirmed_at,
  p.id as profile_exists,
  p.org_id as profile_org_id,
  p.role,
  o.id as org_exists,
  o.name as org_name,
  o.onboarding_status,
  o.onboarding_step,
  o.onboarding_completed,
  o.api_secret as org_api_secret,
  c.id as connection_exists,
  case
    when u.email_confirmed_at is null then 'EMAIL_NOT_CONFIRMED'
    when p.id is null then 'MISSING_PROFILE'
    when p.org_id is null then 'MISSING_ORG_LINK'
    when o.id is null then 'MISSING_ORGANIZATION'
    when o.onboarding_status != 'completed' then 'ONBOARDING_INCOMPLETE'
    when o.onboarding_completed != true then 'ONBOARDING_FLAG_FALSE'
    when o.api_secret is null then 'MISSING_API_SECRET'
    when c.id is null then 'MISSING_CONNECTIONS'
    else 'HEALTHY'
  end as status
from auth.users u
left join public.profiles p on p.id = u.id
left join public.organizations o on o.id = p.org_id
left join public.connections c on c.org_id = o.id
where u.id = 'REPLACE_WITH_USER_ID';

commit;

-- ============================================================================
-- ALTERNATIVE: Single-Function Approach (Recommended)
-- ============================================================================
-- If you have service_role access, use this function instead:
--
-- SELECT public.complete_onboarding_atomic(
--   p_org_id => 'YOUR_ORG_ID',
--   p_business_name => 'Business Name',
--   p_category => 'category',
--   p_business_phone => 'phone',
--   p_full_physical_address => 'address',
--   p_gmb_url => '',
--   p_target_market_type => '',
--   p_target_city => '',
--   p_primary_language => '',
--   p_is_service_area_business => false,
--   p_website_url => '',
--   p_tech_stack => '',
--   p_google_api_links => '{}'::jsonb,
--   p_competitors => '[]'::jsonb
-- );
--
-- This function requires the user to be authenticated (auth.uid() must exist),
-- so it's best used during the normal onboarding flow, not for manual provisioning.
-- ============================================================================
