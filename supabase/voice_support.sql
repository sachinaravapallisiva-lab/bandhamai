-- Bandham AI — voice phone support (additive, run AFTER support_tickets.sql)
--
-- What this does:
--   1. Allows source = 'voice' on public.support_tickets so phone-agent
--      tickets are distinct from in-app assistant / contact rows.
--   2. Adds caller_phone for the number the caller spoke.
--   3. Lets user_id be null when the spoken email or phone does not
--      match a Bandham account. In-app tickets still always set user_id.
--
-- This does not drop support_tickets. Existing rows stay as they are.
-- This is not the safety Report / Block path. Harassment still uses
-- Block and Report. Tickets are not an emergency service.
--
-- Voice writes go through the service role on POST /api/voice/support.
-- Do not grant UPDATE to authenticated members.
--
-- Do not change Instagram columns or share tables from this file.

alter table public.support_tickets
  add column if not exists caller_phone text;

alter table public.support_tickets
  alter column user_id drop not null;

alter table public.support_tickets
  drop constraint if exists support_tickets_source_check;

alter table public.support_tickets
  add constraint support_tickets_source_check
  check (source in ('assistant', 'contact', 'voice'));

create index if not exists support_tickets_caller_phone_idx
  on public.support_tickets (caller_phone)
  where caller_phone is not null;

-- Confirm:
-- select id, user_id, email, caller_phone, category, subject, status, source, created_at
-- from public.support_tickets
-- order by created_at desc
-- limit 20;
