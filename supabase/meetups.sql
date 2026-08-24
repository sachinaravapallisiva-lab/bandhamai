-- Bandham AI — Meetup this month (run in the Supabase SQL editor)
--
-- CoS / Sai must apply this file. The app does not create these tables at runtime.
-- Until this runs, Browse / Matches / account still show the August 2026 card from
-- locked copy, but RSVP, group chat, and the RSVP shortlist return 503.
--
-- What this does:
--   1. public.meetups — one virtual matrimony meetup per month
--   2. public.event_tickets — paid meetup ticket (separate Stripe Price, not $9.99/mo)
--   3. public.rsvps — written only AFTER a paid event ticket (service role)
--   4. public.group_messages — meetup room for RSVP members only
--   5. RLS: guests cannot post. RSVP members can read/write that meetup's room.
--   6. Seeds ONE August 2026 row so the live UI is not empty
--
-- Ticket lock (Sai / CoS):
--   Event ticket is NOT included in the $9.99/mo messaging subscription.
--   Checkout uses STRIPE_EVENT_PRICE_ID (one time Price). The dollar amount
--   is not named in this repo. Do not invent a Price ID or an amount.
--   If that env is missing, checkout fails closed.
--   Authenticated clients cannot insert a free RSVP.
--
-- This is not WhatsApp. WhatsApp stays a private one to one choice.
-- The Bandham assistant never writes group_messages.
-- Group chat is not a backdoor around $9.99/mo Chat. One to one stays /chat.
--
-- Honor blocks in the app shortlist and 1:1 open path (see lib/safety-server.ts).
-- If public.blocks exists, blocked pairs are not forced into 1:1 from this room.

create table if not exists public.meetups (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  month_key text not null,
  starts_at timestamptz not null,
  timezone_note text not null,
  summary text not null,
  format text not null default 'virtual',
  regions text[] not null default '{}',
  created_at timestamptz not null default now(),
  constraint meetups_month_key_shape check (month_key ~ '^[0-9]{4}-[0-9]{2}$'),
  constraint meetups_format_virtual check (format = 'virtual')
);

create unique index if not exists meetups_month_key_uidx
  on public.meetups (month_key);

create index if not exists meetups_starts_at_idx
  on public.meetups (starts_at desc);

alter table public.meetups enable row level security;

revoke all on public.meetups from public, anon, authenticated;
grant select on public.meetups to anon, authenticated;
grant all on public.meetups to service_role;

drop policy if exists meetups_select_public on public.meetups;
create policy meetups_select_public
  on public.meetups
  for select
  to anon, authenticated
  using (true);

create table if not exists public.rsvps (
  id uuid primary key default gen_random_uuid(),
  meetup_id uuid not null references public.meetups (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint rsvps_unique_member unique (meetup_id, user_id)
);

create index if not exists rsvps_meetup_idx
  on public.rsvps (meetup_id, created_at desc);

create index if not exists rsvps_user_idx
  on public.rsvps (user_id);

alter table public.rsvps enable row level security;

revoke all on public.rsvps from public, anon, authenticated;
grant select on public.rsvps to authenticated;
grant all on public.rsvps to service_role;

-- Read RSVP membership without RLS recursion on public.rsvps.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to postgres, service_role, authenticated;

create or replace function private.bandham_has_meetup_rsvp(meetup uuid, member uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    meetup is not null
    and member is not null
    and exists (
      select 1
      from public.rsvps
      where meetup_id = meetup
        and user_id = member
    );
$$;

revoke all on function private.bandham_has_meetup_rsvp(uuid, uuid) from public, anon;
grant execute on function private.bandham_has_meetup_rsvp(uuid, uuid) to authenticated, service_role;

drop policy if exists rsvps_select_fellow on public.rsvps;
create policy rsvps_select_fellow
  on public.rsvps
  for select
  to authenticated
  using (
    auth.uid() = user_id
    or private.bandham_has_meetup_rsvp(meetup_id, auth.uid())
  );

-- No authenticated insert. A free RSVP would skip the event ticket.
drop policy if exists rsvps_insert_own on public.rsvps;

create table if not exists public.event_tickets (
  id uuid primary key default gen_random_uuid(),
  meetup_id uuid not null references public.meetups (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  stripe_checkout_session_id text not null,
  stripe_payment_intent_id text,
  stripe_price_id text,
  amount_cents integer,
  status text not null default 'paid',
  paid_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint event_tickets_unique_session unique (stripe_checkout_session_id),
  constraint event_tickets_unique_member unique (meetup_id, user_id),
  constraint event_tickets_paid_only check (status = 'paid')
);

create index if not exists event_tickets_user_idx
  on public.event_tickets (user_id, paid_at desc);

alter table public.event_tickets enable row level security;

revoke all on public.event_tickets from public, anon, authenticated;
grant select on public.event_tickets to authenticated;
grant all on public.event_tickets to service_role;

drop policy if exists event_tickets_select_own on public.event_tickets;
create policy event_tickets_select_own
  on public.event_tickets
  for select
  to authenticated
  using (auth.uid() = user_id);

create table if not exists public.group_messages (
  id uuid primary key default gen_random_uuid(),
  meetup_id uuid not null references public.meetups (id) on delete cascade,
  sender_id uuid not null references auth.users (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  constraint group_messages_body_len check (
    char_length(body) >= 1
    and char_length(body) <= 2000
  )
);

create index if not exists group_messages_meetup_idx
  on public.group_messages (meetup_id, created_at);

alter table public.group_messages enable row level security;

revoke all on public.group_messages from public, anon, authenticated;
grant select, insert on public.group_messages to authenticated;
grant all on public.group_messages to service_role;

-- RSVP members can read and write group messages for that meetup only.
drop policy if exists group_messages_select_rsvp on public.group_messages;
create policy group_messages_select_rsvp
  on public.group_messages
  for select
  to authenticated
  using (private.bandham_has_meetup_rsvp(meetup_id, auth.uid()));

drop policy if exists group_messages_insert_rsvp on public.group_messages;
create policy group_messages_insert_rsvp
  on public.group_messages
  for insert
  to authenticated
  with check (
    auth.uid() = sender_id
    and private.bandham_has_meetup_rsvp(meetup_id, auth.uid())
  );

-- If safety.sql already created the pair block helper, refuse a group send
-- from a blocked pair is not required (this is a room). The app still hides
-- blocked people from the Speed Match shortlist and will not force 1:1.

insert into public.meetups (
  id,
  title,
  month_key,
  starts_at,
  timezone_note,
  summary,
  format,
  regions
)
values (
  'a2026080-0000-4000-8000-000000000001',
  'Meetup this month',
  '2026-08',
  '2026-08-29 12:00:00+00',
  'Saturday 29 August 2026 at 12:00 UTC. A time that can work across the US, Australia, the UK, the EU, and Ireland.',
  'This meetup is online. It is for serious matrimony, not a dating mixer. RSVP to join Speed Match and the group chat on the side.',
  'virtual',
  array['US', 'AU', 'UK', 'EU', 'IE']
)
on conflict (id) do nothing;

-- Confirm:
-- select id, title, month_key, starts_at from public.meetups;
-- select meetup_id, user_id, created_at from public.rsvps order by created_at desc limit 10;
-- select id, meetup_id, sender_id, created_at from public.group_messages order by created_at desc limit 10;
