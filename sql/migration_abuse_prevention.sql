-- Migration: Add is_blocked to users for abuse prevention
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_blocked boolean DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS block_reason text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS blocked_at timestamptz;

-- Add index for performance when checking status
CREATE INDEX IF NOT EXISTS idx_users_is_blocked ON public.users(is_blocked) WHERE is_blocked = true;
