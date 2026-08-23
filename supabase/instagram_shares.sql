-- Bandham AI — Instagram visibility shares (run in the Supabase SQL editor)
--
-- Sai: run this after supabase/instagram.sql. Linking a handle stays optional.
-- The handle is stored on public.profiles.instagram. This table is who the
-- owner chose to show it to. It is not public on Browse and is not granted
-- by Like or a match.
--
-- What this does:
--   1. public.instagram_shares — one row per owner → viewer pair
--   2. Unique (owner_user_id, viewer_user_id)
--   3. RLS: owner inserts/deletes own shares; owner or viewer can select
--
-- The app:
--   - POST /api/instagram/share when the owner taps “Show my Instagram to them”
--   - DELETE /api/instagram/share to revoke
--   - Browse / Matches JSON includes instagram only when a share exists
--     (or the viewer is looking at their own profile)
--
-- Until this runs, Browse never returns Instagram handles.
-- Share actions return 503 and ask you to run this file.
--
-- This is not a verification badge and not a match score.

create table if not exists public.instagram_shares (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users (id) on delete cascade,
  viewer_user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint instagram_shares_not_self check (owner_user_id <> viewer_user_id),
  constraint instagram_shares_pair_unique unique (owner_user_id, viewer_user_id)
);

create index if not exists instagram_shares_viewer_idx
  on public.instagram_shares (viewer_user_id);

create index if not exists instagram_shares_owner_idx
  on public.instagram_shares (owner_user_id);

alter table public.instagram_shares enable row level security;

revoke all on public.instagram_shares from public, anon;
grant select, insert, delete on public.instagram_shares to authenticated;
grant all on public.instagram_shares to service_role;

drop policy if exists instagram_shares_select_party on public.instagram_shares;
create policy instagram_shares_select_party
  on public.instagram_shares
  for select
  to authenticated
  using (auth.uid() = owner_user_id or auth.uid() = viewer_user_id);

drop policy if exists instagram_shares_insert_own on public.instagram_shares;
create policy instagram_shares_insert_own
  on public.instagram_shares
  for insert
  to authenticated
  with check (auth.uid() = owner_user_id and owner_user_id <> viewer_user_id);

drop policy if exists instagram_shares_delete_own on public.instagram_shares;
create policy instagram_shares_delete_own
  on public.instagram_shares
  for delete
  to authenticated
  using (auth.uid() = owner_user_id);

-- Confirm:
-- select owner_user_id, viewer_user_id, created_at
-- from public.instagram_shares
-- order by created_at desc
-- limit 20;
