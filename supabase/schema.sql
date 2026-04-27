create extension if not exists pgcrypto;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  website_url text,
  category text,
  gmb_url text,
  target_market_type text,
  target_city text,
  primary_language text,
  business_phone text,
  full_physical_address text,
  top_competitors jsonb not null default '[]'::jsonb,
  is_service_area_business boolean not null default false,
  timezone text,
  onboarding_status text,
  onboarding_step integer not null default 1,
  onboarding_completed boolean not null default false,
  created_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now()
);

alter table public.organizations add column if not exists website_url text;
alter table public.organizations add column if not exists onboarding_status text;
alter table public.organizations add column if not exists gmb_url text;
alter table public.organizations add column if not exists target_market_type text;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  org_id uuid not null references public.organizations (id) on delete cascade,
  full_name text,
  role text not null default 'owner' check (role in ('owner', 'admin', 'member')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.connections (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  website_url text,
  tech_stack text not null default 'unknown',
  google_api_links jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'connected', 'error')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organization_competitors (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  competitor_url text not null,
  rank smallint not null check (rank between 1 and 3),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_profiles_org_id on public.profiles (org_id);
create index if not exists idx_connections_org_id on public.connections (org_id);
create unique index if not exists idx_connections_org_unique on public.connections (org_id);
create index if not exists idx_organization_competitors_org_id on public.organization_competitors (org_id);
create unique index if not exists idx_organization_competitors_org_rank_unique
on public.organization_competitors (org_id, rank);

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.connections enable row level security;
alter table public.organization_competitors enable row level security;

drop policy if exists organizations_select_same_org on public.organizations;
create policy organizations_select_same_org
on public.organizations
for select
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.org_id = organizations.id
  )
);

drop policy if exists organizations_insert_creator_only on public.organizations;
create policy organizations_insert_creator_only
on public.organizations
for insert
to authenticated
with check (created_by = auth.uid());

drop policy if exists organizations_update_same_org on public.organizations;
create policy organizations_update_same_org
on public.organizations
for update
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.org_id = organizations.id
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.org_id = organizations.id
  )
);

drop policy if exists organizations_delete_same_org on public.organizations;
create policy organizations_delete_same_org
on public.organizations
for delete
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.org_id = organizations.id
  )
);

drop policy if exists profiles_select_same_org on public.profiles;
create policy profiles_select_same_org
on public.profiles
for select
using (
  exists (
    select 1
    from public.profiles me
    where me.id = auth.uid()
      and me.org_id = profiles.org_id
  )
);

drop policy if exists profiles_insert_self_only on public.profiles;
create policy profiles_insert_self_only
on public.profiles
for insert
to authenticated
with check (id = auth.uid());

drop policy if exists profiles_update_same_org on public.profiles;
create policy profiles_update_same_org
on public.profiles
for update
using (
  exists (
    select 1
    from public.profiles me
    where me.id = auth.uid()
      and me.org_id = profiles.org_id
  )
)
with check (
  exists (
    select 1
    from public.profiles me
    where me.id = auth.uid()
      and me.org_id = profiles.org_id
  )
);

drop policy if exists profiles_delete_same_org on public.profiles;
create policy profiles_delete_same_org
on public.profiles
for delete
using (
  exists (
    select 1
    from public.profiles me
    where me.id = auth.uid()
      and me.org_id = profiles.org_id
  )
);

drop policy if exists connections_select_same_org on public.connections;
create policy connections_select_same_org
on public.connections
for select
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.org_id = connections.org_id
  )
);

drop policy if exists organization_competitors_select_same_org on public.organization_competitors;
create policy organization_competitors_select_same_org
on public.organization_competitors
for select
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.org_id = organization_competitors.org_id
  )
);

drop policy if exists organization_competitors_insert_same_org on public.organization_competitors;
create policy organization_competitors_insert_same_org
on public.organization_competitors
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.org_id = organization_competitors.org_id
  )
);

drop policy if exists organization_competitors_update_same_org on public.organization_competitors;
create policy organization_competitors_update_same_org
on public.organization_competitors
for update
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.org_id = organization_competitors.org_id
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.org_id = organization_competitors.org_id
  )
);

drop policy if exists organization_competitors_delete_same_org on public.organization_competitors;
create policy organization_competitors_delete_same_org
on public.organization_competitors
for delete
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.org_id = organization_competitors.org_id
  )
);

create or replace function public.bootstrap_organization_for_user(
  p_user_id uuid,
  p_business_name text,
  p_full_name text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_has_created_by boolean;
begin
  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'organizations'
      and column_name = 'created_by'
  )
  into v_has_created_by;

  if v_has_created_by then
    insert into public.organizations (name, created_by)
    values (p_business_name, p_user_id)
    returning id into v_org_id;
  else
    insert into public.organizations (name)
    values (p_business_name)
    returning id into v_org_id;
  end if;

  insert into public.profiles (id, org_id, full_name, role)
  values (p_user_id, v_org_id, p_full_name, 'owner');

  return v_org_id;
end;
$$;

revoke all on function public.bootstrap_organization_for_user(uuid, text, text) from public;
grant execute on function public.bootstrap_organization_for_user(uuid, text, text) to service_role;

create or replace function public.complete_onboarding_atomic(
  p_org_id uuid,
  p_business_name text,
  p_category text,
  p_business_phone text,
  p_full_physical_address text,
  p_gmb_url text,
  p_target_market_type text,
  p_target_city text,
  p_primary_language text,
  p_is_service_area_business boolean,
  p_website_url text,
  p_tech_stack text,
  p_google_api_links jsonb,
  p_competitors jsonb default '[]'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_user_id uuid;
  v_existing_profile_org_id uuid;
begin
  v_actor_user_id := auth.uid();

  if v_actor_user_id is null then
    raise exception 'Profile synchronization in progress... please wait.';
  end if;

  select org_id
  into v_existing_profile_org_id
  from public.profiles
  where id = v_actor_user_id;

  if v_existing_profile_org_id is null then
    insert into public.profiles (id, org_id, role)
    values (v_actor_user_id, p_org_id, 'owner')
    on conflict (id)
    do update set org_id = excluded.org_id;
  elsif v_existing_profile_org_id <> p_org_id then
    raise exception 'Forbidden org access.';
  end if;

  update public.organizations
  set
    name = p_business_name,
    category = p_category,
    business_phone = p_business_phone,
    full_physical_address = p_full_physical_address,
    gmb_url = p_gmb_url,
    target_market_type = p_target_market_type,
    target_city = case when p_target_market_type = 'local_city' then p_target_city else null end,
    primary_language = p_primary_language,
    website_url = p_website_url,
    is_service_area_business = coalesce(p_is_service_area_business, false),
    top_competitors = coalesce(p_competitors, '[]'::jsonb),
    onboarding_status = 'completed',
    onboarding_step = 4,
    onboarding_completed = true
  where id = p_org_id;

  delete from public.organization_competitors where org_id = p_org_id;

  insert into public.organization_competitors (org_id, competitor_url, rank)
  select
    p_org_id,
    trim(value),
    ordinality::smallint
  from jsonb_array_elements_text(coalesce(p_competitors, '[]'::jsonb)) with ordinality
  where trim(value) <> ''
    and ordinality between 1 and 3;

  insert into public.connections (
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
    updated_at
  )
  values (
    p_org_id,
    p_website_url,
    coalesce(nullif(trim(p_tech_stack), ''), 'unknown'),
    coalesce(p_google_api_links, '{}'::jsonb),
    'pending',
    'pending',
    0,
    'pending',
    0,
    'pending',
    0,
    'pending',
    0,
    'pending',
    0,
    'pending',
    0,
    'pending',
    0,
    'pending',
    0,
    'pending',
    0,
    now()
  )
  on conflict (org_id)
  do update set
    website_url = excluded.website_url,
    tech_stack = excluded.tech_stack,
    google_api_links = excluded.google_api_links,
    status = 'pending',
    aria_status = coalesce(connections.aria_status, 'pending'),
    aria_progress = coalesce(connections.aria_progress, 0),
    scribe_status = coalesce(connections.scribe_status, 'pending'),
    scribe_progress = coalesce(connections.scribe_progress, 0),
    visual_status = coalesce(connections.visual_status, 'pending'),
    visual_progress = coalesce(connections.visual_progress, 0),
    forge_status = coalesce(connections.forge_status, 'pending'),
    forge_progress = coalesce(connections.forge_progress, 0),
    core_status = coalesce(connections.core_status, 'pending'),
    core_progress = coalesce(connections.core_progress, 0),
    linx_status = coalesce(connections.linx_status, 'pending'),
    linx_progress = coalesce(connections.linx_progress, 0),
    locl_status = coalesce(connections.locl_status, 'pending'),
    locl_progress = coalesce(connections.locl_progress, 0),
    repute_status = coalesce(connections.repute_status, 'pending'),
    repute_progress = coalesce(connections.repute_progress, 0),
    ampli_status = coalesce(connections.ampli_status, 'pending'),
    ampli_progress = coalesce(connections.ampli_progress, 0),
    updated_at = now();
end;
$$;

revoke all on function public.complete_onboarding_atomic(uuid, text, text, text, text, text, text, text, text, boolean, text, text, jsonb, jsonb) from public;
grant execute on function public.complete_onboarding_atomic(uuid, text, text, text, text, text, text, text, text, boolean, text, text, jsonb, jsonb) to authenticated;
grant execute on function public.complete_onboarding_atomic(uuid, text, text, text, text, text, text, text, text, boolean, text, text, jsonb, jsonb) to service_role;

drop policy if exists connections_insert_same_org on public.connections;
create policy connections_insert_same_org
on public.connections
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.org_id = connections.org_id
  )
);

drop policy if exists connections_update_same_org on public.connections;
create policy connections_update_same_org
on public.connections
for update
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.org_id = connections.org_id
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.org_id = connections.org_id
  )
);

drop policy if exists connections_delete_same_org on public.connections;
create policy connections_delete_same_org
on public.connections
for delete
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.org_id = connections.org_id
  )
);
