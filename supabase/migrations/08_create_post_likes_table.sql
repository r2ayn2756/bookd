-- Create post_likes table for managing post likes/reactions
-- This table tracks which users liked which posts

CREATE TABLE IF NOT EXISTS public.post_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- References
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  
  -- Reaction type (for future expansion to support different reactions)
  reaction_type TEXT NOT NULL DEFAULT 'like' CHECK (reaction_type IN ('like', 'love', 'laugh', 'wow', 'sad', 'angry')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Ensure unique combination of user and post for each reaction type
  UNIQUE(user_id, post_id, reaction_type)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON public.post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON public.post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_reaction_type ON public.post_likes(reaction_type);
CREATE INDEX IF NOT EXISTS idx_post_likes_created_at ON public.post_likes(created_at DESC);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_post_likes_post_reaction ON public.post_likes(post_id, reaction_type);

-- Enable RLS (Row Level Security)
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for post_likes table
-- Users can view likes on posts they can see
CREATE POLICY "Users can view likes on visible posts" ON public.post_likes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.posts p
      WHERE p.id = post_likes.post_id
      AND (
        -- Public posts
        (p.visibility = 'public' AND p.is_published = true) OR
        -- User's own posts
        (auth.uid() = p.user_id) OR
        -- Organization posts user can manage
        (p.organization_id IS NOT NULL AND public.is_organization_admin(p.organization_id, auth.uid())) OR
        -- Posts visible to followers (will be refined with follows table)
        (auth.role() = 'authenticated' AND p.visibility = 'followers' AND p.is_published = true)
      )
    )
  );

-- Users can view their own likes
CREATE POLICY "Users can view own likes" ON public.post_likes
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can like posts they can see
CREATE POLICY "Users can like visible posts" ON public.post_likes
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.posts p
      WHERE p.id = post_likes.post_id
      AND (
        -- Public posts
        (p.visibility = 'public' AND p.is_published = true) OR
        -- Posts visible to followers (will be refined with follows table)
        (auth.role() = 'authenticated' AND p.visibility = 'followers' AND p.is_published = true)
      )
    )
  );

-- Users can unlike their own likes
CREATE POLICY "Users can unlike own likes" ON public.post_likes
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create triggers to update post likes count
CREATE TRIGGER update_post_likes_count_on_insert
  AFTER INSERT ON public.post_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_post_likes_count();

CREATE TRIGGER update_post_likes_count_on_delete
  AFTER DELETE ON public.post_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_post_likes_count();

-- Function to get like status for a user on a post
CREATE OR REPLACE FUNCTION public.get_user_post_like(p_post_id UUID, p_user_id UUID DEFAULT auth.uid())
RETURNS TEXT AS $$
DECLARE
  like_reaction TEXT;
BEGIN
  SELECT reaction_type INTO like_reaction
  FROM public.post_likes
  WHERE post_id = p_post_id AND user_id = p_user_id;
  
  RETURN COALESCE(like_reaction, 'none');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to toggle like on a post
CREATE OR REPLACE FUNCTION public.toggle_post_like(p_post_id UUID, p_reaction_type TEXT DEFAULT 'like')
RETURNS BOOLEAN AS $$
DECLARE
  existing_like RECORD;
  like_added BOOLEAN := false;
BEGIN
  -- Check if user already liked this post with this reaction
  SELECT * INTO existing_like
  FROM public.post_likes
  WHERE post_id = p_post_id 
  AND user_id = auth.uid() 
  AND reaction_type = p_reaction_type;
  
  IF existing_like.id IS NOT NULL THEN
    -- Unlike: Remove existing like
    DELETE FROM public.post_likes
    WHERE id = existing_like.id;
    like_added := false;
  ELSE
    -- Like: Add new like (this will also remove any other reaction type due to unique constraint handling)
    -- First remove any existing reactions from this user on this post
    DELETE FROM public.post_likes
    WHERE post_id = p_post_id AND user_id = auth.uid();
    
    -- Then add the new reaction
    INSERT INTO public.post_likes (user_id, post_id, reaction_type)
    VALUES (auth.uid(), p_post_id, p_reaction_type);
    like_added := true;
  END IF;
  
  RETURN like_added;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT ALL ON public.post_likes TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_post_like(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_post_like(UUID, TEXT) TO authenticated;