-- Create tables for managing user performances and experience
-- These tables will store featured performances, experience entries, and past performances

-- Featured performances table - for showcasing best work (YouTube videos, etc.)
CREATE TABLE IF NOT EXISTS public.featured_performances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.individual_profiles(user_id) ON DELETE CASCADE NOT NULL,
  
  -- Performance details
  title TEXT NOT NULL,
  description TEXT,
  youtube_url TEXT, -- YouTube video URL
  thumbnail_url TEXT, -- Auto-extracted or custom thumbnail
  
  -- Organization
  display_order INTEGER DEFAULT 0, -- For custom ordering
  is_active BOOLEAN DEFAULT true, -- Can hide without deleting
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Experience entries table - for work history, positions, education
CREATE TABLE IF NOT EXISTS public.experience_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.individual_profiles(user_id) ON DELETE CASCADE NOT NULL,
  
  -- Experience details
  title TEXT NOT NULL, -- Position title (e.g., "Principal Oboist")
  organization TEXT NOT NULL, -- Organization name (e.g., "USC Wind Ensemble")
  description TEXT, -- Role description
  
  -- Dates
  start_date DATE,
  end_date DATE,
  is_current BOOLEAN DEFAULT false, -- Currently active position
  
  -- Organization
  display_order INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Past performances table - for comprehensive performance history
CREATE TABLE IF NOT EXISTS public.past_performances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.individual_profiles(user_id) ON DELETE CASCADE NOT NULL,
  
  -- Performance details
  title TEXT NOT NULL, -- Performance/event name
  venue TEXT, -- Where it took place
  role TEXT, -- User's role in the performance
  performance_date DATE,
  description TEXT,
  
  -- Additional info
  ensemble_size INTEGER, -- Number of performers
  genre TEXT, -- Musical genre
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_featured_performances_user_id ON public.featured_performances(user_id);
CREATE INDEX IF NOT EXISTS idx_featured_performances_display_order ON public.featured_performances(user_id, display_order);
CREATE INDEX IF NOT EXISTS idx_featured_performances_active ON public.featured_performances(user_id, is_active);

CREATE INDEX IF NOT EXISTS idx_experience_entries_user_id ON public.experience_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_experience_entries_display_order ON public.experience_entries(user_id, display_order);
CREATE INDEX IF NOT EXISTS idx_experience_entries_current ON public.experience_entries(user_id, is_current);

CREATE INDEX IF NOT EXISTS idx_past_performances_user_id ON public.past_performances(user_id);
CREATE INDEX IF NOT EXISTS idx_past_performances_date ON public.past_performances(user_id, performance_date DESC);
CREATE INDEX IF NOT EXISTS idx_past_performances_genre ON public.past_performances(genre);

-- Enable Row Level Security (RLS)
ALTER TABLE public.featured_performances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experience_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.past_performances ENABLE ROW LEVEL SECURITY;

-- RLS Policies for featured_performances
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'featured_performances' AND policyname = 'Users can view all featured performances'
  ) THEN
    CREATE POLICY "Users can view all featured performances" ON public.featured_performances
      FOR SELECT USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'featured_performances' AND policyname = 'Users can manage their own featured performances'
  ) THEN
    CREATE POLICY "Users can manage their own featured performances" ON public.featured_performances
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM public.individual_profiles ip
          WHERE ip.user_id = auth.uid() AND ip.user_id = featured_performances.user_id
        )
      );
  END IF;
END $$;

-- RLS Policies for experience_entries
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'experience_entries' AND policyname = 'Users can view all experience entries'
  ) THEN
    CREATE POLICY "Users can view all experience entries" ON public.experience_entries
      FOR SELECT USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'experience_entries' AND policyname = 'Users can manage their own experience entries'
  ) THEN
    CREATE POLICY "Users can manage their own experience entries" ON public.experience_entries
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM public.individual_profiles ip
          WHERE ip.user_id = auth.uid() AND ip.user_id = experience_entries.user_id
        )
      );
  END IF;
END $$;

-- RLS Policies for past_performances
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'past_performances' AND policyname = 'Users can view all past performances'
  ) THEN
    CREATE POLICY "Users can view all past performances" ON public.past_performances
      FOR SELECT USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'past_performances' AND policyname = 'Users can manage their own past performances'
  ) THEN
    CREATE POLICY "Users can manage their own past performances" ON public.past_performances
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM public.individual_profiles ip
          WHERE ip.user_id = auth.uid() AND ip.user_id = past_performances.user_id
        )
      );
  END IF;
END $$;

-- Add comments for documentation
COMMENT ON TABLE public.featured_performances IS 'Showcased performances for user profiles (YouTube videos, highlights)';
COMMENT ON TABLE public.experience_entries IS 'Professional and educational experience history';
COMMENT ON TABLE public.past_performances IS 'Comprehensive performance history and credits';