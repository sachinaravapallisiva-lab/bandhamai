-- Bandham AI — Gun Milan (run in the Supabase SQL editor)
--
-- Sai / CoS: run this once. Birth details stay private. The paid Prokerala
-- Kundali Matching API does the chart math. The Bandham assistant only
-- explains a stored report. Do not invent religion or caste columns.
--
-- What this does:
--   1. public.profiles.kundli_share (boolean, not null, default false)
--   2. public.profile_birth_details — owner read/write only
--   3. public.gun_milan_reports — cached raw API JSON for a pair
--
-- Privacy:
--   - Birth date, time, place, lat, lon, and time zone are NEVER public
--     on Browse. Live profile SELECT policies must not expose this table.
--   - Other person Gun Milan only when BOTH have complete birth details
--     AND the other member opted in (kundli_share).
--   - Reports: either party may SELECT their pair. Writes stay service role.
--
-- Until this runs, Gun Milan APIs return 503 and ask you to run this file.

alter table public.profiles
  add column if not exists kundli_share boolean not null default false;

comment on column public.profiles.kundli_share is
  'Owner opt-in for other signed-in members to run Gun Milan. Default false.';

create table if not exists public.profile_birth_details (
  user_id uuid primary key references auth.users (id) on delete cascade,
  profile_id text,
  birth_date date not null,
  birth_time time not null,
  place_name text not null,
  latitude double precision not null,
  longitude double precision not null,
  timezone text not null,
  updated_at timestamptz not null default now(),
  constraint profile_birth_details_timezone_check
    check (timezone ~ '^[+-][0-9]{2}:[0-9]{2}$'),
  constraint profile_birth_details_lat_check
    check (latitude >= -90 and latitude <= 90),
  constraint profile_birth_details_lon_check
    check (longitude >= -180 and longitude <= 180)
);

create index if not exists profile_birth_details_profile_idx
  on public.profile_birth_details (profile_id)
  where profile_id is not null;

comment on table public.profile_birth_details is
  'Private birth chart inputs for Gun Milan. Owner read/write. Not a Browse field.';

alter table public.profile_birth_details enable row level security;

revoke all on public.profile_birth_details from public, anon;
grant select, insert, update, delete on public.profile_birth_details to authenticated;
grant all on public.profile_birth_details to service_role;

drop policy if exists profile_birth_details_select_own on public.profile_birth_details;
create policy profile_birth_details_select_own
  on public.profile_birth_details
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists profile_birth_details_insert_own on public.profile_birth_details;
create policy profile_birth_details_insert_own
  on public.profile_birth_details
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists profile_birth_details_update_own on public.profile_birth_details;
create policy profile_birth_details_update_own
  on public.profile_birth_details
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists profile_birth_details_delete_own on public.profile_birth_details;
create policy profile_birth_details_delete_own
  on public.profile_birth_details
  for delete
  to authenticated
  using (auth.uid() = user_id);

create table if not exists public.gun_milan_reports (
  id uuid primary key default gen_random_uuid(),
  profile_low text not null,
  profile_high text not null,
  user_low uuid references auth.users (id) on delete cascade,
  user_high uuid references auth.users (id) on delete cascade,
  provider text not null,
  raw jsonb not null,
  birth_fingerprint text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint gun_milan_reports_pair_unique unique (profile_low, profile_high),
  constraint gun_milan_reports_order check (profile_low < profile_high)
);

create index if not exists gun_milan_reports_users_idx
  on public.gun_milan_reports (user_low, user_high);

comment on table public.gun_milan_reports is
  'Cached raw paid Gun Milan API report for a pair. Do not recompute in app code.';

alter table public.gun_milan_reports enable row level security;

revoke all on public.gun_milan_reports from public, anon;
grant select on public.gun_milan_reports to authenticated;
grant all on public.gun_milan_reports to service_role;

drop policy if exists gun_milan_reports_select_party on public.gun_milan_reports;
create policy gun_milan_reports_select_party
  on public.gun_milan_reports
  for select
  to authenticated
  using (auth.uid() = user_low or auth.uid() = user_high);

-- Confirm:
-- select column_name from information_schema.columns
--   where table_schema = 'public' and table_name = 'profiles' and column_name = 'kundli_share';
-- select user_id, birth_date, place_name from public.profile_birth_details limit 5;
-- select profile_low, profile_high, provider from public.gun_milan_reports limit 5;
