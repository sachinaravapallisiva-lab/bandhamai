-- Bandham AI — messaging subscriptions (run in the Supabase SQL editor)
--
-- What this does:
--   1. Creates public.subscriptions (one row per auth user)
--   2. Turns on RLS: members can read their own row; only the service role writes
--   3. If public.messages exists, a trigger blocks INSERT unless the sender
--      has status active or trialing
--
-- Checkout + webhook write through SUPABASE_SERVICE_KEY and bypass RLS.
-- The app does not add columns to profiles or auth.users.
--
-- Entitlement is messaging access only. Do not store a match %, member count,
-- or a "founding" flag here. A later $5.99 Price ID can be another Stripe
-- Price; checkout still ships the $9.99 monthly Price.

create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users (id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  stripe_price_id text,
  status text not null default 'none',
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists subscriptions_status_idx
  on public.subscriptions (status);

alter table public.subscriptions enable row level security;

drop policy if exists subscriptions_select_own on public.subscriptions;
create policy subscriptions_select_own
  on public.subscriptions
  for select
  to authenticated
  using (auth.uid() = user_id);

-- No insert/update/delete policies for authenticated.
-- Service-role webhook + checkout writes bypass RLS.

create schema if not exists private;

create or replace function private.enforce_message_subscription()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.sender_id is null then
    raise exception 'messaging_requires_subscription';
  end if;

  if not exists (
    select 1
    from public.subscriptions s
    where s.user_id = new.sender_id
      and s.status in ('active', 'trialing')
  ) then
    raise exception 'messaging_requires_subscription';
  end if;

  return new;
end;
$$;

revoke all on function private.enforce_message_subscription() from public;
revoke all on function private.enforce_message_subscription() from anon, authenticated;

do $$
begin
  if to_regclass('public.messages') is not null then
    drop trigger if exists messages_require_subscription on public.messages;
    create trigger messages_require_subscription
      before insert on public.messages
      for each row
      execute function private.enforce_message_subscription();
  end if;
end $$;

-- Confirm:
-- select user_id, stripe_customer_id, status, current_period_end
-- from public.subscriptions
-- order by updated_at desc
-- limit 10;
