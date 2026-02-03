-- Event state: persists price-to-beat and last-price per event so reloads don't lose values.
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor) or via Supabase CLI.

create table if not exists public.event_state (
  event_slug text primary key,
  price_to_beat numeric,
  last_price numeric,
  updated_at timestamptz not null default now()
);

-- Optional: RLS if you later add auth; for server-only API you can leave policies permissive or disable RLS.
alter table public.event_state enable row level security;

create policy "Allow all for service role"
  on public.event_state
  for all
  using (true)
  with check (true);

comment on table public.event_state is 'Per-event price to beat and last price for Polymarket bot; survives page reload.';
