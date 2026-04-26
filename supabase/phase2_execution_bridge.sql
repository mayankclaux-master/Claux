begin;

create extension if not exists pgcrypto;

-- Task 1: Vault and CMS schema
create table if not exists public.cms_connections (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  provider text not null check (provider in ('wordpress', 'shopify', 'laravel')),
  connection_label text not null default 'primary',
  base_url text not null,
  auth_type text not null default 'token' check (auth_type in ('basic', 'token', 'oauth', 'api_key', 'signed_webhook', 'custom')),
  credential_ref text,
  webhook_url text,
  webhook_secret_ref text,
  capabilities jsonb not null default '{}'::jsonb,
  is_verified boolean not null default false,
  verification_status text not null default 'pending' check (verification_status in ('pending', 'verified', 'failed')),
  verification_error text,
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, provider, connection_label)
);

create index if not exists idx_cms_connections_org_id on public.cms_connections (org_id);
create index if not exists idx_cms_connections_provider on public.cms_connections (provider);
create index if not exists idx_cms_connections_verification_status on public.cms_connections (verification_status);

create table if not exists public.agent_credentials (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  provider text not null check (
    provider in (
      'gsc',
      'gbp',
      'meta_graph',
      'evolution_api',
      'openai',
      'claude',
      'perplexity',
      'heygen',
      'flux',
      'dalle',
      'wordpress',
      'shopify',
      'laravel'
    )
  ),
  credential_key text not null,
  vault_secret_id uuid,
  encrypted_value text,
  metadata jsonb not null default '{}'::jsonb,
  rotation_status text not null default 'active' check (rotation_status in ('active', 'rotating', 'revoked', 'expired')),
  last_validated_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, provider, credential_key),
  check (vault_secret_id is not null or encrypted_value is not null)
);

create index if not exists idx_agent_credentials_org_id on public.agent_credentials (org_id);
create index if not exists idx_agent_credentials_provider on public.agent_credentials (provider);

-- Task 1: Connections table execution-state columns for all 9 agents
alter table public.connections add column if not exists aria_status text not null default 'pending';
alter table public.connections add column if not exists aria_progress integer not null default 0;
alter table public.connections add column if not exists scribe_status text not null default 'pending';
alter table public.connections add column if not exists scribe_progress integer not null default 0;
alter table public.connections add column if not exists visual_status text not null default 'pending';
alter table public.connections add column if not exists visual_progress integer not null default 0;
alter table public.connections add column if not exists forge_status text not null default 'pending';
alter table public.connections add column if not exists forge_progress integer not null default 0;
alter table public.connections add column if not exists core_status text not null default 'pending';
alter table public.connections add column if not exists core_progress integer not null default 0;
alter table public.connections add column if not exists linx_status text not null default 'pending';
alter table public.connections add column if not exists linx_progress integer not null default 0;
alter table public.connections add column if not exists locl_status text not null default 'pending';
alter table public.connections add column if not exists locl_progress integer not null default 0;
alter table public.connections add column if not exists repute_status text not null default 'pending';
alter table public.connections add column if not exists repute_progress integer not null default 0;
alter table public.connections add column if not exists ampli_status text not null default 'pending';
alter table public.connections add column if not exists ampli_progress integer not null default 0;

-- Task 2: Execution plane tables
create table if not exists public.agent_tasks (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  parent_task_id uuid references public.agent_tasks (id) on delete set null,
  orchestrator_run_id text,
  agent_name text not null check (
    agent_name in ('ARIA', 'SCRIBE', 'VISUAL', 'FORGE', 'CORE', 'LINX', 'LOCL', 'REPUTE', 'AMPLI')
  ),
  task_type text not null,
  status text not null default 'queued' check (status in ('queued', 'in_progress', 'completed', 'failed', 'cancelled')),
  priority smallint not null default 50,
  payload jsonb not null default '{}'::jsonb,
  input_refs jsonb not null default '[]'::jsonb,
  requested_by text not null default 'orchestrator',
  scheduled_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  failed_at timestamptz,
  last_heartbeat_at timestamptz,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_agent_tasks_org_id on public.agent_tasks (org_id);
create index if not exists idx_agent_tasks_org_status on public.agent_tasks (org_id, status);
create index if not exists idx_agent_tasks_org_agent on public.agent_tasks (org_id, agent_name);
create index if not exists idx_agent_tasks_created_at on public.agent_tasks (created_at desc);

create table if not exists public.agent_runs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  task_id uuid not null references public.agent_tasks (id) on delete cascade,
  agent_name text not null check (
    agent_name in ('ARIA', 'SCRIBE', 'VISUAL', 'FORGE', 'CORE', 'LINX', 'LOCL', 'REPUTE', 'AMPLI')
  ),
  status text not null default 'running' check (status in ('running', 'completed', 'failed', 'cancelled')),
  attempt integer not null default 1,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  duration_ms integer,
  output_summary text,
  output_payload jsonb not null default '{}'::jsonb,
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists idx_agent_runs_org_id on public.agent_runs (org_id);
create index if not exists idx_agent_runs_task_id on public.agent_runs (task_id);
create index if not exists idx_agent_runs_org_agent on public.agent_runs (org_id, agent_name);
create index if not exists idx_agent_runs_created_at on public.agent_runs (created_at desc);

-- Task 2: Agent artifacts (SCRIBE, VISUAL, REPUTE)
create table if not exists public.agent_artifacts_scribe_content (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  task_id uuid references public.agent_tasks (id) on delete set null,
  run_id uuid references public.agent_runs (id) on delete set null,
  title text not null,
  slug text,
  keyword text,
  language text,
  content_markdown text,
  content_html text,
  seo_meta jsonb not null default '{}'::jsonb,
  publish_target text,
  publish_status text not null default 'draft' check (publish_status in ('draft', 'queued', 'published', 'failed')),
  external_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_scribe_artifacts_org_id on public.agent_artifacts_scribe_content (org_id);
create index if not exists idx_scribe_artifacts_task_id on public.agent_artifacts_scribe_content (task_id);
create index if not exists idx_scribe_artifacts_created_at on public.agent_artifacts_scribe_content (created_at desc);

create table if not exists public.agent_artifacts_visual_images (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  task_id uuid references public.agent_tasks (id) on delete set null,
  run_id uuid references public.agent_runs (id) on delete set null,
  prompt text not null,
  style text,
  generation_model text,
  image_url text,
  storage_path text,
  width integer,
  height integer,
  mime_type text,
  alt_text text,
  og_image_for_url text,
  status text not null default 'generated' check (status in ('queued', 'generated', 'failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_visual_artifacts_org_id on public.agent_artifacts_visual_images (org_id);
create index if not exists idx_visual_artifacts_task_id on public.agent_artifacts_visual_images (task_id);
create index if not exists idx_visual_artifacts_created_at on public.agent_artifacts_visual_images (created_at desc);

create table if not exists public.agent_artifacts_repute_reviews (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  task_id uuid references public.agent_tasks (id) on delete set null,
  run_id uuid references public.agent_runs (id) on delete set null,
  source_platform text not null check (source_platform in ('google', 'facebook', 'whatsapp', 'website', 'other')),
  source_review_id text,
  reviewer_name text,
  rating smallint not null check (rating between 1 and 5),
  review_text text,
  sentiment text not null default 'neutral' check (sentiment in ('negative', 'neutral', 'positive')),
  routing_action text not null check (routing_action in ('private_vault', 'public_publish', 'manual_review')),
  is_public boolean not null default false,
  responded boolean not null default false,
  response_text text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_repute_artifacts_org_id on public.agent_artifacts_repute_reviews (org_id);
create index if not exists idx_repute_artifacts_task_id on public.agent_artifacts_repute_reviews (task_id);
create index if not exists idx_repute_artifacts_rating on public.agent_artifacts_repute_reviews (rating);
create index if not exists idx_repute_artifacts_created_at on public.agent_artifacts_repute_reviews (created_at desc);

-- RLS enablement
alter table public.cms_connections enable row level security;
alter table public.agent_credentials enable row level security;
alter table public.agent_tasks enable row level security;
alter table public.agent_runs enable row level security;
alter table public.agent_artifacts_scribe_content enable row level security;
alter table public.agent_artifacts_visual_images enable row level security;
alter table public.agent_artifacts_repute_reviews enable row level security;

-- RLS policies: cms_connections
drop policy if exists cms_connections_select_same_org on public.cms_connections;
create policy cms_connections_select_same_org
on public.cms_connections
for select
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.org_id = cms_connections.org_id
  )
);

drop policy if exists cms_connections_insert_same_org on public.cms_connections;
create policy cms_connections_insert_same_org
on public.cms_connections
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.org_id = cms_connections.org_id
  )
);

drop policy if exists cms_connections_update_same_org on public.cms_connections;
create policy cms_connections_update_same_org
on public.cms_connections
for update
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.org_id = cms_connections.org_id
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.org_id = cms_connections.org_id
  )
);

drop policy if exists cms_connections_delete_same_org on public.cms_connections;
create policy cms_connections_delete_same_org
on public.cms_connections
for delete
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.org_id = cms_connections.org_id
  )
);

-- RLS policies: agent_credentials (owner/admin only)
drop policy if exists agent_credentials_select_org_admin on public.agent_credentials;
create policy agent_credentials_select_org_admin
on public.agent_credentials
for select
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.org_id = agent_credentials.org_id
      and p.role in ('owner', 'admin')
  )
);

drop policy if exists agent_credentials_insert_org_admin on public.agent_credentials;
create policy agent_credentials_insert_org_admin
on public.agent_credentials
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.org_id = agent_credentials.org_id
      and p.role in ('owner', 'admin')
  )
);

drop policy if exists agent_credentials_update_org_admin on public.agent_credentials;
create policy agent_credentials_update_org_admin
on public.agent_credentials
for update
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.org_id = agent_credentials.org_id
      and p.role in ('owner', 'admin')
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.org_id = agent_credentials.org_id
      and p.role in ('owner', 'admin')
  )
);

drop policy if exists agent_credentials_delete_org_admin on public.agent_credentials;
create policy agent_credentials_delete_org_admin
on public.agent_credentials
for delete
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.org_id = agent_credentials.org_id
      and p.role in ('owner', 'admin')
  )
);

-- RLS policies: agent_tasks
drop policy if exists agent_tasks_select_same_org on public.agent_tasks;
create policy agent_tasks_select_same_org
on public.agent_tasks
for select
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.org_id = agent_tasks.org_id
  )
);

drop policy if exists agent_tasks_insert_same_org on public.agent_tasks;
create policy agent_tasks_insert_same_org
on public.agent_tasks
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.org_id = agent_tasks.org_id
  )
);

drop policy if exists agent_tasks_update_same_org on public.agent_tasks;
create policy agent_tasks_update_same_org
on public.agent_tasks
for update
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.org_id = agent_tasks.org_id
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.org_id = agent_tasks.org_id
  )
);

drop policy if exists agent_tasks_delete_same_org on public.agent_tasks;
create policy agent_tasks_delete_same_org
on public.agent_tasks
for delete
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.org_id = agent_tasks.org_id
  )
);

-- RLS policies: agent_runs
drop policy if exists agent_runs_select_same_org on public.agent_runs;
create policy agent_runs_select_same_org
on public.agent_runs
for select
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.org_id = agent_runs.org_id
  )
);

drop policy if exists agent_runs_insert_same_org on public.agent_runs;
create policy agent_runs_insert_same_org
on public.agent_runs
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.org_id = agent_runs.org_id
  )
);

drop policy if exists agent_runs_update_same_org on public.agent_runs;
create policy agent_runs_update_same_org
on public.agent_runs
for update
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.org_id = agent_runs.org_id
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.org_id = agent_runs.org_id
  )
);

drop policy if exists agent_runs_delete_same_org on public.agent_runs;
create policy agent_runs_delete_same_org
on public.agent_runs
for delete
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.org_id = agent_runs.org_id
  )
);

-- RLS policies: scribe artifacts
drop policy if exists scribe_artifacts_select_same_org on public.agent_artifacts_scribe_content;
create policy scribe_artifacts_select_same_org
on public.agent_artifacts_scribe_content
for select
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.org_id = agent_artifacts_scribe_content.org_id
  )
);

drop policy if exists scribe_artifacts_insert_same_org on public.agent_artifacts_scribe_content;
create policy scribe_artifacts_insert_same_org
on public.agent_artifacts_scribe_content
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.org_id = agent_artifacts_scribe_content.org_id
  )
);

drop policy if exists scribe_artifacts_update_same_org on public.agent_artifacts_scribe_content;
create policy scribe_artifacts_update_same_org
on public.agent_artifacts_scribe_content
for update
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.org_id = agent_artifacts_scribe_content.org_id
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.org_id = agent_artifacts_scribe_content.org_id
  )
);

drop policy if exists scribe_artifacts_delete_same_org on public.agent_artifacts_scribe_content;
create policy scribe_artifacts_delete_same_org
on public.agent_artifacts_scribe_content
for delete
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.org_id = agent_artifacts_scribe_content.org_id
  )
);

-- RLS policies: visual artifacts
drop policy if exists visual_artifacts_select_same_org on public.agent_artifacts_visual_images;
create policy visual_artifacts_select_same_org
on public.agent_artifacts_visual_images
for select
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.org_id = agent_artifacts_visual_images.org_id
  )
);

drop policy if exists visual_artifacts_insert_same_org on public.agent_artifacts_visual_images;
create policy visual_artifacts_insert_same_org
on public.agent_artifacts_visual_images
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.org_id = agent_artifacts_visual_images.org_id
  )
);

drop policy if exists visual_artifacts_update_same_org on public.agent_artifacts_visual_images;
create policy visual_artifacts_update_same_org
on public.agent_artifacts_visual_images
for update
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.org_id = agent_artifacts_visual_images.org_id
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.org_id = agent_artifacts_visual_images.org_id
  )
);

drop policy if exists visual_artifacts_delete_same_org on public.agent_artifacts_visual_images;
create policy visual_artifacts_delete_same_org
on public.agent_artifacts_visual_images
for delete
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.org_id = agent_artifacts_visual_images.org_id
  )
);

-- RLS policies: repute artifacts
drop policy if exists repute_artifacts_select_same_org on public.agent_artifacts_repute_reviews;
create policy repute_artifacts_select_same_org
on public.agent_artifacts_repute_reviews
for select
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.org_id = agent_artifacts_repute_reviews.org_id
  )
);

drop policy if exists repute_artifacts_insert_same_org on public.agent_artifacts_repute_reviews;
create policy repute_artifacts_insert_same_org
on public.agent_artifacts_repute_reviews
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.org_id = agent_artifacts_repute_reviews.org_id
  )
);

drop policy if exists repute_artifacts_update_same_org on public.agent_artifacts_repute_reviews;
create policy repute_artifacts_update_same_org
on public.agent_artifacts_repute_reviews
for update
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.org_id = agent_artifacts_repute_reviews.org_id
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.org_id = agent_artifacts_repute_reviews.org_id
  )
);

drop policy if exists repute_artifacts_delete_same_org on public.agent_artifacts_repute_reviews;
create policy repute_artifacts_delete_same_org
on public.agent_artifacts_repute_reviews
for delete
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.org_id = agent_artifacts_repute_reviews.org_id
  )
);

-- Realtime publications for execution surfaces
DO $$
BEGIN
  IF exists (
    select 1
    from pg_publication
    where pubname = 'supabase_realtime'
  ) THEN
    IF not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'agent_tasks'
    ) THEN
      execute 'alter publication supabase_realtime add table public.agent_tasks';
    END IF;

    IF not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'agent_runs'
    ) THEN
      execute 'alter publication supabase_realtime add table public.agent_runs';
    END IF;

    IF not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'connections'
    ) THEN
      execute 'alter publication supabase_realtime add table public.connections';
    END IF;
  END IF;
END $$;

commit;
