-- Bandham AI — subscribe reminder call opt-in (run in the Supabase SQL editor)
--
-- Sai: 24 Aug 2026. Regular members may get one voice check-in every 15 days
-- if they saved a phone on their own profile AND tapped opt-in. Default is off.
-- This is a marketing call in the US, Australia, the UK, the EU, and Ireland.
--
-- Hard locks:
--   1. Do not scrape or buy numbers. Phone is only what the member saved here.
--   2. Premium / entitled members are never called (enforced in app, not SQL).
--   3. No public read of phones. Browse must not select these columns.
--   4. last_subscribe_call_at is server-only. Members cannot write it.
--   5. This file does not place calls. The app dry-run lists eligible rows only.
--
-- What this does:
--   1. Ensures public.profiles.phone exists (already present on some projects)
--   2. Adds call_subscribe_opt_in (boolean, not null, default false)
--   3. Adds call_subscribe_opted_at (when they turned the reminder on)
--   4. Adds last_subscribe_call_at (last reminder call, if any)
--   5. Revokes phone / opt-in columns from anon and public
--   6. If RLS is already on, members may UPDATE only their own phone + opt-in
--
-- The app:
--   - Toggle + phone field on /account, default off
--   - PATCH /api/profiles writes phone and opt-in for the signed-in owner
--   - GET /api/voice/subscribe-reminders lists who would be called (secret, no dial)
--
-- Until this runs, opt-in stays closed (treated as false). No one is listed.

alter table public.profiles
  add column if not exists phone text;

alter table public.profiles
  add column if not exists call_subscribe_opt_in boolean not null default false;

alter table public.profiles
  add column if not exists call_subscribe_opted_at timestamptz;

alter table public.profiles
  add column if not exists last_subscribe_call_at timestamptz;

comment on column public.profiles.phone is
  'Member-saved phone on their own Bandham profile. Never scraped. Not public.';

comment on column public.profiles.call_subscribe_opt_in is
  'Explicit opt-in for Regular subscribe reminder calls. Default false.';

comment on column public.profiles.call_subscribe_opted_at is
  'When the member last turned subscribe reminder calls on.';

comment on column public.profiles.last_subscribe_call_at is
  'When Bandham last placed a subscribe reminder call. Server only. 15 day cadence.';

-- Phones are not a public Browse field. Column grants, not only RLS.
revoke all (phone, call_subscribe_opt_in, call_subscribe_opted_at, last_subscribe_call_at)
  on table public.profiles
  from public;

revoke select (phone, call_subscribe_opt_in, call_subscribe_opted_at, last_subscribe_call_at)
  on table public.profiles
  from anon, authenticated;

revoke update (phone, call_subscribe_opt_in, call_subscribe_opted_at, last_subscribe_call_at)
  on table public.profiles
  from anon, public;

-- Member may update own phone and opt-in. Not last_subscribe_call_at.
grant update (phone, call_subscribe_opt_in, call_subscribe_opted_at)
  on table public.profiles
  to authenticated;

create index if not exists profiles_subscribe_call_opt_in_idx
  on public.profiles (call_subscribe_opt_in, last_subscribe_call_at)
  where call_subscribe_opt_in = true
    and phone is not null
    and btrim(phone) <> '';

-- Own-row write if RLS is already enabled. Do not turn RLS on here:
-- enabling it without the existing live-profile SELECT policies would hide Browse.
do $$
begin
  if exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'profiles'
      and c.relrowsecurity
  ) then
    execute $policy$
      drop policy if exists profiles_update_own_subscribe_call on public.profiles
    $policy$;
    execute $policy$
      create policy profiles_update_own_subscribe_call
      on public.profiles
      for update
      to authenticated
      using (user_id is not null and user_id::text = auth.uid()::text)
      with check (user_id is not null and user_id::text = auth.uid()::text)
    $policy$;
  end if;
end $$;

-- Confirm (phones stay off Browse):
-- select column_name
-- from information_schema.columns
-- where table_schema = 'public'
--   and table_name = 'profiles'
--   and column_name in ('phone', 'call_subscribe_opt_in', 'call_subscribe_opted_at', 'last_subscribe_call_at');
