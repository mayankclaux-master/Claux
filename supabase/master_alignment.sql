begin;

-- 1) Organizations alignment
alter table public.organizations
  add column if not exists website_url text;

alter table public.organizations
  add column if not exists onboarding_status text;

alter table public.organizations
  add column if not exists onboarding_step integer not null default 1;

alter table public.organizations
  add column if not exists onboarding_completed boolean not null default false;

-- 2) Connections alignment
alter table public.connections
  add column if not exists tech_stack text not null default 'unknown';

alter table public.connections
  add column if not exists seo_has_ssl boolean;

-- This column is used by current onboarding API payloads.
alter table public.connections
  add column if not exists seo_has_robots_txt boolean;

-- 3) RLS alignment for connections
alter table public.connections enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'connections'
      and policyname = 'connections_select_same_org'
  ) then
    execute $policy$
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
      )
    $policy$;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'connections'
      and policyname = 'connections_insert_same_org'
  ) then
    execute $policy$
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
      )
    $policy$;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'connections'
      and policyname = 'connections_update_same_org'
  ) then
    execute $policy$
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
      )
    $policy$;
  end if;
end $$;

commit;
