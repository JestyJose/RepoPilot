-- ==============================================================================
-- RepoPilot: Saved Audits Table & Row Level Security (RLS)
-- ==============================================================================
-- Instructions:
-- 1. Open your Supabase Dashboard: https://supabase.com/dashboard
-- 2. Select your project and navigate to the "SQL Editor" in the left sidebar.
-- 3. Click "New Query", paste the entire contents of this file, and click "Run".
-- ==============================================================================

-- 1. Create the saved_audits table in the public schema
CREATE TABLE IF NOT EXISTS public.saved_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  repository_full_name TEXT NOT NULL,
  repository_url TEXT NOT NULL,
  readiness_score INTEGER NOT NULL CHECK (readiness_score >= 0 AND readiness_score <= 100),
  grade TEXT NOT NULL,
  audit_result JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Performance indexes for fast querying by user and date
CREATE INDEX IF NOT EXISTS idx_saved_audits_user_id ON public.saved_audits(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_audits_created_at ON public.saved_audits(created_at DESC);

-- 3. Enable Row Level Security (RLS) - CRITICAL for user privacy
ALTER TABLE public.saved_audits ENABLE ROW LEVEL SECURITY;

-- 4. Policy: Users can only view their own saved audits
DROP POLICY IF EXISTS "Users can view own audits" ON public.saved_audits;
CREATE POLICY "Users can view own audits"
ON public.saved_audits
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 5. Policy: Users can only insert their own saved audits
DROP POLICY IF EXISTS "Users can insert own audits" ON public.saved_audits;
CREATE POLICY "Users can insert own audits"
ON public.saved_audits
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 6. Policy: Users can only delete their own saved audits
DROP POLICY IF EXISTS "Users can delete own audits" ON public.saved_audits;
CREATE POLICY "Users can delete own audits"
ON public.saved_audits
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
