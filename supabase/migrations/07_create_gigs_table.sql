-- Create gigs table with all listing fields
-- This table stores gig opportunities, job postings, and performance opportunities

CREATE TABLE IF NOT EXISTS public.gigs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Poster information (who posted the gig)
  posted_by_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  posted_by_organization_id UUID REFERENCES public.organization_profiles(id) ON DELETE CASCADE,
  
  -- Basic gig information
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  gig_type TEXT NOT NULL CHECK (gig_type IN ('one_time', 'recurring', 'residency', 'tour', 'session', 'teaching', 'other')),
  
  -- Performance details
  instruments_needed TEXT[] NOT NULL, -- Required instruments
  genres TEXT[], -- Musical genres
  experience_level TEXT CHECK (experience_level IN ('beginner', 'intermediate', 'advanced', 'professional', 'any')),
  ensemble_size_min INTEGER,
  ensemble_size_max INTEGER,
  
  -- Location and venue information
  venue_name TEXT,
  venue_address TEXT,
  city TEXT NOT NULL,
  state_province TEXT,
  country TEXT NOT NULL,
  postal_code TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  is_remote BOOLEAN DEFAULT false,
  travel_required BOOLEAN DEFAULT false,
  travel_distance_km INTEGER,
  
  -- Date and time information
  start_date DATE NOT NULL,
  end_date DATE, -- For multi-day events or recurring gigs
  start_time TIME,
  end_time TIME,
  rehearsal_dates DATE[],
  application_deadline DATE,
  
  -- Compensation and payment
  compensation_type TEXT NOT NULL CHECK (compensation_type IN ('paid', 'volunteer', 'profit_share', 'exposure', 'other')),
  pay_rate_type TEXT CHECK (pay_rate_type IN ('hourly', 'daily', 'per_gig', 'flat_fee', 'percentage')),
  pay_amount_min DECIMAL(10,2),
  pay_amount_max DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  payment_terms TEXT, -- When payment is made
  additional_benefits TEXT, -- Meals, transport, accommodation, etc.
  
  -- Requirements and qualifications
  required_skills TEXT[],
  preferred_skills TEXT[],
  equipment_provided TEXT[],
  equipment_required TEXT[],
  dress_code TEXT,
  age_requirements TEXT,
  
  -- Application process
  application_method TEXT NOT NULL CHECK (application_method IN ('email', 'phone', 'website', 'in_app', 'audition')),
  contact_email TEXT,
  contact_phone TEXT,
  website_url TEXT,
  audition_required BOOLEAN DEFAULT false,
  audition_details TEXT,
  portfolio_required BOOLEAN DEFAULT false,
  
  -- Gig status and management
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('draft', 'open', 'closed', 'filled', 'cancelled')),
  applications_count INTEGER DEFAULT 0,
  max_applications INTEGER,
  featured BOOLEAN DEFAULT false,
  urgent BOOLEAN DEFAULT false,
  
  -- Additional details
  special_requirements TEXT,
  notes TEXT, -- Internal notes for the poster
  tags TEXT[], -- For categorization and search
  
  -- Media attachments
  images TEXT[], -- Array of image URLs
  attachments TEXT[], -- Array of document URLs (contracts, music sheets, etc.)
  
  -- SEO and discovery
  excerpt TEXT, -- Short description for listings
  
  -- Moderation
  is_flagged BOOLEAN DEFAULT false,
  flagged_reason TEXT,
  moderator_id UUID REFERENCES public.users(id),
  moderated_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  published_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Constraints
  CONSTRAINT either_user_or_organization_poster CHECK (
    (posted_by_user_id IS NOT NULL AND posted_by_organization_id IS NULL) OR 
    (posted_by_user_id IS NULL AND posted_by_organization_id IS NOT NULL)
  ),
  CONSTRAINT valid_ensemble_size CHECK (
    ensemble_size_min IS NULL OR ensemble_size_max IS NULL OR ensemble_size_min <= ensemble_size_max
  ),
  CONSTRAINT valid_pay_range CHECK (
    pay_amount_min IS NULL OR pay_amount_max IS NULL OR pay_amount_min <= pay_amount_max
  ),
  CONSTRAINT valid_date_range CHECK (
    end_date IS NULL OR start_date <= end_date
  ),
  CONSTRAINT valid_time_range CHECK (
    start_time IS NULL OR end_time IS NULL OR start_time <= end_time
  )
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_gigs_posted_by_user_id ON public.gigs(posted_by_user_id);
CREATE INDEX IF NOT EXISTS idx_gigs_posted_by_organization_id ON public.gigs(posted_by_organization_id);
CREATE INDEX IF NOT EXISTS idx_gigs_gig_type ON public.gigs(gig_type);
CREATE INDEX IF NOT EXISTS idx_gigs_status ON public.gigs(status);
CREATE INDEX IF NOT EXISTS idx_gigs_city ON public.gigs(city);
CREATE INDEX IF NOT EXISTS idx_gigs_state_province ON public.gigs(state_province);
CREATE INDEX IF NOT EXISTS idx_gigs_country ON public.gigs(country);
CREATE INDEX IF NOT EXISTS idx_gigs_start_date ON public.gigs(start_date);
CREATE INDEX IF NOT EXISTS idx_gigs_application_deadline ON public.gigs(application_deadline);
CREATE INDEX IF NOT EXISTS idx_gigs_compensation_type ON public.gigs(compensation_type);
CREATE INDEX IF NOT EXISTS idx_gigs_experience_level ON public.gigs(experience_level);
CREATE INDEX IF NOT EXISTS idx_gigs_created_at ON public.gigs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gigs_published_at ON public.gigs(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_gigs_featured ON public.gigs(featured);
CREATE INDEX IF NOT EXISTS idx_gigs_urgent ON public.gigs(urgent);
CREATE INDEX IF NOT EXISTS idx_gigs_is_remote ON public.gigs(is_remote);

-- Spatial index for location-based searches
CREATE INDEX IF NOT EXISTS idx_gigs_coordinates ON public.gigs(latitude, longitude);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_gigs_status_start_date ON public.gigs(status, start_date);
CREATE INDEX IF NOT EXISTS idx_gigs_city_start_date ON public.gigs(city, start_date);
CREATE INDEX IF NOT EXISTS idx_gigs_compensation_location ON public.gigs(compensation_type, city);

-- GIN indexes for array and search columns
CREATE INDEX IF NOT EXISTS idx_gigs_instruments_needed ON public.gigs USING GIN(instruments_needed);
CREATE INDEX IF NOT EXISTS idx_gigs_genres ON public.gigs USING GIN(genres);
CREATE INDEX IF NOT EXISTS idx_gigs_required_skills ON public.gigs USING GIN(required_skills);
CREATE INDEX IF NOT EXISTS idx_gigs_preferred_skills ON public.gigs USING GIN(preferred_skills);
CREATE INDEX IF NOT EXISTS idx_gigs_tags ON public.gigs USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_gigs_equipment_provided ON public.gigs USING GIN(equipment_provided);
CREATE INDEX IF NOT EXISTS idx_gigs_equipment_required ON public.gigs USING GIN(equipment_required);

  -- Safe full-text search setup without expression index (keeps original section intact below)
  ALTER TABLE public.gigs
  ADD COLUMN IF NOT EXISTS search_vector tsvector;

  CREATE OR REPLACE FUNCTION public.gigs_search_vector_update()
  RETURNS trigger LANGUAGE plpgsql AS $$
  BEGIN
    NEW.search_vector :=
      setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
      setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B') ||
      setweight(to_tsvector('english', coalesce(NEW.venue_name, '')), 'C') ||
      to_tsvector('english', coalesce(array_to_string(NEW.instruments_needed, ' '), '')) ||
      to_tsvector('english', coalesce(array_to_string(NEW.genres, ' '), '')) ||
      to_tsvector('english', coalesce(array_to_string(NEW.tags, ' '), ''));
    RETURN NEW;
  END $$;

  DROP TRIGGER IF EXISTS gigs_search_vector_update ON public.gigs;

  CREATE TRIGGER gigs_search_vector_update
  BEFORE INSERT OR UPDATE ON public.gigs
  FOR EACH ROW
  EXECUTE FUNCTION public.gigs_search_vector_update();

  -- Create the index with the SAME NAME that the legacy expression index would use, so the
  -- "IF NOT EXISTS" in that block will safely no-op in environments where this has run.
  CREATE INDEX IF NOT EXISTS idx_gigs_search
  ON public.gigs USING GIN (search_vector);

-- Full-text search index (legacy expression version). Kept for history but superseded by column-based index above.
-- CREATE INDEX IF NOT EXISTS idx_gigs_search ON public.gigs USING GIN(to_tsvector('english',
--   COALESCE(title, '') || ' ' ||
--   COALESCE(description, '') || ' ' ||
--   COALESCE(venue_name, '') || ' ' ||
--   COALESCE(array_to_string(instruments_needed, ' '), '') || ' ' ||
--   COALESCE(array_to_string(genres, ' '), '') || ' ' ||
--   COALESCE(array_to_string(tags, ' '), '')
-- ));

-- Enable RLS (Row Level Security)
ALTER TABLE public.gigs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for gigs table
-- Anyone can view open and published gigs
CREATE POLICY "Anyone can view open gigs" ON public.gigs
  FOR SELECT
  USING (
    status = 'open' AND 
    published_at IS NOT NULL AND
    published_at <= timezone('utc'::text, now()) AND
    (expires_at IS NULL OR expires_at > timezone('utc'::text, now()))
  );

-- Authenticated users can view all published gigs (including closed ones for reference)
CREATE POLICY "Authenticated users can view published gigs" ON public.gigs
  FOR SELECT
  USING (
    auth.role() = 'authenticated' AND
    published_at IS NOT NULL AND
    status IN ('open', 'closed', 'filled')
  );

-- Users can view their own gigs (including drafts)
CREATE POLICY "Users can view own gigs" ON public.gigs
  FOR SELECT
  USING (
    auth.uid() = posted_by_user_id OR
    (posted_by_organization_id IS NOT NULL AND public.is_organization_admin(posted_by_organization_id, auth.uid()))
  );

-- Users can create gigs
CREATE POLICY "Users can create gigs" ON public.gigs
  FOR INSERT
  WITH CHECK (
    auth.uid() = posted_by_user_id OR
    (posted_by_organization_id IS NOT NULL AND public.is_organization_admin(posted_by_organization_id, auth.uid()))
  );

-- Users can update their own gigs
CREATE POLICY "Users can update own gigs" ON public.gigs
  FOR UPDATE
  USING (
    auth.uid() = posted_by_user_id OR
    (posted_by_organization_id IS NOT NULL AND public.is_organization_admin(posted_by_organization_id, auth.uid()))
  );

-- Users can delete their own gigs
CREATE POLICY "Users can delete own gigs" ON public.gigs
  FOR DELETE
  USING (
    auth.uid() = posted_by_user_id OR
    (posted_by_organization_id IS NOT NULL AND public.is_organization_admin(posted_by_organization_id, auth.uid()))
  );

-- Create trigger for updated_at
CREATE TRIGGER set_updated_at_gigs
  BEFORE UPDATE ON public.gigs
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Function to automatically set published_at when status changes to open
CREATE OR REPLACE FUNCTION public.handle_gig_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Set published_at when status changes to open (if not already set)
  IF NEW.status = 'open' AND OLD.status != 'open' AND NEW.published_at IS NULL THEN
    NEW.published_at = timezone('utc'::text, now());
  END IF;
  
  -- Clear published_at when status changes to draft
  IF NEW.status = 'draft' AND OLD.status != 'draft' THEN
    NEW.published_at = NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for gig status changes
CREATE TRIGGER on_gig_status_change
  BEFORE UPDATE OF status ON public.gigs
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_gig_status_change();

-- Grant permissions
GRANT ALL ON public.gigs TO authenticated;
GRANT SELECT ON public.gigs TO anon;