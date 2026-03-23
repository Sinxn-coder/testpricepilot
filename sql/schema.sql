-- PricePilot MVP schema for Supabase (PostgreSQL)

create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  plan text not null default 'free' check (plan in ('free', 'paid')),
  api_key text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  endpoint text not null,
  "timestamp" timestamptz not null default now()
);

create table if not exists public.pricing_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  base_price numeric(12, 2) not null,
  final_price numeric(12, 2) not null,
  country text not null,
  source text not null,
  converted boolean,
  created_at timestamptz not null default now()
);

create index if not exists idx_usage_logs_user_timestamp
  on public.usage_logs (user_id, "timestamp");

create index if not exists idx_pricing_logs_user_created_at
  on public.pricing_logs (user_id, created_at desc);

-- NOTE:
-- Store SHA-256 hash in users.api_key (not raw key).

-- ─── Tax Rates ────────────────────────────────────────────────────────────────

create table if not exists public.tax_rates (
  country        text primary key,          -- ISO-3166-1 alpha-2 (e.g. 'US')
  tax_percentage numeric(5, 2) not null,    -- e.g. 18.00 for India GST
  updated_at     timestamptz not null default now()
);

-- Seed: common VAT/GST rates (as of 2025)
insert into public.tax_rates (country, tax_percentage) values
  ('AE',  5.00),   -- UAE VAT
  ('AU', 10.00),   -- Australia GST
  ('BR', 12.00),   -- Brazil ICMS (simplified)
  ('CA', 13.00),   -- Canada HST (Ontario)
  ('DE', 19.00),   -- Germany VAT
  ('FR', 20.00),   -- France VAT
  ('GB', 20.00),   -- UK VAT
  ('IN', 18.00),   -- India GST (standard)
  ('JP', 10.00),   -- Japan Consumption Tax
  ('MX', 16.00),   -- Mexico IVA
  ('NG',  7.50),   -- Nigeria VAT
  ('PK', 17.00),   -- Pakistan GST
  ('SG',  9.00),   -- Singapore GST
  ('US',  8.00),   -- USA (avg state sales tax)
  ('ZA', 15.00)    -- South Africa VAT
on conflict (country) do nothing;
