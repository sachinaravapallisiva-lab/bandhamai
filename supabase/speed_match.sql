-- Bandham AI — Speed Match rounds (run in the Supabase SQL editor)
--
-- What this does:
--   1. Creates public.speed_match_rounds
--   2. Turns on RLS (members can read/insert their own rows)
--   3. Stores the 10 answers as jsonb — no score, no match %
--
-- The playable UI works without this table (session-local). After you run
-- this, signed-in POST /api/speed-match writes the completed round.
--
-- Parked for Sai (not in this file):
--   - Like / Pass persist (still client-only on Browse)
--   - Comparing both people's answers / mutual reveal
--   - Extra dealbreaker prompts that did not fit the locked 10:
--     language at home (Telugu etc.), alcohol / smoking comfort
--   - Do not add a match_percent or compatibility column

create table if not exists public.speed_match_rounds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  partner_profile_id text not null,
  answers jsonb not null default '[]'::jsonb,
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists speed_match_rounds_user_id_idx
  on public.speed_match_rounds (user_id, created_at desc);

alter table public.speed_match_rounds enable row level security;

drop policy if exists speed_match_rounds_select_own on public.speed_match_rounds;
create policy speed_match_rounds_select_own
  on public.speed_match_rounds
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists speed_match_rounds_insert_own on public.speed_match_rounds;
create policy speed_match_rounds_insert_own
  on public.speed_match_rounds
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Service-role writes from POST /api/speed-match bypass RLS.
-- Confirm:
-- select id, user_id, partner_profile_id, completed_at
-- from public.speed_match_rounds
-- order by created_at desc
-- limit 10;
