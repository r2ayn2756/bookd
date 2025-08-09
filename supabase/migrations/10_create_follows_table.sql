-- Create follows table for user relationships
-- This table manages follower/following relationships between users and organizations

CREATE TABLE IF NOT EXISTS public.follows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Follower (the user who is following)
  follower_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Target being followed (either a user or organization)
  followed_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  followed_organization_id UUID REFERENCES public.organization_profiles(id) ON DELETE CASCADE,
  
  -- Follow status and type
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'blocked', 'muted')),
  follow_type TEXT NOT NULL DEFAULT 'follow' CHECK (follow_type IN ('follow', 'close_friend', 'collaborator')),
  
  -- Mutual follow tracking
  is_mutual BOOLEAN DEFAULT false,
  
  -- Notification preferences
  notifications_enabled BOOLEAN DEFAULT true,
  notification_types JSONB DEFAULT '{"posts": true, "gigs": true, "events": true}',
  
  -- Privacy and visibility
  is_public BOOLEAN DEFAULT true, -- Whether this follow relationship is visible to others
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Constraints
  CONSTRAINT either_user_or_organization_followed CHECK (
    (followed_user_id IS NOT NULL AND followed_organization_id IS NULL) OR 
    (followed_user_id IS NULL AND followed_organization_id IS NOT NULL)
  ),
  CONSTRAINT no_self_follow CHECK (follower_user_id != followed_user_id),
  CONSTRAINT unique_user_follow UNIQUE (follower_user_id, followed_user_id),
  CONSTRAINT unique_organization_follow UNIQUE (follower_user_id, followed_organization_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_follows_follower_user_id ON public.follows(follower_user_id);
CREATE INDEX IF NOT EXISTS idx_follows_followed_user_id ON public.follows(followed_user_id);
CREATE INDEX IF NOT EXISTS idx_follows_followed_organization_id ON public.follows(followed_organization_id);
CREATE INDEX IF NOT EXISTS idx_follows_status ON public.follows(status);
CREATE INDEX IF NOT EXISTS idx_follows_follow_type ON public.follows(follow_type);
CREATE INDEX IF NOT EXISTS idx_follows_is_mutual ON public.follows(is_mutual);
CREATE INDEX IF NOT EXISTS idx_follows_created_at ON public.follows(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_follows_is_public ON public.follows(is_public);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_follows_follower_status ON public.follows(follower_user_id, status);
CREATE INDEX IF NOT EXISTS idx_follows_followed_user_status ON public.follows(followed_user_id, status);
CREATE INDEX IF NOT EXISTS idx_follows_followed_org_status ON public.follows(followed_organization_id, status);

-- GIN index for notification preferences
CREATE INDEX IF NOT EXISTS idx_follows_notification_types ON public.follows USING GIN(notification_types);

-- Enable RLS (Row Level Security)
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- RLS Policies for follows table
-- Users can view their own follow relationships
CREATE POLICY "Users can view own follows" ON public.follows
  FOR SELECT
  USING (
    auth.uid() = follower_user_id OR 
    auth.uid() = followed_user_id
  );

-- Users can view public follow relationships
CREATE POLICY "Users can view public follows" ON public.follows
  FOR SELECT
  USING (
    auth.role() = 'authenticated' AND 
    is_public = true AND 
    status = 'active'
  );

-- Organization admins can view who follows their organization
CREATE POLICY "Organization admins can view organization follows" ON public.follows
  FOR SELECT
  USING (
    followed_organization_id IS NOT NULL AND 
    public.is_organization_admin(followed_organization_id, auth.uid())
  );

-- Users can create follow relationships
CREATE POLICY "Users can create follows" ON public.follows
  FOR INSERT
  WITH CHECK (auth.uid() = follower_user_id);

-- Users can update their own follow relationships
CREATE POLICY "Users can update own follows" ON public.follows
  FOR UPDATE
  USING (auth.uid() = follower_user_id);

-- Users can delete their own follow relationships
CREATE POLICY "Users can delete own follows" ON public.follows
  FOR DELETE
  USING (auth.uid() = follower_user_id);

-- Create trigger for updated_at
CREATE TRIGGER set_updated_at_follows
  BEFORE UPDATE ON public.follows
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Function to update mutual follow status
CREATE OR REPLACE FUNCTION public.update_mutual_follow_status()
RETURNS TRIGGER AS $$
DECLARE
  reverse_follow_exists BOOLEAN := false;
BEGIN
  -- Only process if it's a user-to-user follow and status is active
  IF NEW.followed_user_id IS NOT NULL AND NEW.status = 'active' THEN
    -- Check if the reverse follow exists
    SELECT EXISTS(
      SELECT 1 FROM public.follows
      WHERE follower_user_id = NEW.followed_user_id
      AND followed_user_id = NEW.follower_user_id
      AND status = 'active'
    ) INTO reverse_follow_exists;
    
    -- Update mutual status for both follows
    IF reverse_follow_exists THEN
      -- Set this follow as mutual
      NEW.is_mutual = true;
      
      -- Update the reverse follow to be mutual too
      UPDATE public.follows
      SET is_mutual = true
      WHERE follower_user_id = NEW.followed_user_id
      AND followed_user_id = NEW.follower_user_id;
    ELSE
      NEW.is_mutual = false;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for mutual follow updates
CREATE TRIGGER update_mutual_follow_status_trigger
  BEFORE INSERT OR UPDATE ON public.follows
  FOR EACH ROW
  EXECUTE FUNCTION public.update_mutual_follow_status();

-- Function to handle follow deletion and update mutual status
CREATE OR REPLACE FUNCTION public.handle_follow_deletion()
RETURNS TRIGGER AS $$
BEGIN
  -- If this was a user-to-user follow, update the reverse follow's mutual status
  IF OLD.followed_user_id IS NOT NULL THEN
    UPDATE public.follows
    SET is_mutual = false
    WHERE follower_user_id = OLD.followed_user_id
    AND followed_user_id = OLD.follower_user_id;
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for follow deletion
CREATE TRIGGER handle_follow_deletion_trigger
  AFTER DELETE ON public.follows
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_follow_deletion();

-- Function to check if user A follows user B
CREATE OR REPLACE FUNCTION public.is_following_user(target_user_id UUID, current_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.follows
    WHERE follower_user_id = current_user_id
    AND followed_user_id = target_user_id
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user follows organization
CREATE OR REPLACE FUNCTION public.is_following_organization(target_org_id UUID, current_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.follows
    WHERE follower_user_id = current_user_id
    AND followed_organization_id = target_org_id
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get follower count for a user
CREATE OR REPLACE FUNCTION public.get_user_follower_count(target_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM public.follows
    WHERE followed_user_id = target_user_id
    AND status = 'active'
    AND is_public = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get following count for a user
CREATE OR REPLACE FUNCTION public.get_user_following_count(target_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM public.follows
    WHERE follower_user_id = target_user_id
    AND status = 'active'
    AND is_public = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get follower count for an organization
CREATE OR REPLACE FUNCTION public.get_organization_follower_count(target_org_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM public.follows
    WHERE followed_organization_id = target_org_id
    AND status = 'active'
    AND is_public = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to toggle follow status
CREATE OR REPLACE FUNCTION public.toggle_follow_user(target_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  existing_follow RECORD;
  is_now_following BOOLEAN := false;
BEGIN
  -- Check if follow relationship already exists
  SELECT * INTO existing_follow
  FROM public.follows
  WHERE follower_user_id = auth.uid()
  AND followed_user_id = target_user_id;
  
  IF existing_follow.id IS NOT NULL THEN
    -- Unfollow: Remove the relationship
    DELETE FROM public.follows WHERE id = existing_follow.id;
    is_now_following := false;
  ELSE
    -- Follow: Create new relationship
    INSERT INTO public.follows (follower_user_id, followed_user_id)
    VALUES (auth.uid(), target_user_id);
    is_now_following := true;
  END IF;
  
  RETURN is_now_following;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to toggle follow organization
CREATE OR REPLACE FUNCTION public.toggle_follow_organization(target_org_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  existing_follow RECORD;
  is_now_following BOOLEAN := false;
BEGIN
  -- Check if follow relationship already exists
  SELECT * INTO existing_follow
  FROM public.follows
  WHERE follower_user_id = auth.uid()
  AND followed_organization_id = target_org_id;
  
  IF existing_follow.id IS NOT NULL THEN
    -- Unfollow: Remove the relationship
    DELETE FROM public.follows WHERE id = existing_follow.id;
    is_now_following := false;
  ELSE
    -- Follow: Create new relationship
    INSERT INTO public.follows (follower_user_id, followed_organization_id)
    VALUES (auth.uid(), target_org_id);
    is_now_following := true;
  END IF;
  
  RETURN is_now_following;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT ALL ON public.follows TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_following_user(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_following_organization(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_follower_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_following_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_organization_follower_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_follow_user(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_follow_organization(UUID) TO authenticated;