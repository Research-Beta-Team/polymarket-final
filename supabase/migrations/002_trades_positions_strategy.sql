-- Strategy config: one row per scope (e.g. 'btc', 'eth', 'default' for single-asset).
create table if not exists public.strategy_config (
  scope text primary key,
  config jsonb not null,
  updated_at timestamptz not null default now()
);

-- Trades: store trade history per scope.
create table if not exists public.trades (
  id text not null,
  scope text not null,
  event_slug text,
  token_id text,
  side text,
  size numeric,
  price numeric,
  timestamp bigint,
  status text,
  transaction_hash text,
  profit numeric,
  reason text,
  order_type text,
  limit_price numeric,
  direction text,
  created_at timestamptz not null default now(),
  primary key (scope, id)
);

create index if not exists idx_trades_scope_timestamp on public.trades (scope, timestamp desc);

-- Positions: store open positions per scope.
create table if not exists public.positions (
  id text primary key,
  scope text not null,
  event_slug text,
  token_id text,
  side text,
  entry_price numeric,
  size numeric,
  current_price numeric,
  unrealized_profit numeric,
  direction text,
  filled_orders jsonb,
  entry_timestamp bigint,
  updated_at timestamptz not null default now()
);

create index if not exists idx_positions_scope on public.positions (scope);

alter table public.strategy_config enable row level security;
alter table public.trades enable row level security;
alter table public.positions enable row level security;

create policy "Allow all strategy_config" on public.strategy_config for all using (true) with check (true);
create policy "Allow all trades" on public.trades for all using (true) with check (true);
create policy "Allow all positions" on public.positions for all using (true) with check (true);

comment on table public.strategy_config is 'Trading strategy config per scope (asset or default).';
comment on table public.trades is 'Trade history per scope.';
comment on table public.positions is 'Open positions per scope.';
