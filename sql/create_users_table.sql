-- ─── STEP 1: CREATE USERS TABLE ──────────────────────────────────────────────

-- 1. Enable UUID extension
create extension if not exists "uuid-ossp";

-- 2. Create the users table
-- This table stores core user profiles, API keys, and subscription status.
create table if not exists public.users (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  api_key_hash text unique not null,
  api_key_preview text,
  plan text not null default 'free' check (plan in ('free', 'pro', 'enterprise')),
  
  -- Profile Metadata
  full_name text,
  avatar_url text,
  
  -- Billing / SaaS Integration
  stripe_customer_id text unique,
  
  -- Timestamps
  last_sign_in_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Automatic updated_at trigger
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at
before update on public.users
for each row
execute function public.handle_updated_at();

-- 4. Enable Row Level Security (RLS)
-- By default, no one can read/write to this table until policies are added.
alter table public.users enable row level security;

-- 5. Basic Policy: Users can read their own data
-- Note: auth.uid() = id only works if you're using Supabase Auth alongside this table.
-- If you use custom API keys, you may need a separate policy.
create policy "Users can view own profile" 
  on public.users 
  for select 
  using (auth.uid() = id);

-- 6. Indices for performance
create index if not exists idx_users_email on public.users(email);
create index if not exists idx_users_api_key_hash on public.users(api_key_hash);
