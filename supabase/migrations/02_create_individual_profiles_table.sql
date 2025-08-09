-- Create individual_profiles table for musicians and individual performers
-- This table stores detailed profile information for individual users

CREATE TABLE IF NOT EXISTS public.individual_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- Basic profile information
  stage_name TEXT,
  bio TEXT,
  location TEXT,
  website_url TEXT,
  
  -- Professional information
  primary_instrument TEXT,
  instruments TEXT[], -- Array of instruments they play
  genres TEXT[], -- Array of musical genres
  years_experience INTEGER,
  
  -- Performance preferences
  looking_for_gigs BOOLEAN DEFAULT true,
  available_for_hire BOOLEAN DEFAULT true,
  travel_distance_km INTEGER, -- How far they're willing to travel
  base_rate_per_hour DECIMAL(10,2), -- Their hourly rate
  
  -- Contact preferences
  preferred_contact_method TEXT CHECK (preferred_contact_method IN ('email', 'phone', 'app')),
  phone_number TEXT,
  
  -- Social media links
  social_links JSONB DEFAULT '{}', -- Store social media links as JSON
  
  -- Performance history and ratings
  total_performances INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0.00,
  
  -- Availability calendar
  availability JSONB DEFAULT '{}', -- Store availability data as JSON
  
  -- Profile completion and verification
  profile_complete BOOLEAN DEFAULT false,
  verified BOOLEAN DEFAULT false,
  verification_date TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_individual_profiles_user_id ON public.individual_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_individual_profiles_location ON public.individual_profiles(location);
CREATE INDEX IF NOT EXISTS idx_individual_profiles_primary_instrument ON public.individual_profiles(primary_instrument);
CREATE INDEX IF NOT EXISTS idx_individual_profiles_looking_for_gigs ON public.individual_profiles(looking_for_gigs);
CREATE INDEX IF NOT EXISTS idx_individual_profiles_available_for_hire ON public.individual_profiles(available_for_hire);
CREATE INDEX IF NOT EXISTS idx_individual_profiles_verified ON public.individual_profiles(verified);

-- GIN indexes for array and JSONB columns
CREATE INDEX IF NOT EXISTS idx_individual_profiles_instruments ON public.individual_profiles USING GIN(instruments);
CREATE INDEX IF NOT EXISTS idx_individual_profiles_genres ON public.individual_profiles USING GIN(genres);
CREATE INDEX IF NOT EXISTS idx_individual_profiles_social_links ON public.individual_profiles USING GIN(social_links);
CREATE INDEX IF NOT EXISTS idx_individual_profiles_availability ON public.individual_profiles USING GIN(availability);

-- Enable RLS (Row Level Security)
ALTER TABLE public.individual_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for individual_profiles table
-- Users can read their own profile
CREATE POLICY "Users can view own individual profile" ON public.individual_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update own individual profile" ON public.individual_profiles
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own individual profile" ON public.individual_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own profile
CREATE POLICY "Users can delete own individual profile" ON public.individual_profiles
  FOR DELETE
  USING (auth.uid() = user_id);

-- Public can view verified and available profiles (for browsing)
CREATE POLICY "Public can view available individual profiles" ON public.individual_profiles
  FOR SELECT
  USING (verified = true AND (looking_for_gigs = true OR available_for_hire = true));

-- Create trigger for updated_at
CREATE TRIGGER set_updated_at_individual_profiles
  BEFORE UPDATE ON public.individual_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Grant permissions
GRANT ALL ON public.individual_profiles TO authenticated;
GRANT SELECT ON public.individual_profiles TO anon;