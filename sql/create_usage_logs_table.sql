-- ─── STEP 3: CREATE USAGE LOGS TABLE ─────────────────────────────────────────

-- 1. Create the usage_logs table
-- This table tracks every API request for rate limiting and billing.
create table if not exists public.usage_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  
  -- Request details
  endpoint text not null,                -- e.g., '/calculate-price'
  method text not null,                  -- e.g., 'POST'
  status_code integer,                   -- e.g., 200, 429, 500
  
  -- Analytics & Security
  request_count integer not null default 1,
  ip_address text,
  user_agent text,
  
  -- Timestamps
  created_at timestamptz not null default now()
);

-- 2. Enable Row Level Security (RLS)
alter table public.usage_logs enable row level security;

-- 3. Policy: Users can only view their own usage logs
drop policy if exists "Users can view own usage logs" on public.usage_logs;
create policy "Users can view own usage logs" 
  on public.usage_logs 
  for select 
  using (auth.uid() = user_id);

-- 4. Indices for performance
-- Critical for usage-based billing queries and dashboard reporting.
create index if not exists idx_usage_logs_user_id on public.usage_logs(user_id);
create index if not exists idx_usage_logs_created_at on public.usage_logs(created_at desc);
create index if not exists idx_usage_logs_user_date on public.usage_logs(user_id, created_at desc);
