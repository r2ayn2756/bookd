# Feed System Documentation

## Overview
The feed system provides a complete social media-style experience for the Bookd music platform, including posts, likes, comments, and real-time interactions.

## Components

### Core Components

#### `Feed.tsx`
Main feed container that handles:
- Server-side rendering with initial posts
- Client-side loading and pagination
- Error boundary integration
- Create post modal management
- Real-time updates (ready for implementation)

#### `PostCard.tsx`
Individual post display with:
- Author information and avatars
- Post content (text, media, tags)
- Post type indicators (performance, collaboration, etc.)
- Like and comment interactions
- Responsive media galleries

#### `LikeButton.tsx`
Interactive like button featuring:
- Optimistic updates for better UX
- Multiple reaction types support
- Loading states and error handling
- Real-time like count updates

#### `CommentSection.tsx`
Threaded comment system with:
- Nested comment replies (up to 2 levels)
- Comment creation and editing
- User authentication checks
- Real-time comment loading

#### `CreatePostModal.tsx`
Post creation interface supporting:
- Multiple post types (general, performance, event, etc.)
- Rich metadata for different post types
- Content validation and sanitization
- Hashtag extraction
- Privacy controls

### Utility Components

#### `LoadingSkeleton.tsx`
Loading state components:
- `PostSkeleton` - Individual post loading
- `FeedSkeleton` - Full feed loading
- `CommentSkeleton` - Comment loading
- `CreatePostSkeleton` - Create post loading

#### `ErrorBoundary.tsx`
Error handling components:
- `ErrorBoundary` - React error boundary wrapper
- `FeedErrorFallback` - Feed-specific error display
- `PostErrorFallback` - Post-specific error display

## Services Integration

The feed system integrates with three main services:

### `PostsService`
- `getUserFeed()` - Fetch personalized feed
- `togglePostLike()` - Like/unlike posts
- `createPost()` - Create new posts
- `getPostById()` - Get individual posts

### `CommentsService`
- `getPostComments()` - Fetch threaded comments
- `addComment()` - Add new comments/replies
- `updateComment()` - Edit comments
- `deleteComment()` - Soft delete comments

### `UsersService`
- `getCurrentUser()` - Get authenticated user
- `getUserById()` - Get user profiles
- `toggleFollowUser()` - Follow/unfollow users

## Features

### ✅ Implemented
- [x] Dynamic post feed with database integration
- [x] Like/unlike functionality with optimistic updates
- [x] Threaded comment system
- [x] Post creation with multiple types
- [x] Error boundaries and loading states
- [x] Server-side rendering for initial data
- [x] Responsive design
- [x] Type safety with TypeScript

### 🚧 Ready for Implementation
- [ ] Real-time updates with Supabase subscriptions
- [ ] Media upload integration with Cloudinary
- [ ] Push notifications for likes/comments
- [ ] Advanced post filtering and search
- [ ] User tagging in posts and comments
- [ ] Post sharing functionality

## Usage

### Basic Feed Implementation
```tsx
import { Feed } from '@/components/feed';

export default function HomePage() {
  return (
    <Feed 
      initialPosts={serverPosts} 
      currentUserId={user.id} 
    />
  );
}
```

### Individual Components
```tsx
import { PostCard, CommentSection } from '@/components/feed';

// Individual post display
<PostCard 
  post={post} 
  currentUserId={userId}
  onPostUpdate={handleUpdate}
/>

// Comments for a specific post
<CommentSection 
  postId={postId}
  currentUserId={userId}
  onCommentCountUpdate={handleCommentUpdate}
/>
```

## Database Schema

The feed system uses these main tables:
- `posts` - Post content and metadata
- `post_likes` - Like/reaction tracking
- `post_comments` - Threaded comments
- `follows` - User relationships for feed filtering
- `users` - User profiles and authentication

## Performance Considerations

### Optimizations Implemented
- Server-side rendering for initial posts
- Optimistic updates for better UX
- Efficient database queries with proper indexing
- Image lazy loading with Next.js
- Pagination for large feeds

### Recommended Optimizations
- Implement virtual scrolling for very large feeds
- Add image optimization and CDN integration
- Cache frequently accessed data
- Implement feed pre-generation for popular content

## Security

### Implemented Security Features
- Row Level Security (RLS) policies in Supabase
- Content validation and sanitization
- User authentication checks
- Proper error handling without data exposure

### Additional Security Recommendations
- Content moderation system
- Rate limiting for API calls
- Input validation on all user content
- Abuse reporting functionality

## Testing

### Test Files
- `__tests__/services.test.ts` - Service integration tests
- Manual testing functions for development

### Recommended Testing
- Unit tests for individual components
- Integration tests for full feed flow
- E2E tests for user interactions
- Performance testing for large datasets

## Deployment Notes

### Environment Variables Required
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Any Cloudinary keys for media upload

### Database Requirements
- All migration files applied
- RLS policies enabled
- Database functions deployed
- Proper indexing for performance