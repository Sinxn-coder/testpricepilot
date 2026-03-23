-- ─── MIGRATION: ALIGN USERS TABLE WITH SECURE HASHING ───────────────────

-- 1. Rename api_key to api_key_hash
ALTER TABLE public.users 
RENAME COLUMN api_key TO api_key_hash;

-- 2. Add api_key_preview column
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS api_key_preview text;

-- 3. Update index
DROP INDEX IF EXISTS idx_users_api_key;
CREATE INDEX IF NOT EXISTS idx_users_api_key_hash ON public.users(api_key_hash);

-- 4. Re-enable policy if needed (optional, just to be sure)
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile" 
  ON public.users 
  FOR SELECT 
  USING (auth.uid() = id);

-- ──────────────────────────────────────────────────────────────────────────
