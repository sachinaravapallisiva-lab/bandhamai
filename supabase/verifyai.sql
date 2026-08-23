-- Bandham AI — VerifyAI status on profiles (run in the Supabase SQL editor)
--
-- VerifyAI (verifyai.llc) is the verification layer for Bandham profiles.
-- It is not a second matrimony product in this UI.
--
-- What this does:
--   1. profiles.verifyai_status — unverified | pending | verified | failed | revoked
--   2. profiles.verifyai_external_id — id from the live VerifyAI service, when wired
--   3. profiles.verifyai_updated_at
--
-- The quiet VERIFYAI badge renders only when verifyai_status = 'verified'.
-- Do not seed this column to verified by hand unless VerifyAI actually passed.
--
-- After you have a VerifyAI webhook secret, set VERIFYAI_WEBHOOK_SECRET on Vercel
-- and point the service at POST /api/verifyai/webhook. See README.

alter table public.profiles
  add column if not exists verifyai_status text;

alter table public.profiles
  add column if not exists verifyai_external_id text;

alter table public.profiles
  add column if not exists verifyai_updated_at timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_verifyai_status_check'
  ) then
    alter table public.profiles
      add constraint profiles_verifyai_status_check
      check (
        verifyai_status is null
        or verifyai_status in ('unverified', 'pending', 'verified', 'failed', 'revoked')
      );
  end if;
end $$;

-- Members must not self-write a verified badge. Service-role API / webhook only.
-- Existing profile RLS (if any) should already block arbitrary column updates
-- from the anon key. Do not add a public update policy for these columns.

-- Confirm:
-- select id, full_name, status, verifyai_status, verifyai_updated_at
-- from public.profiles
-- order by created_at desc
-- limit 20;
