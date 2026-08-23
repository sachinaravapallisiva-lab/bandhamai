-- Bandham AI — block, report, and account deletion (run in the Supabase SQL editor)
--
-- What this does:
--   1. public.blocks — a member hides another profile / account
--   2. public.reports — a reviewable safety report (kept even if someone later deletes)
--   3. public.account_deletion_requests — audit row when someone asks to close an account
--   4. Optional: if public.messages exists, block inserts between a blocked pair
--
-- Browse / Matches hide blocked people in /api/profiles/search after this is applied.
-- Chat should also refuse a send when either side blocked the other.
--
-- This is not a police dispatch system. Immediate danger stays with local authorities.

create table if not exists public.blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references auth.users (id) on delete cascade,
  blocked_profile_id text,
  blocked_user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint blocks_has_target check (
    blocked_profile_id is not null or blocked_user_id is not null
  ),
  constraint blocks_not_self check (
    blocked_user_id is null or blocked_user_id <> blocker_id
  )
);

create unique index if not exists blocks_blocker_profile_uidx
  on public.blocks (blocker_id, blocked_profile_id)
  where blocked_profile_id is not null;

create unique index if not exists blocks_blocker_user_uidx
  on public.blocks (blocker_id, blocked_user_id)
  where blocked_user_id is not null;

create index if not exists blocks_blocked_user_idx
  on public.blocks (blocked_user_id);

create index if not exists blocks_blocked_profile_idx
  on public.blocks (blocked_profile_id);

alter table public.blocks enable row level security;

drop policy if exists blocks_select_own on public.blocks;
create policy blocks_select_own
  on public.blocks
  for select
  to authenticated
  using (auth.uid() = blocker_id);

drop policy if exists blocks_insert_own on public.blocks;
create policy blocks_insert_own
  on public.blocks
  for insert
  to authenticated
  with check (auth.uid() = blocker_id);

drop policy if exists blocks_delete_own on public.blocks;
create policy blocks_delete_own
  on public.blocks
  for delete
  to authenticated
  using (auth.uid() = blocker_id);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references auth.users (id) on delete set null,
  reported_profile_id text,
  reported_user_id uuid,
  surface text not null default 'profile',
  reason text not null,
  details text,
  created_at timestamptz not null default now(),
  constraint reports_has_target check (
    reported_profile_id is not null or reported_user_id is not null
  )
);

create index if not exists reports_created_at_idx
  on public.reports (created_at desc);

create index if not exists reports_reported_profile_idx
  on public.reports (reported_profile_id);

alter table public.reports enable row level security;

drop policy if exists reports_select_own on public.reports;
create policy reports_select_own
  on public.reports
  for select
  to authenticated
  using (auth.uid() = reporter_id);

drop policy if exists reports_insert_own on public.reports;
create policy reports_insert_own
  on public.reports
  for insert
  to authenticated
  with check (auth.uid() = reporter_id);

create table if not exists public.account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  email text,
  status text not null default 'requested',
  login_removed boolean not null default false,
  profile_hidden boolean not null default false,
  note text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists account_deletion_requests_user_idx
  on public.account_deletion_requests (user_id, created_at desc);

alter table public.account_deletion_requests enable row level security;

drop policy if exists account_deletion_requests_select_own on public.account_deletion_requests;
create policy account_deletion_requests_select_own
  on public.account_deletion_requests
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists account_deletion_requests_insert_own on public.account_deletion_requests;
create policy account_deletion_requests_insert_own
  on public.account_deletion_requests
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Read both sides of a block. Lives in a private schema (security definer
-- must not sit in the exposed public schema).
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to postgres, service_role, authenticated;

create or replace function private.bandham_pair_is_blocked(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    a is not null
    and b is not null
    and a <> b
    and exists (
      select 1
      from public.blocks
      where (blocker_id = a and blocked_user_id = b)
         or (blocker_id = b and blocked_user_id = a)
    );
$$;

revoke all on function private.bandham_pair_is_blocked(uuid, uuid) from public, anon;
grant execute on function private.bandham_pair_is_blocked(uuid, uuid) to authenticated, service_role;

-- If chat already has public.messages, stop a send between a blocked pair.
-- Service-role API writes still bypass RLS; the app checks blocks before insert too.
do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public' and table_name = 'messages'
  ) then
    if exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'messages'
        and column_name = 'sender_id'
    ) and exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'messages'
        and column_name = 'recipient_id'
    ) then
      execute 'alter table public.messages enable row level security';

      execute 'drop policy if exists messages_no_blocked_insert on public.messages';
      execute $policy$
        create policy messages_no_blocked_insert
        on public.messages
        for insert
        to authenticated
        with check (
          auth.uid() = sender_id
          and not private.bandham_pair_is_blocked(sender_id, recipient_id)
        )
      $policy$;
    end if;
  end if;
end $$;

-- Confirm:
-- select * from public.blocks order by created_at desc limit 10;
-- select id, reason, surface, created_at from public.reports order by created_at desc limit 10;
