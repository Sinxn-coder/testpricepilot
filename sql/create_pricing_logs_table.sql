-- ─── STEP 4: CREATE PRICING LOGS TABLE ───────────────────────────────────────

-- 1. Create the pricing_logs table
-- This table stores every price calculation for analytics and conversion tracking.
create table if not exists public.pricing_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  
  -- Core Pricing Data
  base_price numeric(15, 2) not null,
  currency text not null default 'USD',
  country text not null,                 -- ISO Alpha-2 code
  tax_amount numeric(15, 2) not null,
  final_price numeric(15, 2) not null,
  optimized_final_price numeric(15, 2), -- The "prettier" price if different
  
  -- Analytics Metadata
  min_margin numeric(10, 2),
  source text,                          -- 'web_demo', 'rest_api', 'sdk'
  converted boolean not null default false,
  
  -- Timestamps
  created_at timestamptz not null default now()
);

-- 2. Enable Row Level Security (RLS)
alter table public.pricing_logs enable row level security;

-- 3. Policy: Users can only view their own pricing logs
create policy "Users can view own pricing logs" 
  on public.pricing_logs 
  for select 
  using (auth.uid() = user_id);

-- 4. Indices for performance
-- Optimized for conversion rate tracking and revenue analysis dashboards.
create index if not exists idx_pricing_logs_user_id on public.pricing_logs(user_id);
create index if not exists idx_pricing_logs_converted on public.pricing_logs(converted) where converted = true;
create index if not exists idx_pricing_logs_user_date on public.pricing_logs(user_id, created_at desc);
create index if not exists idx_pricing_logs_country on public.pricing_logs(country);
