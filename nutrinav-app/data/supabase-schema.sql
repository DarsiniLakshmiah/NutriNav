-- ============================================================
-- NutriNav — Supabase Schema
-- Run this in Supabase SQL Editor: Dashboard → SQL Editor → New Query
-- ============================================================

-- Stores table (seeded from Healthy Corners DC Open Data CSV)
create table if not exists stores (
  id          text primary key,
  name        text not null,
  address     text not null,
  zipcode     text,
  lat         double precision not null,
  lng         double precision not null,
  ward        int,
  anc         text,
  snap_match  boolean default false,
  wic         boolean default false,
  created_at  timestamptz default now()
);

-- Inventory table (one row per product per store, synthetic from HC catalog)
create table if not exists inventory (
  id          uuid primary key default gen_random_uuid(),
  store_id    text references stores(id) on delete cascade,
  name        text not null,
  category    text,
  price       numeric(6,2),
  unit        text,
  grade       text check (grade in ('A','B','C','D')),
  in_stock    boolean default true,
  updated_at  timestamptz default now()
);
create index if not exists idx_inventory_store on inventory(store_id);

-- Unmet demand events (privacy-safe — no user ID, no precise location)
create table if not exists unmet_demand_events (
  id          uuid primary key default gen_random_uuid(),
  store_id    text references stores(id) on delete cascade,
  product     text not null,
  source      text check (source in ('ai_gap', 'user_tap')),
  created_at  timestamptz default now()
);
create index if not exists idx_demand_store_created on unmet_demand_events(store_id, created_at desc);

-- Materialized demand counts (refreshed by trigger below)
create table if not exists store_demand_counts (
  store_id    text references stores(id) on delete cascade,
  product     text not null,
  count_7d    int default 0,
  count_30d   int default 0,
  alert       text check (alert in ('red','yellow','green')) default 'green',
  updated_at  timestamptz default now(),
  primary key (store_id, product)
);

-- ============================================================
-- Row Level Security
-- Store owners can only see their own store's demand data
-- ============================================================
alter table store_demand_counts enable row level security;
alter table unmet_demand_events enable row level security;

-- Allow anonymous inserts for logging unmet demand (residents don't auth)
create policy "anon can insert demand events"
  on unmet_demand_events for insert
  with check (true);

-- Allow reading demand counts (store owner dashboard — no auth for demo)
create policy "anyone can read demand counts"
  on store_demand_counts for select
  using (true);

-- Stores and inventory are public read
alter table stores enable row level security;
create policy "public read stores" on stores for select using (true);

alter table inventory enable row level security;
create policy "public read inventory" on inventory for select using (true);

-- ============================================================
-- Function: refresh demand counts for a store
-- Call after inserts into unmet_demand_events
-- ============================================================
create or replace function refresh_demand_counts(p_store_id text)
returns void language plpgsql as $$
declare
  v_now timestamptz := now();
  v_7d  timestamptz := v_now - interval '7 days';
  v_30d timestamptz := v_now - interval '30 days';
begin
  -- Delete old counts for this store
  delete from store_demand_counts where store_id = p_store_id;

  -- Recompute from events
  insert into store_demand_counts (store_id, product, count_7d, count_30d, alert, updated_at)
  select
    p_store_id,
    product,
    count(*) filter (where created_at >= v_7d)  as count_7d,
    count(*) filter (where created_at >= v_30d) as count_30d,
    case
      when count(*) filter (where created_at >= v_30d) > 20 then 'red'
      when count(*) filter (where created_at >= v_30d) >= 8  then 'yellow'
      else 'green'
    end as alert,
    v_now
  from unmet_demand_events
  where store_id = p_store_id
    and created_at >= v_30d
  group by product;
end;
$$;

-- ============================================================
-- Trigger: auto-refresh counts on new event insert
-- ============================================================
create or replace function trigger_refresh_demand()
returns trigger language plpgsql as $$
begin
  perform refresh_demand_counts(NEW.store_id);
  return NEW;
end;
$$;

drop trigger if exists on_demand_event_insert on unmet_demand_events;
create trigger on_demand_event_insert
  after insert on unmet_demand_events
  for each row execute function trigger_refresh_demand();
