-- Relaxed visibility for Network discovery and search

-- Allow authenticated users to SELECT basic user rows
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'users' 
      AND policyname = 'Authenticated can view users'
  ) THEN
    CREATE POLICY "Authenticated can view users" ON public.users
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

-- Keep existing self-view policy as-is; this only broadens read access

-- Allow authenticated users to SELECT individual profiles for discovery
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'individual_profiles' 
      AND policyname = 'Authenticated can view individual profiles'
  ) THEN
    CREATE POLICY "Authenticated can view individual profiles" ON public.individual_profiles
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

-- Optionally broaden public browsing: allow public to view available profiles even if not verified
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'individual_profiles' 
      AND policyname = 'Public can view available profiles (unverified)'
  ) THEN
    CREATE POLICY "Public can view available profiles (unverified)" ON public.individual_profiles
      FOR SELECT
      TO anon
      USING (looking_for_gigs = true OR available_for_hire = true);
  END IF;
END $$;


