-- Add account_type and active_organization_id to users

-- account_type indicates whether the user is using the platform as an artist (individual) or an organization
-- active_organization_id points to the organization the user is currently acting as (when account_type = 'organization')

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS account_type TEXT NOT NULL DEFAULT 'artist' CHECK (account_type IN ('artist','organization')),
  ADD COLUMN IF NOT EXISTS active_organization_id UUID NULL REFERENCES public.organization_profiles(id);

-- Helpful index for joins/filters
CREATE INDEX IF NOT EXISTS idx_users_active_organization_id ON public.users(active_organization_id);

-- Optional: Ensure updated_at is touched when switching account_type/active_organization_id handled by existing trigger


