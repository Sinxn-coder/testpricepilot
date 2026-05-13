-- ─── DOMAIN ABUSE PREVENTION MIGRATION ─────────────────────────────────────

-- 1. Extend Users table for domain binding
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS bound_domain TEXT,
ADD COLUMN IF NOT EXISTS domain_lock_status TEXT DEFAULT 'unlocked', -- 'unlocked', 'locked', 'restricted'
ADD COLUMN IF NOT EXISTS abuse_score INTEGER DEFAULT 0;

-- 2. Create Domain Usage Registry
-- This tracks which domains are associated with which users to detect duplicates.
CREATE TABLE IF NOT EXISTS public.domain_registry (
  domain TEXT PRIMARY KEY,
  first_seen_at TIMESTAMPTZ DEFAULT now(),
  last_seen_at TIMESTAMPTZ DEFAULT now(),
  primary_user_id UUID REFERENCES public.users(id),
  is_verified BOOLEAN DEFAULT false,
  is_blacklisted BOOLEAN DEFAULT false,
  blacklisted_reason TEXT
);

-- 3. Create Domain-User Mapping (for many-to-many detection)
CREATE TABLE IF NOT EXISTS public.domain_user_map (
  domain TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES public.users(id),
  request_count BIGINT DEFAULT 1,
  first_seen_at TIMESTAMPTZ DEFAULT now(),
  last_seen_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (domain, user_id)
);

-- 4. Create Abuse Event Log
CREATE TABLE IF NOT EXISTS public.abuse_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id),
  domain TEXT,
  event_type TEXT NOT NULL, -- 'spike', 'duplicate_domain', 'rate_limit_violation', 'domain_mismatch'
  score_delta INTEGER DEFAULT 1,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Indices
CREATE INDEX IF NOT EXISTS idx_users_bound_domain ON public.users(bound_domain);
CREATE INDEX IF NOT EXISTS idx_users_abuse_score ON public.users(abuse_score);
CREATE INDEX IF NOT EXISTS idx_domain_user_map_user ON public.domain_user_map(user_id);
CREATE INDEX IF NOT EXISTS idx_abuse_events_user ON public.abuse_events(user_id);

-- 6. Helper Function for atomic score updates
CREATE OR REPLACE FUNCTION increment_abuse_score(row_id UUID, delta INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE public.users
  SET abuse_score = LEAST(100, GREATEST(0, abuse_score + delta))
  WHERE id = row_id;
END;
$$ LANGUAGE plpgsql;

-- 7. Add domain column to usage_logs for tracking
ALTER TABLE public.usage_logs ADD COLUMN IF NOT EXISTS domain TEXT;
CREATE INDEX IF NOT EXISTS idx_usage_logs_domain_created ON public.usage_logs(domain, created_at DESC);
