-- Bandham AI — quiet in-app profile views (run in the Supabase SQL editor)
--
-- What this does:
--   1. public.profile_views — one row per viewer and viewed profile
--   2. Unique (viewer_id, profile_id) so a later open refreshes created_at
--   3. RLS: a viewer can insert and select their own outgoing rows, and
--      update created_at on those rows. The viewed member can select
--      incoming rows. Anon cannot read. Service role is unchanged.
--
-- This table is only who opened whose profile. It is not swipe storage.
-- Browse stays free. There is no email and no push from this file.
--
-- Until this file is applied, POST /api/profile-views returns 503 and
-- cards stay without the Seen chip. Browse still works.

create table if not exists public.profile_views (
  id uuid primary key default gen_random_uuid(),
  viewer_id uuid not null references auth.users (id) on delete cascade,
  profile_id text not null,
  viewed_user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint profile_views_pair_unique unique (viewer_id, profile_id),
  constraint profile_views_not_self check (
    viewed_user_id is null or viewed_user_id <> viewer_id
  )
);

create index if not exists profile_views_profile_idx
  on public.profile_views (profile_id, created_at desc);

create index if not exists profile_views_viewed_user_idx
  on public.profile_views (viewed_user_id, created_at desc)
  where viewed_user_id is not null;

create index if not exists profile_views_viewer_idx
  on public.profile_views (viewer_id);

alter table public.profile_views enable row level security;

revoke all on public.profile_views from public, anon;
grant select, insert, update on public.profile_views to authenticated;
grant all on public.profile_views to service_role;

drop policy if exists profile_views_select_own on public.profile_views;
create policy profile_views_select_own
  on public.profile_views
  for select
  to authenticated
  using (
    auth.uid() = viewer_id
    or auth.uid() = viewed_user_id
    or exists (
      select 1
      from public.profiles p
      where p.user_id = auth.uid()
        and p.id::text = profile_views.profile_id
    )
  );

drop policy if exists profile_views_insert_own on public.profile_views;
create policy profile_views_insert_own
  on public.profile_views
  for insert
  to authenticated
  with check (
    auth.uid() = viewer_id
    and (viewed_user_id is null or viewed_user_id <> viewer_id)
  );

-- UPDATE also needs the SELECT policy above (Postgres RLS).
-- Repeat opens refresh created_at instead of adding rows.
drop policy if exists profile_views_update_own on public.profile_views;
create policy profile_views_update_own
  on public.profile_views
  for update
  to authenticated
  using (auth.uid() = viewer_id)
  with check (auth.uid() = viewer_id);

-- Confirm:
-- select viewer_id, profile_id, viewed_user_id, created_at
-- from public.profile_views
-- order by created_at desc
-- limit 20;
