-- Create organization_profiles table for venues, ensembles, and other organizations
-- This table stores detailed profile information for organizations

CREATE TABLE IF NOT EXISTS public.organization_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Basic organization information
  name TEXT NOT NULL,
  description TEXT,
  organization_type TEXT NOT NULL CHECK (organization_type IN ('venue', 'ensemble', 'orchestra', 'band', 'choir', 'music_school', 'record_label', 'event_organizer', 'other')),
  
  -- Location and contact information
  address TEXT,
  city TEXT,
  state_province TEXT,
  country TEXT,
  postal_code TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  phone_number TEXT,
  email TEXT,
  website_url TEXT,
  
  -- Organization details
  established_year INTEGER,
  capacity INTEGER, -- For venues
  genres TEXT[], -- Array of musical genres they work with
  
  -- Business information
  business_registration_number TEXT,
  tax_id TEXT,
  
  -- Venue-specific fields
  venue_type TEXT, -- 'concert_hall', 'club', 'outdoor', 'studio', etc.
  amenities TEXT[], -- Array of available amenities
  equipment_provided TEXT[], -- Array of equipment they provide
  sound_system_available BOOLEAN DEFAULT false,
  lighting_system_available BOOLEAN DEFAULT false,
  
  -- Ensemble-specific fields
  ensemble_size INTEGER,
  primary_repertoire TEXT[],
  rehearsal_schedule JSONB DEFAULT '{}',
  
  -- Booking and hiring information
  accepts_bookings BOOLEAN DEFAULT true,
  hiring_musicians BOOLEAN DEFAULT false,
  booking_lead_time_days INTEGER DEFAULT 30,
  base_rental_rate_per_hour DECIMAL(10,2),
  base_performance_fee DECIMAL(10,2),
  
  -- Contact preferences
  preferred_contact_method TEXT CHECK (preferred_contact_method IN ('email', 'phone', 'app')),
  
  -- Social media and marketing
  social_links JSONB DEFAULT '{}', -- Store social media links as JSON
  logo_url TEXT,
  banner_image_url TEXT,
  gallery_images TEXT[], -- Array of image URLs
  
  -- Performance history and ratings
  total_events INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0.00,
  
  -- Organization status
  verified BOOLEAN DEFAULT false,
  verification_date TIMESTAMP WITH TIME ZONE,
  active BOOLEAN DEFAULT true,
  
  -- Availability and scheduling
  operating_hours JSONB DEFAULT '{}', -- Store operating hours as JSON
  availability JSONB DEFAULT '{}', -- Store availability calendar as JSON
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_organization_profiles_name ON public.organization_profiles(name);
CREATE INDEX IF NOT EXISTS idx_organization_profiles_organization_type ON public.organization_profiles(organization_type);
CREATE INDEX IF NOT EXISTS idx_organization_profiles_city ON public.organization_profiles(city);
CREATE INDEX IF NOT EXISTS idx_organization_profiles_state_province ON public.organization_profiles(state_province);
CREATE INDEX IF NOT EXISTS idx_organization_profiles_country ON public.organization_profiles(country);
CREATE INDEX IF NOT EXISTS idx_organization_profiles_accepts_bookings ON public.organization_profiles(accepts_bookings);
CREATE INDEX IF NOT EXISTS idx_organization_profiles_hiring_musicians ON public.organization_profiles(hiring_musicians);
CREATE INDEX IF NOT EXISTS idx_organization_profiles_verified ON public.organization_profiles(verified);
CREATE INDEX IF NOT EXISTS idx_organization_profiles_active ON public.organization_profiles(active);

-- Spatial index for location-based searches
CREATE INDEX IF NOT EXISTS idx_organization_profiles_location ON public.organization_profiles(latitude, longitude);

-- GIN indexes for array and JSONB columns
CREATE INDEX IF NOT EXISTS idx_organization_profiles_genres ON public.organization_profiles USING GIN(genres);
CREATE INDEX IF NOT EXISTS idx_organization_profiles_amenities ON public.organization_profiles USING GIN(amenities);
CREATE INDEX IF NOT EXISTS idx_organization_profiles_equipment_provided ON public.organization_profiles USING GIN(equipment_provided);
CREATE INDEX IF NOT EXISTS idx_organization_profiles_primary_repertoire ON public.organization_profiles USING GIN(primary_repertoire);
CREATE INDEX IF NOT EXISTS idx_organization_profiles_rehearsal_schedule ON public.organization_profiles USING GIN(rehearsal_schedule);
CREATE INDEX IF NOT EXISTS idx_organization_profiles_social_links ON public.organization_profiles USING GIN(social_links);
CREATE INDEX IF NOT EXISTS idx_organization_profiles_operating_hours ON public.organization_profiles USING GIN(operating_hours);
CREATE INDEX IF NOT EXISTS idx_organization_profiles_availability ON public.organization_profiles USING GIN(availability);
CREATE INDEX IF NOT EXISTS idx_organization_profiles_gallery_images ON public.organization_profiles USING GIN(gallery_images);

-- Enable RLS (Row Level Security)
ALTER TABLE public.organization_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organization_profiles table
-- Authenticated users can view active and verified organizations
CREATE POLICY "Authenticated users can view active organizations" ON public.organization_profiles
  FOR SELECT
  USING (
    auth.role() = 'authenticated' AND 
    active = true AND 
    (verified = true OR verified = false) -- Allow viewing both verified and unverified for admins
  );

-- Anonymous users can only view verified and active organizations
CREATE POLICY "Anonymous can view verified organizations" ON public.organization_profiles
  FOR SELECT
  USING (verified = true AND active = true);

-- Organization admins can manage their organizations (will be defined after org_admins table)
-- Note: More specific policies will be added after the org_admins junction table is created

-- Create trigger for updated_at
CREATE TRIGGER set_updated_at_organization_profiles
  BEFORE UPDATE ON public.organization_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Grant permissions
GRANT ALL ON public.organization_profiles TO authenticated;
GRANT SELECT ON public.organization_profiles TO anon;