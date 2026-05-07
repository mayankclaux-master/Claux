CREATE OR REPLACE FUNCTION complete_onboarding(
  p_tenant_id uuid,
  p_business_name text,
  p_category text,
  p_phone text,
  p_address text,
  p_service_areas text[],
  p_website_url text,
  p_tech_stack text,
  p_cms_type text,
  p_gbp_location_id text,
  p_place_id text,
  p_competitor_urls text[]
)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  v_agent_count INTEGER;
  v_retry_count INTEGER := 0;
  v_max_retries INTEGER := 3;
BEGIN
  -- UPSERT business profile
  INSERT INTO business_profiles (
    tenant_id,
    business_name,
    category,
    phone,
    address,
    service_areas,
    website_url,
    tech_stack,
    cms_type,
    gbp_location_id,
    place_id,
    competitor_urls
  )
  VALUES (
    p_tenant_id,
    p_business_name,
    p_category,
    p_phone,
    p_address,
    p_service_areas,
    p_website_url,
    p_tech_stack,
    p_cms_type,
    p_gbp_location_id,
    p_place_id,
    p_competitor_urls
  )
  ON CONFLICT (tenant_id)
  DO UPDATE SET
    business_name = EXCLUDED.business_name,
    category = EXCLUDED.category,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    service_areas = EXCLUDED.service_areas,
    website_url = EXCLUDED.website_url,
    tech_stack = EXCLUDED.tech_stack,
    cms_type = EXCLUDED.cms_type,
    gbp_location_id = EXCLUDED.gbp_location_id,
    place_id = EXCLUDED.place_id,
    competitor_urls = EXCLUDED.competitor_urls,
    updated_at = NOW();

  -- Mark onboarding complete
  UPDATE tenants
  SET onboarding_completed = true
  WHERE id = p_tenant_id;

  -- Initialize agent states with verification and retry
  WHILE v_retry_count < v_max_retries LOOP
    PERFORM initialize_agent_states(p_tenant_id);

    -- Verify agent initialization
    SELECT COUNT(*) INTO v_agent_count
    FROM agent_states
    WHERE tenant_id = p_tenant_id;

    RAISE NOTICE 'Agent initialization attempt % for tenant %: count = %', v_retry_count + 1, p_tenant_id, v_agent_count;

    IF v_agent_count = 9 THEN
      RETURN json_build_object('status', 'success', 'agent_count', v_agent_count);
    END IF;

    v_retry_count := v_retry_count + 1;
  END LOOP;

  -- Failed after retries
  RETURN json_build_object('status', 'error', 'message', 'Failed to initialize all 9 agents', 'agent_count', v_agent_count);
END;
$$;
