'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { FeedPost, User } from '@/types/database';
import { PostCard } from './PostCard';
import { CreatePostModal } from './CreatePostModal';

interface FeedFallbackProps {
  currentUserId?: string;
}

export function FeedFallback({ currentUserId }: FeedFallbackProps) {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showCreatePost, setShowCreatePost] = useState(false);

  useEffect(() => {
    loadFeed();
    loadCurrentUser();
  }, [currentUserId]);

  const loadCurrentUser = async () => {
    if (!currentUserId) return;
    
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', currentUserId)
        .single();
      
      if (data) {
        setCurrentUser(data);
      }
    } catch (error) {
      console.error('Error loading current user:', error);
    }
  };

  const loadFeed = async () => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      
      // First, try the database function
      try {
        const { data: feedData, error: feedError } = await supabase.rpc('get_user_feed', {
          p_user_id: currentUserId || null,
          p_limit: 20,
          p_offset: 0
        });

        if (!feedError && feedData) {
          // Enrich with author data
          const enrichedPosts = await Promise.all(
            feedData.map(async (post: any) => {
              let author = null;
              
              if (post.user_id) {
                const { data: userData } = await supabase
                  .from('users')
                  .select('id, full_name, avatar_url')
                  .eq('id', post.user_id)
                  .single();
                
                if (userData) author = userData;
              }
              
              if (post.organization_id) {
                const { data: orgData } = await supabase
                  .from('organization_profiles')
                  .select('id, name, logo_url')
                  .eq('id', post.organization_id)
                  .single();
                
                if (orgData) author = orgData;
              }

              return { ...post, author } as FeedPost;
            })
          );

          setPosts(enrichedPosts);
          setLoading(false);
          return;
        }
      } catch (functionError) {
        console.log('Database function not available, using fallback query');
      }

      // Fallback: Simple posts query if function doesn't exist
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          id,
          user_id,
          organization_id,
          content,
          title,
          post_type,
          visibility,
          likes_count,
          comments_count,
          created_at,
          media_urls,
          tags
        `)
        .eq('is_published', true)
        .in('visibility', ['public'])
        .order('created_at', { ascending: false })
        .limit(20);

      if (postsError) {
        setError(`Failed to load posts: ${postsError.message}`);
      } else {
        // Enrich with author data and convert to FeedPost
        const enrichedPosts = await Promise.all(
          (postsData || []).map(async (post: any) => {
            let author = null;
            
            if (post.user_id) {
              const { data: userData } = await supabase
                .from('users')
                .select('id, full_name, avatar_url')
                .eq('id', post.user_id)
                .single();
              
              if (userData) author = userData;
            }
            
            if (post.organization_id) {
              const { data: orgData } = await supabase
                .from('organization_profiles')
                .select('id, name, logo_url')
                .eq('id', post.organization_id)
                .single();
              
              if (orgData) author = orgData;
            }

            // Check if current user liked this post
            let isLiked = false;
            if (currentUserId) {
              const { data: likeData } = await supabase
                .from('post_likes')
                .select('id')
                .eq('post_id', post.id)
                .eq('user_id', currentUserId)
                .single();
              
              isLiked = !!likeData;
            }

            return {
              ...post,
              author,
              is_liked: isLiked
            } as FeedPost;
          })
        );

        setPosts(enrichedPosts);
      }
    } catch (error) {
      console.error('Error loading feed:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    }

    setLoading(false);
  };

  const handleNewPost = (newPost: FeedPost) => {
    setPosts(prev => [newPost, ...prev]);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-300 rounded w-1/4 mb-2"></div>
                <div className="h-3 bg-gray-300 rounded w-1/6"></div>
              </div>
            </div>
            <div className="space-y-2 mb-4">
              <div className="h-4 bg-gray-300 rounded w-full"></div>
              <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <div className="text-red-600 mb-4">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to load feed</h3>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
        </div>
        <button 
          onClick={loadFeed}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create Post Button */}
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
            onPostUpdate={(updates) => {
              setPosts(prev => 
                prev.map(p => p.id === post.id ? { ...p, ...updates } : p)
              );
            }}
          />
        ))
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
  );
}