-- Add headliner field to individual_profiles table
-- This will store the user's professional tagline/headline

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'individual_profiles' AND column_name = 'headliner'
  ) THEN
    ALTER TABLE public.individual_profiles 
    ADD COLUMN headliner TEXT;
  END IF;
END $$;

-- Add comment for documentation
COMMENT ON COLUMN public.individual_profiles.headliner IS 'Professional headline or tagline displayed prominently on profile';