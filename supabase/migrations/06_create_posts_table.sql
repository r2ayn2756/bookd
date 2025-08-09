-- Create posts table with media fields
-- This table stores user posts including text, images, videos, and audio content

CREATE TABLE IF NOT EXISTS public.posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Author information
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  organization_id UUID REFERENCES public.organization_profiles(id) ON DELETE CASCADE,
  
  -- Post content
  content TEXT, -- Main text content
  title TEXT, -- Optional title for posts
  
  -- Media attachments
  media_urls TEXT[], -- Array of media URLs (images, videos, audio)
  media_types TEXT[], -- Array of media types ('image', 'video', 'audio', 'document')
  media_metadata JSONB DEFAULT '{}', -- Store metadata like dimensions, duration, etc.
  
  -- Post type and categorization
  post_type TEXT NOT NULL DEFAULT 'general' CHECK (post_type IN ('general', 'performance', 'announcement', 'collaboration', 'opportunity', 'review', 'event')),
  tags TEXT[], -- Array of hashtags/tags
  
  -- Location information (for performance posts, events, etc.)
  location TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- Performance/Event specific fields
  event_date TIMESTAMP WITH TIME ZONE, -- For performance announcements
  venue_name TEXT,
  ticket_url TEXT,
  
  -- Collaboration specific fields
  collaboration_type TEXT, -- 'seeking_musicians', 'seeking_venue', 'offering_services'
  instruments_needed TEXT[],
  genres TEXT[],
  compensation_offered TEXT,
  
  -- Post visibility and settings
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'followers', 'private', 'organization')),
  allow_comments BOOLEAN DEFAULT true,
  allow_shares BOOLEAN DEFAULT true,
  
  -- Engagement metrics (updated by triggers)
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  
  -- Content moderation
  is_flagged BOOLEAN DEFAULT false,
  flagged_reason TEXT,
  moderator_id UUID REFERENCES public.users(id),
  moderated_at TIMESTAMP WITH TIME ZONE,
  
  -- Post status
  is_published BOOLEAN DEFAULT true,
  is_pinned BOOLEAN DEFAULT false, -- For organization posts
  
  -- SEO and discovery
  excerpt TEXT, -- Auto-generated or manual excerpt for previews
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  published_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  
  -- Constraints
  CONSTRAINT either_user_or_organization CHECK (
    (user_id IS NOT NULL AND organization_id IS NULL) OR 
    (user_id IS NULL AND organization_id IS NOT NULL)
  ),
  CONSTRAINT media_arrays_same_length CHECK (
    array_length(media_urls, 1) = array_length(media_types, 1) OR
    media_urls IS NULL OR
    media_types IS NULL
  )
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON public.posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_organization_id ON public.posts(organization_id);
CREATE INDEX IF NOT EXISTS idx_posts_post_type ON public.posts(post_type);
CREATE INDEX IF NOT EXISTS idx_posts_visibility ON public.posts(visibility);
CREATE INDEX IF NOT EXISTS idx_posts_is_published ON public.posts(is_published);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_published_at ON public.posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_event_date ON public.posts(event_date);
CREATE INDEX IF NOT EXISTS idx_posts_location ON public.posts(location);
CREATE INDEX IF NOT EXISTS idx_posts_is_pinned ON public.posts(is_pinned);

-- Spatial index for location-based searches
CREATE INDEX IF NOT EXISTS idx_posts_coordinates ON public.posts(latitude, longitude);

-- GIN indexes for array and JSONB columns
CREATE INDEX IF NOT EXISTS idx_posts_tags ON public.posts USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_posts_media_types ON public.posts USING GIN(media_types);
CREATE INDEX IF NOT EXISTS idx_posts_instruments_needed ON public.posts USING GIN(instruments_needed);
CREATE INDEX IF NOT EXISTS idx_posts_genres ON public.posts USING GIN(genres);
CREATE INDEX IF NOT EXISTS idx_posts_media_metadata ON public.posts USING GIN(media_metadata);

-- Full-text search index
-- CREATE INDEX IF NOT EXISTS idx_posts_content_search ON public.posts USING GIN(to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(content, '') || ' ' || COALESCE(array_to_string(tags, ' '), '')));

-- Enable RLS (Row Level Security)
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for posts table
-- Users can view public posts
CREATE POLICY "Anyone can view public posts" ON public.posts
  FOR SELECT
  USING (visibility = 'public' AND is_published = true);

-- Authenticated users can view posts visible to followers (will be refined with follows table)
CREATE POLICY "Authenticated users can view follower posts" ON public.posts
  FOR SELECT
  USING (
    auth.role() = 'authenticated' AND 
    visibility = 'followers' AND 
    is_published = true
  );

-- Users can view their own posts
CREATE POLICY "Users can view own posts" ON public.posts
  FOR SELECT
  USING (
    auth.uid() = user_id OR
    (organization_id IS NOT NULL AND public.is_organization_admin(organization_id, auth.uid()))
  );

-- Users can create posts
CREATE POLICY "Users can create posts" ON public.posts
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id OR
    (organization_id IS NOT NULL AND public.is_organization_admin(organization_id, auth.uid()))
  );

-- Users can update their own posts
CREATE POLICY "Users can update own posts" ON public.posts
  FOR UPDATE
  USING (
    auth.uid() = user_id OR
    (organization_id IS NOT NULL AND public.is_organization_admin(organization_id, auth.uid()))
  );

-- Users can delete their own posts
CREATE POLICY "Users can delete own posts" ON public.posts
  FOR DELETE
  USING (
    auth.uid() = user_id OR
    (organization_id IS NOT NULL AND public.is_organization_admin(organization_id, auth.uid()))
  );

-- Create trigger for updated_at
CREATE TRIGGER set_updated_at_posts
  BEFORE UPDATE ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Function to update engagement counts
CREATE OR REPLACE FUNCTION public.update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts 
    SET likes_count = likes_count + 1 
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts 
    SET likes_count = likes_count - 1 
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts 
    SET comments_count = comments_count + 1 
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts 
    SET comments_count = comments_count - 1 
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT ALL ON public.posts TO authenticated;
GRANT SELECT ON public.posts TO anon;