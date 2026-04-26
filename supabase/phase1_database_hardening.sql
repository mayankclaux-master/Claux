begin;

create extension if not exists pgcrypto;

-- 1) Organizations hardening
alter table public.organizations
  add column if not exists api_secret uuid not null default gen_random_uuid();

-- 2) Telemetry table
create table if not exists public.agent_activities (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  agent_name text not null,
  status_message text not null,
  status text not null check (status in ('pending', 'completed', 'failed')),
  created_at timestamptz not null default now()
);

create index if not exists idx_agent_activities_org_id on public.agent_activities (org_id);
create index if not exists idx_agent_activities_created_at on public.agent_activities (created_at desc);

alter table public.agent_activities enable row level security;

-- Remove/recreate to keep migration idempotent and deterministic
drop policy if exists agent_activities_select_same_org on public.agent_activities;
create policy agent_activities_select_same_org
on public.agent_activities
for select
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.org_id = agent_activities.org_id
  )
);

-- 3) Keyword vault table
create table if not exists public.keyword_insights (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  keyword text not null,
  volume integer,
  difficulty numeric(5,2),
  position integer,
  agent_name text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_keyword_insights_org_id on public.keyword_insights (org_id);
create index if not exists idx_keyword_insights_keyword on public.keyword_insights (keyword);
create index if not exists idx_keyword_insights_created_at on public.keyword_insights (created_at desc);

alter table public.keyword_insights enable row level security;

drop policy if exists keyword_insights_select_same_org on public.keyword_insights;
create policy keyword_insights_select_same_org
on public.keyword_insights
for select
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.org_id = keyword_insights.org_id
  )
);

-- 4) Realtime for agent_activities
-- Add table to supabase_realtime publication if not already present.
do $$
begin
  if exists (
    select 1
    from pg_publication
    where pubname = 'supabase_realtime'
  ) then
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'agent_activities'
    ) then
      execute 'alter publication supabase_realtime add table public.agent_activities';
    end if;
  end if;
end $$;

commit;
