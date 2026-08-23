-- Bandham AI — in-app support tickets (run in the Supabase SQL editor)
--
-- What this does:
--   1. public.support_tickets — a reviewable queue for app issues
--      (bugs, billing, account help). The Bandham assistant can file these
--      after the member confirms.
--   2. RLS: a signed-in member can insert and select their own rows only.
--      There is no public read of other people's tickets.
--   3. Status stays open until an operator updates it in the dashboard.
--
-- This is not the safety Report / Block path (see supabase/safety.sql).
-- Harassment, threats, or a person who will not stop should use Block
-- and Report on the profile or in live chat. This table is for product
-- and account issues. It is not an emergency service.
--
-- Do not change Instagram columns or share tables from this file.

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  email text,
  category text not null default 'other',
  subject text not null,
  body text not null,
  status text not null default 'open',
  source text not null default 'assistant',
  created_at timestamptz not null default now(),
  constraint support_tickets_category_check check (
    category in ('bug', 'billing', 'account', 'other')
  ),
  constraint support_tickets_status_check check (
    status in ('open', 'in_progress', 'closed')
  ),
  constraint support_tickets_source_check check (
    source in ('assistant', 'contact')
  ),
  constraint support_tickets_subject_len check (
    char_length(trim(subject)) >= 4
    and char_length(subject) <= 160
  ),
  constraint support_tickets_body_len check (
    char_length(trim(body)) >= 8
    and char_length(body) <= 4000
  )
);

create index if not exists support_tickets_user_idx
  on public.support_tickets (user_id, created_at desc);

create index if not exists support_tickets_status_idx
  on public.support_tickets (status, created_at desc);

create index if not exists support_tickets_created_at_idx
  on public.support_tickets (created_at desc);

alter table public.support_tickets enable row level security;

revoke all on public.support_tickets from public, anon;
grant select, insert on public.support_tickets to authenticated;
grant all on public.support_tickets to service_role;

drop policy if exists support_tickets_select_own on public.support_tickets;
create policy support_tickets_select_own
  on public.support_tickets
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists support_tickets_insert_own on public.support_tickets;
create policy support_tickets_insert_own
  on public.support_tickets
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- No authenticated UPDATE / DELETE. Operators change status in the
-- Supabase table editor (service role bypasses RLS).

-- Confirm:
-- select id, user_id, email, category, subject, status, created_at
-- from public.support_tickets
-- order by created_at desc
-- limit 20;
