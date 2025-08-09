-- Additional performance indexes for content tables
-- This migration adds specialized indexes for common query patterns

-- Additional composite indexes for posts table
CREATE INDEX IF NOT EXISTS idx_posts_user_visibility_published ON public.posts(user_id, visibility, is_published);
CREATE INDEX IF NOT EXISTS idx_posts_org_visibility_published ON public.posts(organization_id, visibility, is_published);
CREATE INDEX IF NOT EXISTS idx_posts_type_published_created ON public.posts(post_type, is_published, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_visibility_published_created ON public.posts(visibility, is_published, created_at DESC);

-- Indexes for engagement-based queries
CREATE INDEX IF NOT EXISTS idx_posts_likes_count_desc ON public.posts(likes_count DESC) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_posts_comments_count_desc ON public.posts(comments_count DESC) WHERE is_published = true;

-- Additional indexes for gigs table
CREATE INDEX IF NOT EXISTS idx_gigs_status_start_published ON public.gigs(status, start_date, published_at);
CREATE INDEX IF NOT EXISTS idx_gigs_compensation_min_max ON public.gigs(compensation_type, pay_amount_min, pay_amount_max);
CREATE INDEX IF NOT EXISTS idx_gigs_location_date ON public.gigs(city, country, start_date);
CREATE INDEX IF NOT EXISTS idx_gigs_featured_urgent_start ON public.gigs(featured, urgent, start_date);

-- Partial indexes for active gigs only
CREATE INDEX IF NOT EXISTS idx_gigs_active_by_date ON public.gigs(start_date DESC) 
  WHERE status = 'open' AND published_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_gigs_active_by_location ON public.gigs(city, state_province) 
  WHERE status = 'open' AND published_at IS NOT NULL;

-- Additional indexes for post_likes table
CREATE INDEX IF NOT EXISTS idx_post_likes_post_created ON public.post_likes(post_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_created ON public.post_likes(user_id, created_at DESC);

-- Additional indexes for post_comments table
CREATE INDEX IF NOT EXISTS idx_post_comments_user_created ON public.post_comments(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_comments_post_parent_created ON public.post_comments(post_id, parent_comment_id, created_at);

-- Partial index for top-level comments only
CREATE INDEX IF NOT EXISTS idx_post_comments_top_level ON public.post_comments(post_id, created_at DESC) 
  WHERE parent_comment_id IS NULL AND is_deleted = false;

-- Additional indexes for follows table
CREATE INDEX IF NOT EXISTS idx_follows_mutual_active ON public.follows(is_mutual, status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_follows_notifications ON public.follows(follower_user_id, notifications_enabled) 
  WHERE status = 'active';

-- Covering indexes for common join patterns
CREATE INDEX IF NOT EXISTS idx_follows_with_details ON public.follows(follower_user_id, followed_user_id, status, is_mutual, created_at);

-- Function-based indexes for search optimization
CREATE INDEX IF NOT EXISTS idx_posts_content_length ON public.posts(char_length(content)) WHERE content IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_gigs_title_length ON public.gigs(char_length(title));

-- Expression indexes for case-insensitive searches
CREATE INDEX IF NOT EXISTS idx_posts_title_lower ON public.posts(lower(title)) WHERE title IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_gigs_title_lower ON public.gigs(lower(title));
CREATE INDEX IF NOT EXISTS idx_gigs_city_lower ON public.gigs(lower(city));

-- Create materialized view for popular posts (optional, for heavy read workloads)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_matviews WHERE schemaname = 'public' AND matviewname = 'popular_posts'
  ) THEN
    CREATE MATERIALIZED VIEW public.popular_posts AS
SELECT 
  p.id,
  p.user_id,
  p.organization_id,
  p.title,
  p.content,
  p.post_type,
  p.likes_count,
  p.comments_count,
  p.created_at,
  (p.likes_count * 2 + p.comments_count * 3) AS popularity_score
FROM public.posts p
WHERE p.is_published = true 
  AND p.visibility = 'public'
  AND p.created_at > (CURRENT_DATE - INTERVAL '30 days')
ORDER BY popularity_score DESC, p.created_at DESC;
  END IF;
END $$;

-- Index on the materialized view
CREATE INDEX IF NOT EXISTS idx_popular_posts_score ON public.popular_posts(popularity_score DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_popular_posts_type ON public.popular_posts(post_type, popularity_score DESC);

-- Create function to refresh popular posts view
CREATE OR REPLACE FUNCTION public.refresh_popular_posts()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW public.popular_posts;
END;
$$ LANGUAGE plpgsql;

-- Performance monitoring view
CREATE OR REPLACE VIEW public.content_stats AS
SELECT 
  'posts' as table_name,
  COUNT(*) as total_count,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as last_24h,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as last_7d,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as last_30d
FROM public.posts
WHERE is_published = true

UNION ALL

SELECT 
  'gigs' as table_name,
  COUNT(*) as total_count,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as last_24h,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as last_7d,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as last_30d
FROM public.gigs
WHERE status = 'open' AND published_at IS NOT NULL

UNION ALL

SELECT 
  'post_likes' as table_name,
  COUNT(*) as total_count,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as last_24h,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as last_7d,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as last_30d
FROM public.post_likes

UNION ALL

SELECT 
  'post_comments' as table_name,
  COUNT(*) as total_count,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as last_24h,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as last_7d,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as last_30d
FROM public.post_comments
WHERE is_deleted = false

UNION ALL

SELECT 
  'follows' as table_name,
  COUNT(*) as total_count,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as last_24h,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as last_7d,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as last_30d
FROM public.follows
WHERE status = 'active';

-- Grant permissions
GRANT SELECT ON public.popular_posts TO authenticated, anon;
GRANT SELECT ON public.content_stats TO authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_popular_posts() TO authenticated;