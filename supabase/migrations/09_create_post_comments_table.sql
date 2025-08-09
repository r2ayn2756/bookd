-- Create post_comments table for managing comments on posts
-- This table supports threaded comments (replies to comments)

CREATE TABLE IF NOT EXISTS public.post_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- References
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  parent_comment_id UUID REFERENCES public.post_comments(id) ON DELETE CASCADE, -- For threaded replies
  
  -- Comment content
  content TEXT NOT NULL,
  
  -- Comment metadata
  is_edited BOOLEAN DEFAULT false,
  edit_count INTEGER DEFAULT 0,
  
  -- Engagement metrics (for comment likes/reactions in the future)
  likes_count INTEGER DEFAULT 0,
  replies_count INTEGER DEFAULT 0,
  
  -- Moderation
  is_flagged BOOLEAN DEFAULT false,
  flagged_reason TEXT,
  moderator_id UUID REFERENCES public.users(id),
  moderated_at TIMESTAMP WITH TIME ZONE,
  is_deleted BOOLEAN DEFAULT false, -- Soft delete to preserve thread structure
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Constraints
  CONSTRAINT no_self_reply CHECK (id != parent_comment_id),
  CONSTRAINT content_not_empty CHECK (char_length(trim(content)) > 0)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_post_comments_user_id ON public.post_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON public.post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_parent_comment_id ON public.post_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_created_at ON public.post_comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_comments_is_deleted ON public.post_comments(is_deleted);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_post_comments_post_created ON public.post_comments(post_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_comments_parent_created ON public.post_comments(parent_comment_id, created_at DESC);

-- Full-text search index for comment content
CREATE INDEX IF NOT EXISTS idx_post_comments_content_search ON public.post_comments USING GIN(to_tsvector('english', content));

-- Enable RLS (Row Level Security)
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for post_comments table
-- Users can view comments on posts they can see (excluding soft-deleted comments)
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
        -- Posts visible to followers (will be refined with follows table)
        (auth.role() = 'authenticated' AND p.visibility = 'followers' AND p.is_published = true)
      )
    )
  );

-- Users can view their own comments (even soft-deleted ones)
CREATE POLICY "Users can view own comments" ON public.post_comments
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can comment on posts they can see (if comments are allowed)
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
        -- Posts visible to followers (will be refined with follows table)
        (auth.role() = 'authenticated' AND p.visibility = 'followers' AND p.is_published = true)
      )
    )
  );

-- Users can edit their own comments (within a reasonable time limit could be added)
CREATE POLICY "Users can edit own comments" ON public.post_comments
  FOR UPDATE
  USING (auth.uid() = user_id AND is_deleted = false);

-- Users can soft-delete their own comments
CREATE POLICY "Users can delete own comments" ON public.post_comments
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Post authors can moderate comments on their posts
CREATE POLICY "Post authors can moderate comments" ON public.post_comments
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.posts p
      WHERE p.id = post_comments.post_id
      AND (
        auth.uid() = p.user_id OR
        (p.organization_id IS NOT NULL AND public.is_organization_admin(p.organization_id, auth.uid()))
      )
    )
  );

-- Create trigger for updated_at
CREATE TRIGGER set_updated_at_post_comments
  BEFORE UPDATE ON public.post_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create triggers to update post comments count
CREATE TRIGGER update_post_comments_count_on_insert
  AFTER INSERT ON public.post_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_post_comments_count();

CREATE TRIGGER update_post_comments_count_on_delete
  AFTER DELETE ON public.post_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_post_comments_count();

-- Function to update replies count for parent comments
CREATE OR REPLACE FUNCTION public.update_comment_replies_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment replies count for parent comment
    IF NEW.parent_comment_id IS NOT NULL THEN
      UPDATE public.post_comments 
      SET replies_count = replies_count + 1 
      WHERE id = NEW.parent_comment_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement replies count for parent comment
    IF OLD.parent_comment_id IS NOT NULL THEN
      UPDATE public.post_comments 
      SET replies_count = replies_count - 1 
      WHERE id = OLD.parent_comment_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for replies count
CREATE TRIGGER update_comment_replies_count_on_insert
  AFTER INSERT ON public.post_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_comment_replies_count();

CREATE TRIGGER update_comment_replies_count_on_delete
  AFTER DELETE ON public.post_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_comment_replies_count();

-- Function to handle comment editing
CREATE OR REPLACE FUNCTION public.handle_comment_edit()
RETURNS TRIGGER AS $$
BEGIN
  -- Track edits when content changes
  IF OLD.content != NEW.content THEN
    NEW.is_edited = true;
    NEW.edit_count = OLD.edit_count + 1;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for comment editing
CREATE TRIGGER on_comment_edit
  BEFORE UPDATE OF content ON public.post_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_comment_edit();

-- Function to soft delete comment and handle thread structure
CREATE OR REPLACE FUNCTION public.soft_delete_comment(comment_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  comment_record RECORD;
  can_hard_delete BOOLEAN := false;
BEGIN
  -- Get the comment
  SELECT * INTO comment_record
  FROM public.post_comments
  WHERE id = comment_id AND user_id = auth.uid();
  
  IF comment_record.id IS NULL THEN
    RETURN false; -- Comment not found or not owned by user
  END IF;
  
  -- Check if comment has replies
  SELECT COUNT(*) = 0 INTO can_hard_delete
  FROM public.post_comments
  WHERE parent_comment_id = comment_id AND is_deleted = false;
  
  IF can_hard_delete THEN
    -- Hard delete if no replies
    DELETE FROM public.post_comments WHERE id = comment_id;
  ELSE
    -- Soft delete if has replies
    UPDATE public.post_comments 
    SET is_deleted = true, content = '[deleted]'
    WHERE id = comment_id;
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get comments tree for a post
CREATE OR REPLACE FUNCTION public.get_post_comments_tree(p_post_id UUID, p_limit INTEGER DEFAULT 50, p_offset INTEGER DEFAULT 0)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  post_id UUID,
  parent_comment_id UUID,
  content TEXT,
  likes_count INTEGER,
  replies_count INTEGER,
  is_edited BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  level INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE comment_tree AS (
    -- Base case: top-level comments
    SELECT 
      c.id, c.user_id, c.post_id, c.parent_comment_id, c.content,
      c.likes_count, c.replies_count, c.is_edited, c.created_at,
      0 as level
    FROM public.post_comments c
    WHERE c.post_id = p_post_id 
    AND c.parent_comment_id IS NULL 
    AND c.is_deleted = false
    
    UNION ALL
    
    -- Recursive case: replies to comments
    SELECT 
      c.id, c.user_id, c.post_id, c.parent_comment_id, c.content,
      c.likes_count, c.replies_count, c.is_edited, c.created_at,
      ct.level + 1
    FROM public.post_comments c
    INNER JOIN comment_tree ct ON c.parent_comment_id = ct.id
    WHERE c.is_deleted = false
  )
  SELECT * FROM comment_tree
  ORDER BY level, created_at ASC
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT ALL ON public.post_comments TO authenticated;
GRANT EXECUTE ON FUNCTION public.soft_delete_comment(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_post_comments_tree(UUID, INTEGER, INTEGER) TO authenticated;