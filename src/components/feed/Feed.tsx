'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPostsService } from '@/services/client/posts';
import { createUsersService } from '@/services/client/users';
import type { FeedPost, User } from '@/types/database';
import { withErrorHandling } from '@/services/utils';
import { PostCard } from './PostCard';
import { CreatePostModal } from './CreatePostModal';
import { FeedSkeleton } from './LoadingSkeleton';
import { ErrorBoundary, FeedErrorFallback } from './ErrorBoundary';

interface FeedProps {
  initialPosts?: FeedPost[];
  currentUserId?: string;
}

export function Feed({ initialPosts = [], currentUserId }: FeedProps) {
  const [posts, setPosts] = useState<FeedPost[]>(initialPosts);
  const [loading, setLoading] = useState(!initialPosts.length);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showCreatePost, setShowCreatePost] = useState(false);

  // Load current user
  useEffect(() => {
    const loadCurrentUser = async () => {
      if (!currentUserId) return;
      
      const { data } = await withErrorHandling(
        async () => {
          const service = createUsersService();
          return service.getCurrentUser();
        },
        'Failed to load user data'
      );
      
      if (data) {
        setCurrentUser(data);
      }
    };

    loadCurrentUser();
  }, [currentUserId]);

  // Listen for create post events from Quick Actions
  useEffect(() => {
    const handleOpenCreatePost = () => {
      if (currentUser) {
        setShowCreatePost(true);
      }
    };

    window.addEventListener('openCreatePost', handleOpenCreatePost);
    return () => window.removeEventListener('openCreatePost', handleOpenCreatePost);
  }, [currentUser]);

  // Load initial posts if not provided
  useEffect(() => {
    if (initialPosts.length > 0) {
      setLoading(false);
      return;
    }

    loadFeed();
  }, [initialPosts.length]);

  const loadFeed = async (offset = 0, append = false) => {
    if (!append) setLoading(true);
    setError(null);

    const { data, error: feedError } = await withErrorHandling(
      async () => {
        const service = createPostsService();
        return service.getUserFeed(currentUserId, 20, offset);
      },
      'Failed to load feed'
    );

    if (feedError) {
      setError(feedError);
    } else if (data) {
      if (append) {
        setPosts(prev => [...prev, ...data]);
      } else {
        setPosts(data);
      }
      
      // Check if there are more posts to load
      setHasMore(data.length === 20);
    }

    setLoading(false);
    setLoadingMore(false);
  };

  const loadMorePosts = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    await loadFeed(posts.length, true);
  }, [posts.length, loadingMore, hasMore]);

  const handlePostUpdate = (postId: string, updates: Partial<FeedPost>) => {
    setPosts(prev => 
      prev.map(post => 
        post.id === postId ? { ...post, ...updates } : post
      )
    );
  };

  const handleNewPost = (newPost: FeedPost) => {
    setPosts(prev => [newPost, ...prev]);
  };

  const refreshFeed = () => {
    setPosts([]);
    loadFeed();
  };

  if (loading && posts.length === 0) {
    return <FeedSkeleton />;
  }

  if (error && posts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <div className="text-red-600 mb-4">
          <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm">{error}</p>
        </div>
        <button 
          onClick={refreshFeed}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <ErrorBoundary fallback={FeedErrorFallback}>
      <div className="space-y-6">
        {/* Create Post Button - only show if user is logged in */}
      {currentUser && (
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-semibold text-sm">
              {currentUser.full_name?.charAt(0) || 'U'}
            </div>
            <button
              onClick={() => setShowCreatePost(true)}
              className="flex-1 text-left px-4 py-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 transition-colors"
            >
              What's on your mind, {currentUser.full_name?.split(' ')[0]}?
            </button>
          </div>
        </div>
      )}

      {/* Posts */}
      {posts.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3 className="text-lg font-medium text-gray-600 mb-2">No posts yet</h3>
            <p className="text-gray-500">
              {currentUser 
                ? "Be the first to share something with the community!" 
                : "Sign in to see posts from the community."
              }
            </p>
          </div>
          {currentUser && (
            <button
              onClick={() => setShowCreatePost(true)}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Create Your First Post
            </button>
          )}
        </div>
      ) : (
        posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            currentUserId={currentUserId}
            onPostUpdate={(updates) => handlePostUpdate(post.id, updates)}
          />
        ))
      )}

      {/* Load More Button */}
      {hasMore && posts.length > 0 && (
        <div className="text-center">
          <button
            onClick={loadMorePosts}
            disabled={loadingMore}
            className="px-6 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {loadingMore ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                <span>Loading more posts...</span>
              </div>
            ) : (
              'Load More Posts'
            )}
          </button>
        </div>
      )}

      {/* Create Post Modal */}
      {showCreatePost && (
        <CreatePostModal
          currentUser={currentUser}
          onClose={() => setShowCreatePost(false)}
          onPostCreated={handleNewPost}
        />
      )}
      </div>
    </ErrorBoundary>
  );
}