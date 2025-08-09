-- Add headliner to organization_profiles and create organization_performances table

-- 1) Add headliner column (safe)
ALTER TABLE public.organization_profiles
  ADD COLUMN IF NOT EXISTS headliner TEXT;

-- 2) Create organization_performances table
CREATE TABLE IF NOT EXISTS public.organization_performances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organization_profiles(id) ON DELETE CASCADE NOT NULL,

  -- Performance details
  title TEXT NOT NULL,
  performance_date DATE,
  venue TEXT,
  description TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_org_performances_org_id ON public.organization_performances(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_performances_date ON public.organization_performances(organization_id, performance_date DESC);

-- Enable RLS
ALTER TABLE public.organization_performances ENABLE ROW LEVEL SECURITY;

-- Policy: anyone can view
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'organization_performances' AND policyname = 'Users can view org performances'
  ) THEN
    CREATE POLICY "Users can view org performances" ON public.organization_performances FOR SELECT USING (true);
  END IF;
END $$;

-- Policy: org admins (owner/admin) can manage entries
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'organization_performances' AND policyname = 'Org admins manage org performances'
  ) THEN
    CREATE POLICY "Org admins manage org performances" ON public.organization_performances
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM public.org_admins oa
          WHERE oa.organization_id = organization_performances.organization_id
            AND oa.user_id = auth.uid()
            AND oa.role IN ('owner','admin')
            AND oa.is_active = true
            AND oa.invitation_accepted = true
        )
      );
  END IF;
END $$;

-- Trigger to keep updated_at fresh
CREATE TRIGGER set_updated_at_organization_performances
  BEFORE UPDATE ON public.organization_performances
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();


