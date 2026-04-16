-- Migration: 035_api_scopes_system.sql
-- Description: Adds API users table with scoped access control as per technical audit.

CREATE TABLE IF NOT EXISTS public.api_users (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id    UUID NOT NULL REFERENCES public.institutions(id),
  name              TEXT NOT NULL,
  token_hash        TEXT NOT NULL UNIQUE, -- Store hashed API keys
  scopes            TEXT[] DEFAULT '{academic.read}', -- academic.read|academic.write|billing.read|billing.write|hr.read|counselor.read
  is_active         BOOLEAN DEFAULT true,
  last_used         TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  created_by        UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.api_users ENABLE ROW LEVEL SECURITY;

-- Only Admins can manage API users
CREATE POLICY "Admins can manage API users" ON public.api_users
FOR ALL USING (
    auth.jwt() ->> 'role' IN ('super_admin', 'institution_admin')
    AND institution_id = (auth.jwt() ->> 'institution_id')::uuid
);

-- Define safe default migration for existing rows (if any)
-- ALTER TABLE public.api_users ALTER COLUMN scopes SET DEFAULT '{academic.read}';
