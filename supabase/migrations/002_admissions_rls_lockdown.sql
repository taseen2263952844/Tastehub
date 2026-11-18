-- ============================================================================
-- SOFS Academic Coaching — Incremental Migration: Lock Down public.admissions RLS
-- Safe to run if 001_sofs_schema.sql was already executed in Supabase SQL Editor.
-- ============================================================================

ALTER TABLE public.admissions ENABLE ROW LEVEL SECURITY;

-- Remove direct anonymous insert access so all public admission submissions must pass
-- through the server-side Cloudflare Worker (/api/sofs/admissions) with validation & rate limiting.
DROP POLICY IF EXISTS "Public insert admission" ON public.admissions;

-- Restrict direct JWT client access to verified super_admin / admission_manager admins only.
-- The server-side Cloudflare Worker uses SUPABASE_SERVICE_ROLE_KEY (sb_secret_ / service_role),
-- which runs with elevated server privileges and inserts validated submissions securely.
DROP POLICY IF EXISTS "Admins manage admissions via verified JWT" ON public.admissions;
CREATE POLICY "Admins manage admissions via verified JWT" ON public.admissions
  FOR ALL
  USING (public.is_sofs_admin(ARRAY['super_admin', 'admission_manager']))
  WITH CHECK (public.is_sofs_admin(ARRAY['super_admin', 'admission_manager']));
