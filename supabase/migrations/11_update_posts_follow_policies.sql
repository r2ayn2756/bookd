-- Update posts table policies to work with the follows system
-- This migration refines the RLS policies for posts to properly handle follower visibility

-- Drop the existing follower policy that was too broad
DROP POLICY IF EXISTS "Authenticated users can view follower posts" ON public.posts;

-- Create refined policy for posts visible to followers
CREATE POLICY "Followers can view follower-only posts" ON public.posts
  FOR SELECT
  USING (
    auth.role() = 'authenticated' AND 
    visibility = 'followers' AND 
    is_published = true AND
    (
      -- User is following the post author
      (user_id IS NOT NULL AND public.is_following_user(user_id, auth.uid())) OR
      -- User is following the organization that posted
      (organization_id IS NOT NULL AND public.is_following_organization(organization_id, auth.uid()))
    )
  );

-- Update the post_likes policies to work with follows
DROP POLICY IF EXISTS "Users can like visible posts" ON public.post_likes;

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
        -- Posts visible to followers
        (p.visibility = 'followers' AND p.is_published = true AND (
          (p.user_id IS NOT NULL AND public.is_following_user(p.user_id, auth.uid())) OR
          (p.organization_id IS NOT NULL AND public.is_following_organization(p.organization_id, auth.uid()))
        ))
      )
    )
  );

-- Update the post_likes view policy to work with follows
DROP POLICY IF EXISTS "Users can view likes on visible posts" ON public.post_likes;

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
        -- Posts visible to followers
        (p.visibility = 'followers' AND p.is_published = true AND (
          (p.user_id IS NOT NULL AND public.is_following_user(p.user_id, auth.uid())) OR
          (p.organization_id IS NOT NULL AND public.is_following_organization(p.organization_id, auth.uid()))
        ))
      )
    )
  );

-- Update the post_comments policies to work with follows
DROP POLICY IF EXISTS "Users can view comments on visible posts" ON public.post_comments;

CREATE POLICY "Users can view comments on visible posts" ON public.post_comments
  FOR SELECT
  USING (
    is_deleted = false AND
    EXISTS (
      SELECT 1 FROM public.posts p
      WHERE p.id = post_comments.post_id
      AND (
        -- Public posts
        (p.visibility = 'public' AND p.is_published = true) OR
        -- User's own posts
        (auth.uid() = p.user_id) OR
        -- Organization posts user can manage
        (p.organization_id IS NOT NULL AND public.is_organization_admin(p.organization_id, auth.uid())) OR
        -- Posts visible to followers
        (p.visibility = 'followers' AND p.is_published = true AND (
          (p.user_id IS NOT NULL AND public.is_following_user(p.user_id, auth.uid())) OR
          (p.organization_id IS NOT NULL AND public.is_following_organization(p.organization_id, auth.uid()))
        ))
      )
    )
  );

DROP POLICY IF EXISTS "Users can comment on visible posts" ON public.post_comments;

CREATE POLICY "Users can comment on visible posts" ON public.post_comments
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.posts p
      WHERE p.id = post_comments.post_id
      AND p.allow_comments = true
      AND (
        -- Public posts
        (p.visibility = 'public' AND p.is_published = true) OR
        -- Posts visible to followers
        (p.visibility = 'followers' AND p.is_published = true AND (
          (p.user_id IS NOT NULL AND public.is_following_user(p.user_id, auth.uid())) OR
          (p.organization_id IS NOT NULL AND public.is_following_organization(p.organization_id, auth.uid()))
        ))
      )
    )
  );

-- Create function to get posts for user's feed (following + own posts)
CREATE OR REPLACE FUNCTION public.get_user_feed(
  p_user_id UUID DEFAULT auth.uid(),
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  organization_id UUID,
  content TEXT,
  title TEXT,
  post_type TEXT,
  visibility TEXT,
  likes_count INTEGER,
  comments_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  is_liked BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.user_id,
    p.organization_id,
    p.content,
    p.title,
    p.post_type,
    p.visibility,
    p.likes_count,
    p.comments_count,
    p.created_at,
    EXISTS(
      SELECT 1 FROM public.post_likes pl 
      WHERE pl.post_id = p.id AND pl.user_id = p_user_id
    ) as is_liked
  FROM public.posts p
  WHERE p.is_published = true
  AND (
    -- User's own posts
    p.user_id = p_user_id OR
    -- Organization posts from orgs user admins
    (p.organization_id IS NOT NULL AND public.is_organization_admin(p.organization_id, p_user_id)) OR
    -- Public posts
    p.visibility = 'public' OR
    -- Posts from followed users/organizations
    (p.visibility = 'followers' AND (
      (p.user_id IS NOT NULL AND public.is_following_user(p.user_id, p_user_id)) OR
      (p.organization_id IS NOT NULL AND public.is_following_organization(p.organization_id, p_user_id))
    ))
  )
  ORDER BY p.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_user_feed(UUID, INTEGER, INTEGER) TO authenticated;