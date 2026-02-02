# Supabase Setup

Supabase stores **event state** (price-to-beat, last-price per event), **strategy config**, **trades**, and **positions** so they survive page reloads and are shared across sessions.

Full implementation details: **[../docs/SUPABASE_IMPLEMENTATION.md](../docs/SUPABASE_IMPLEMENTATION.md)**.

---

## Required environment variables

Set these in your environment (e.g. `.env` locally or Vercel Environment Variables):

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Project URL (e.g. `https://xxxxxxxxxxxx.supabase.co`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key from **Settings → API** (keep secret; server-side only) |

If either is missing, the event-state, strategy-config, trades, and positions API routes return **500** and the app falls back to in-memory / localStorage.

---

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a project.
2. In **Settings → API**: copy **Project URL** and **service_role** key.

---

## 2. Run migrations

In Supabase **SQL Editor**, run the migration files in order:

1. **`migrations/001_event_state.sql`** — event state (price_to_beat, last_price per event).
2. **`migrations/002_trades_positions_strategy.sql`** — strategy_config, trades, positions (per scope/asset).

Or use Supabase CLI if you use it.

---

## 3. Deploy API routes

Event-state, strategy-config, trades, and positions are served by a **single** route `api/data/[...path].ts` (to stay under Vercel Hobby’s 12-function limit). The same URLs are exposed via `vercel.json` rewrites:

- `/api/event-state` — GET/POST event state
- `/api/strategy-config` — GET/POST strategy config (scope = asset or `default`)
- `/api/trades` — GET/POST trades (scope = asset or `default`)
- `/api/positions` — GET/POST positions (scope = asset or `default`)

---

## Tables overview

| Table | Purpose |
|-------|---------|
| `event_state` | Per-event price_to_beat and last_price (key: event_slug) |
| `strategy_config` | Strategy config per scope (key: scope, e.g. btc, eth, default) |
| `trades` | Trade history per scope (key: scope + id) |
| `positions` | Open positions per scope (key: id) |

See **[../docs/SUPABASE_IMPLEMENTATION.md](../docs/SUPABASE_IMPLEMENTATION.md)** for column details, API contracts, and client usage.
