-- Create or replace dashboard_context_v1 view
-- This view provides a unified context for dashboard data including user, tenant, and business profile information
CREATE OR REPLACE VIEW dashboard_context_v1 AS
SELECT
  p.id AS user_id,
  p.full_name,
  p.tenant_id,
  t.name AS tenant_name,
  t.status AS tenant_status,
  bp.business_name
FROM profiles p
LEFT JOIN tenants t ON p.tenant_id = t.id
LEFT JOIN business_profiles bp ON bp.tenant_id = t.id;

-- Add comment to document the view
COMMENT ON VIEW dashboard_context_v1 IS 'Unified dashboard context joining profiles, tenants, and business_profiles for dashboard hydration';
