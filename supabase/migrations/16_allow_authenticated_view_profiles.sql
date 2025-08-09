-- Allow authenticated users to view any individual profile
-- This fixes profile pages where joined individual profile data was hidden by RLS,
-- while keeping write permissions unchanged and without affecting the home feed.

-- Ensure RLS is enabled (should already be from initial migration)
ALTER TABLE public.individual_profiles ENABLE ROW LEVEL SECURITY;

-- Add a policy to allow reads for any authenticated user
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'individual_profiles' 
      AND policyname = 'Authenticated users can view individual profiles'
  ) THEN
    CREATE POLICY "Authenticated users can view individual profiles" 
      ON public.individual_profiles
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

-- Keep existing targeted policies (owner CRUD, public verified view) intact.


