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

-- $4.99 one-time payment + VerifyAI session. Paying must NOT set verified.
-- Badge is only verifyai_status = 'verified' after the VerifyAI flow succeeds.

create table if not exists public.verifyai_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  profile_id text,
  stripe_checkout_session_id text not null unique,
  stripe_payment_intent_id text,
  amount_cents integer not null default 499,
  status text not null default 'paid',
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists verifyai_payments_user_idx
  on public.verifyai_payments (user_id, created_at desc);

alter table public.verifyai_payments enable row level security;

drop policy if exists verifyai_payments_select_own on public.verifyai_payments;
create policy verifyai_payments_select_own
  on public.verifyai_payments
  for select
  to authenticated
  using (auth.uid() = user_id);

create table if not exists public.verifyai_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  profile_id text,
  stripe_checkout_session_id text,
  verifyai_external_id text,
  status text not null default 'awaiting_verifyai',
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists verifyai_sessions_user_idx
  on public.verifyai_sessions (user_id, created_at desc);

create unique index if not exists verifyai_sessions_checkout_idx
  on public.verifyai_sessions (stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;

alter table public.verifyai_sessions enable row level security;

drop policy if exists verifyai_sessions_select_own on public.verifyai_sessions;
create policy verifyai_sessions_select_own
  on public.verifyai_sessions
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Confirm:
-- select id, full_name, status, verifyai_status, verifyai_updated_at
-- from public.profiles
-- order by created_at desc
-- limit 20;
-- select user_id, amount_cents, status, stripe_checkout_session_id from public.verifyai_payments;
