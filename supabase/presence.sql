-- Bandham AI — signed-in online / offline (run in the Supabase SQL editor)
--
-- What this does:
--   1. public.presence — one row per auth user
--   2. last_seen_at is written by POST /api/presence/heartbeat
--   3. Browse treats last_seen within ~3 minutes as Online (green)
--   4. Seeded sample profiles without user_id stay Offline
--
-- This table is only last_seen activity. It does not store a
-- verification badge or a score. Do not seed last_seen by hand
-- unless you are testing the green mark.
--
-- Until this file is applied, heartbeat returns 503 and Browse cards
-- stay Offline.

create table if not exists public.presence (
  user_id uuid primary key references auth.users (id) on delete cascade,
  last_seen_at timestamptz not null default now(),
  profile_id text
);

create index if not exists presence_last_seen_idx
  on public.presence (last_seen_at desc);

create index if not exists presence_profile_idx
  on public.presence (profile_id)
  where profile_id is not null;

alter table public.presence enable row level security;

revoke all on public.presence from public, anon;
grant select, insert, update on public.presence to authenticated;
grant all on public.presence to service_role;

-- Authenticated members can read last_seen for their own row or for a
-- live Browse profile. Service-role API reads bypass RLS.
drop policy if exists presence_select_live_or_own on public.presence;
create policy presence_select_live_or_own
  on public.presence
  for select
  to authenticated
  using (
    auth.uid() = user_id
    or exists (
      select 1
      from public.profiles p
      where p.user_id = presence.user_id
        and p.status = 'live'
    )
  );

drop policy if exists presence_insert_own on public.presence;
create policy presence_insert_own
  on public.presence
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- UPDATE also needs the SELECT policy above (Postgres RLS).
drop policy if exists presence_update_own on public.presence;
create policy presence_update_own
  on public.presence
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Confirm:
-- select user_id, last_seen_at, profile_id
-- from public.presence
-- order by last_seen_at desc
-- limit 20;
