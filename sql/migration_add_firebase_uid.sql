-- Link Firebase Authentication users to the existing application users table.

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS firebase_uid text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_firebase_uid
ON public.users(firebase_uid)
WHERE firebase_uid IS NOT NULL;

-- Firebase-authenticated users do not need a legacy API key.
ALTER TABLE public.users
ALTER COLUMN api_key_hash DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_email
ON public.users(email);
