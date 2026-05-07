CREATE OR REPLACE FUNCTION bootstrap_tenant_for_user(
  p_user_id TEXT,
  p_tenant_name TEXT,
  p_full_name TEXT
)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  v_tenant_id UUID;
  v_result json;
BEGIN
  -- Check if profile already exists with tenant
  SELECT tenant_id INTO v_tenant_id
  FROM profiles
  WHERE id = p_user_id
  LIMIT 1;

  -- If tenant already exists, return it
  IF v_tenant_id IS NOT NULL THEN
    RETURN json_build_object('status', 'success', 'tenant_id', v_tenant_id);
  END IF;

  -- Create new tenant
  INSERT INTO tenants (
    name,
    status,
    onboarding_completed,
    created_by,
    created_at,
    updated_at
  ) VALUES (
    p_tenant_name,
    'active',
    false,
    p_user_id,
    now(),
    now()
  ) RETURNING id INTO v_tenant_id;

  -- Create or update profile with tenant_id
  INSERT INTO profiles (
    id,
    tenant_id,
    full_name,
    provisioning_status,
    created_at,
    updated_at
  ) VALUES (
    p_user_id,
    v_tenant_id,
    p_full_name,
    'completed',
    now(),
    now()
  ) ON CONFLICT (id) DO UPDATE SET
    tenant_id = v_tenant_id,
    full_name = p_full_name,
    provisioning_status = 'completed',
    updated_at = now();

  RETURN json_build_object('status', 'success', 'tenant_id', v_tenant_id);
END;
$$;
