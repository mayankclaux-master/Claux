begin;

-- Drop every overload of bootstrap_organization_for_user so we can recreate with a single, clean signature.
do $$
declare
  rec record;
begin
  for rec in
    select oid::regprocedure as proc
    from pg_proc
    where proname = 'bootstrap_organization_for_user'
      and pronamespace = 'public'::regnamespace
  loop
    execute format('drop function if exists %s cascade', rec.proc);
  end loop;
end $$;

create or replace function public.bootstrap_organization_for_user(
  p_user_id uuid,
  p_business_name text default 'My Business',
  p_full_name text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_lock_key bigint;
  v_existing_profile profiles%rowtype;
  v_existing_org organizations%rowtype;
begin
  v_lock_key := ('x' || substr(p_user_id::text, 1, 16))::bit(64)::bigint;

  perform pg_advisory_lock(v_lock_key);

  begin
    select * into v_existing_profile from profiles where id = p_user_id;

    if v_existing_profile.id is not null and v_existing_profile.org_id is not null then
      select * into v_existing_org from organizations where id = v_existing_profile.org_id;

      if v_existing_org.id is not null then
        perform pg_advisory_unlock(v_lock_key);

        return jsonb_build_object(
          'status', 'already_exists',
          'org_id', v_existing_org.id,
          'profile_id', v_existing_profile.id
        );
      end if;
    end if;

    insert into organizations (id, name, created_by, onboarding_status, onboarding_completed)
    values (gen_random_uuid(), p_business_name, p_user_id, 'pending', false)
    on conflict do nothing
    returning id into v_org_id;

    if v_org_id is null then
      select id
      into v_org_id
      from organizations
      where created_by = p_user_id
      order by created_at
      limit 1;
    end if;

    if v_org_id is null then
      raise exception 'Organization bootstrap failed for user %', p_user_id;
    end if;

    insert into profiles (id, org_id, full_name, role)
    values (p_user_id, v_org_id, nullif(p_full_name, ''), 'owner')
    on conflict (id)
    do update set
      org_id = v_org_id,
      updated_at = now()
    where profiles.org_id is null or profiles.org_id != v_org_id;

    insert into connections (org_id, website_url)
    values (v_org_id, '')
    on conflict (org_id) do nothing;

    perform pg_advisory_unlock(v_lock_key);

    return jsonb_build_object(
      'status', 'created',
      'org_id', v_org_id,
      'profile_id', p_user_id
    );
  exception when others then
    perform pg_advisory_unlock(v_lock_key);
    raise;
  end;
end;
$$;

revoke all on function public.bootstrap_organization_for_user(uuid, text, text) from public;
grant execute on function public.bootstrap_organization_for_user(uuid, text, text) to service_role;

create or replace view public.provisioning_health as
select
  u.id as user_id,
  u.email,
  u.created_at as signed_up_at,
  p.id is not null as has_profile,
  p.org_id is not null as has_org_link,
  o.id is not null as org_exists,
  o.onboarding_completed,
  c.id is not null as has_connections,
  case
    when p.id is null then 'missing_profile'
    when p.org_id is null then 'missing_org_link'
    when o.id is null then 'orphaned_org_link'
    when c.id is null then 'missing_connections'
    when not o.onboarding_completed then 'incomplete_onboarding'
    else 'healthy'
  end as status
from auth.users u
left join public.profiles p on p.id = u.id
left join public.organizations o on o.id = p.org_id
left join public.connections c on c.org_id = o.id
where u.email_confirmed_at is not null;

grant select on public.provisioning_health to service_role;

create or replace function public.reconcile_broken_provisioning(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result jsonb;
begin
  select public.bootstrap_organization_for_user(p_user_id) into v_result;
  return v_result;
end;
$$;

grant execute on function public.reconcile_broken_provisioning(uuid) to service_role;

commit;
