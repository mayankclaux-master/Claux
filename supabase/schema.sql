create extension if not exists pgcrypto;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
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
  onboarding_step integer not null default 1,
  onboarding_completed boolean not null default false,
  created_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now()
);

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

create policy organizations_insert_creator_only
on public.organizations
for insert
to authenticated
with check (created_by = auth.uid());

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

create policy profiles_insert_self_only
on public.profiles
for insert
to authenticated
with check (id = auth.uid());

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
