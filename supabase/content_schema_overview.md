# Content Tables Schema Overview

## Tables Created in 2.2

### 1. posts
**Purpose**: Social media-style posts with rich media support and collaboration features

**Key Features**:
- ✅ Multi-media support (images, videos, audio, documents)
- ✅ Post types (general, performance, announcement, collaboration, opportunity, review, event)
- ✅ Visibility controls (public, followers, private, organization)
- ✅ Location tagging with coordinates
- ✅ Collaboration-specific fields (instruments needed, compensation)
- ✅ Performance/event announcements with dates and venues
- ✅ Engagement metrics (likes, comments, shares)
- ✅ Content moderation system

**Relationships**:
- `user_id` → `users.id` (author)
- `organization_id` → `organization_profiles.id` (organization author)
- Referenced by `post_likes.post_id`
- Referenced by `post_comments.post_id`

### 2. gigs
**Purpose**: Comprehensive gig and opportunity listings for musicians

**Key Features**:
- ✅ Multiple gig types (one-time, recurring, residency, tour, session, teaching)
- ✅ Detailed compensation structure (hourly, daily, flat fee, profit share)
- ✅ Location-based search with coordinates
- ✅ Skill and experience requirements
- ✅ Equipment specifications (provided vs required)
- ✅ Application process management
- ✅ Date/time scheduling with rehearsals
- ✅ Status tracking (draft, open, closed, filled, cancelled)

**Relationships**:
- `posted_by_user_id` → `users.id` (individual poster)
- `posted_by_organization_id` → `organization_profiles.id` (organization poster)

### 3. post_likes
**Purpose**: Reaction system for posts with multiple reaction types

**Key Features**:
- ✅ Multiple reaction types (like, love, laugh, wow, sad, angry)
- ✅ Unique user-post-reaction combinations
- ✅ Automatic post like count updates via triggers
- ✅ Toggle functionality for easy like/unlike

**Relationships**:
- `user_id` → `users.id` (user who liked)
- `post_id` → `posts.id` (liked post)

### 4. post_comments
**Purpose**: Threaded comment system with moderation

**Key Features**:
- ✅ Threaded replies (parent-child relationships)
- ✅ Soft delete to preserve thread structure
- ✅ Edit tracking (is_edited, edit_count)
- ✅ Reply count for parent comments
- ✅ Content moderation and flagging
- ✅ Full-text search on comment content

**Relationships**:
- `user_id` → `users.id` (comment author)
- `post_id` → `posts.id` (commented post)
- `parent_comment_id` → `post_comments.id` (self-referencing for threads)

### 5. follows
**Purpose**: Social relationships between users and organizations

**Key Features**:
- ✅ User-to-user and user-to-organization follows
- ✅ Mutual follow detection and tracking
- ✅ Follow types (follow, close_friend, collaborator)
- ✅ Status management (active, blocked, muted)
- ✅ Notification preferences per follow
- ✅ Privacy controls (public/private relationships)

**Relationships**:
- `follower_user_id` → `users.id` (user doing the following)
- `followed_user_id` → `users.id` (followed user)
- `followed_organization_id` → `organization_profiles.id` (followed organization)

## Advanced Features Implemented

### Row Level Security (RLS)
- **posts**: Visibility-based access with follower integration
- **gigs**: Public for open gigs, owner/admin access for management
- **post_likes**: Can only like posts you can see
- **post_comments**: Can only comment on posts you can see
- **follows**: Users control their own relationships, public visibility options

### Performance Optimizations
- **Comprehensive Indexing**: 50+ specialized indexes
- **GIN Indexes**: Full-text search on content, array fields
- **Spatial Indexes**: Location-based searches for posts and gigs
- **Composite Indexes**: Optimized for common query patterns
- **Materialized Views**: Popular posts for heavy read workloads

### Trigger Functions
- **Auto-counting**: Automatic updates of likes_count, comments_count
- **Mutual Follows**: Automatic detection and updating of mutual relationships
- **Status Changes**: Auto-publishing when gig status changes to 'open'
- **Soft Deletes**: Preserve comment thread structure

### Helper Functions
- **Social Functions**: `toggle_follow_user()`, `is_following_organization()`
- **Engagement Functions**: `toggle_post_like()`, `get_user_post_like()`
- **Feed Functions**: `get_user_feed()` for personalized content
- **Comment Functions**: `get_post_comments_tree()`, `soft_delete_comment()`

## Key SQL Features Used

### Advanced PostgreSQL Features
- **JSONB Fields**: For flexible metadata, preferences, and configurations
- **Array Fields**: For tags, instruments, genres, media URLs
- **Check Constraints**: Data validation at database level
- **Partial Indexes**: Performance optimization for filtered queries
- **Expression Indexes**: Case-insensitive searches
- **Recursive CTEs**: Comment tree traversal

### Data Integrity
- **Foreign Key Constraints**: Maintain referential integrity
- **Unique Constraints**: Prevent duplicate likes, follows
- **Check Constraints**: Validate enum values, date ranges
- **Exclusion Constraints**: Ensure either user or organization authorship

## Migration Order

1. **06_create_posts_table.sql** - Posts with media support
2. **07_create_gigs_table.sql** - Comprehensive gig listings
3. **08_create_post_likes_table.sql** - Reaction system
4. **09_create_post_comments_table.sql** - Threaded comments
5. **10_create_follows_table.sql** - Social relationships
6. **11_update_posts_follow_policies.sql** - Integrate follows with posts
7. **12_additional_performance_indexes.sql** - Performance optimizations

## Usage Examples

### Creating a Post
```sql
INSERT INTO posts (user_id, content, post_type, visibility, tags)
VALUES (auth.uid(), 'Looking for a guitarist for our jazz quartet!', 'collaboration', 'public', ARRAY['jazz', 'guitarist', 'collaboration']);
```

### Creating a Gig
```sql
INSERT INTO gigs (posted_by_organization_id, title, description, gig_type, instruments_needed, city, country, start_date, compensation_type, pay_amount_min)
VALUES ('org-uuid', 'Wedding Pianist Needed', 'Looking for an experienced pianist...', 'one_time', ARRAY['piano'], 'New York', 'USA', '2024-06-15', 'paid', 200.00);
```

### Following a User
```sql
SELECT toggle_follow_user('target-user-uuid'); -- Returns true if now following, false if unfollowed
```

### Getting User Feed
```sql
SELECT * FROM get_user_feed(auth.uid(), 20, 0); -- Get 20 most recent posts for user's feed
```

## Next Steps for Implementation

1. **Apply all migrations** in the correct order
2. **Test RLS policies** with different user roles
3. **Implement frontend components** for posts, gigs, follows
4. **Set up media upload** integration (Cloudinary/Supabase Storage)
5. **Create search functionality** using full-text indexes
6. **Implement real-time features** with Supabase subscriptions

## Performance Considerations

- **Materialized View**: Refresh `popular_posts` periodically for trending content
- **Pagination**: Always use LIMIT/OFFSET for large result sets
- **Indexes**: Monitor query performance and add indexes as needed
- **Caching**: Consider Redis for frequently accessed data like follower counts
- **Media Optimization**: Implement CDN for media URLs stored in posts/gigs