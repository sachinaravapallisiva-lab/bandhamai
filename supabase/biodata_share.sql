-- Bandham AI — biodata download opt-in (run in the Supabase SQL editor)
--
-- Sai: run this once. Members can let other signed-in people download their
-- biodata PDF. Default is off. This is matrimony privacy, not a dating share.
--
-- What this does:
--   1. Adds public.profiles.biodata_share (boolean, not null, default false)
--   2. Existing live-profile SELECT policies (if any) already expose this
--      column to Browse. Do not add a public UPDATE policy. Owners write
--      through POST/PATCH /api/profiles (service role).
--
-- The app:
--   - Checkbox on /profile/new and /account, default unchecked
--   - GET /api/profiles/biodata?id=… only if the target is live AND
--     biodata_share is true AND the viewer is signed in
--   - Own profile download stays allowed without this flag
--   - PDF generation still checks the flag server-side
--   - Instagram in the PDF still follows the existing share/reveal rules
--
-- Until this runs, other-person download stays closed (treated as false).
-- Own-profile Download biodata on /account and /profile/new is unchanged.

alter table public.profiles
  add column if not exists biodata_share boolean not null default false;

comment on column public.profiles.biodata_share is
  'Owner opt-in for other signed-in members to download biodata. Default false.';

-- Confirm:
-- select id, full_name, status, biodata_share
-- from public.profiles
-- where status = 'live'
-- limit 20;
