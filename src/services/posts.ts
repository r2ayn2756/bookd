import { createClient } from '@/lib/supabase/client';
import { createClient as createServerClient } from '@/lib/supabase/server';
import type { Database, Post, PostWithAuthor, FeedPost } from '@/types/database';

type SupabaseClient = ReturnType<typeof createClient>;

export class PostsService {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  /**
   * Get the user's personalized feed using the database function
   */
  async getUserFeed(userId?: string, limit: number = 20, offset: number = 0): Promise<FeedPost[]> {
    try {
      const { data, error } = await this.supabase.rpc('get_user_feed', {
        p_user_id: userId || null,
        p_limit: limit,
        p_offset: offset
      });

      if (error) {
        console.error('Error fetching user feed:', error);
        throw error;
      }

      // Fetch author information for each post
      const enrichedPosts = await Promise.all(
        (data || []).map(async (post: any) => {
          let author = null;
          
          // Fetch user author if post has user_id
          if (post.user_id) {
            const { data: userData, error: userError } = await this.supabase
              .from('users')
              .select('id, full_name, avatar_url')
              .eq('id', post.user_id)
              .single();
            
            if (!userError && userData) {
              author = userData;
            }
          }
          
          // Fetch organization author if post has organization_id
          if (post.organization_id) {
            const { data: orgData, error: orgError } = await this.supabase
              .from('organization_profiles')
              .select('id, name, logo_url')
              .eq('id', post.organization_id)
              .single();
            
            if (!orgError && orgData) {
              author = orgData;
            }
          }

          return {
            ...post,
            author
          } as FeedPost;
        })
      );

      return enrichedPosts;
    } catch (error) {
      console.error('Error in getUserFeed:', error);
      throw error;
    }
  }

  /**
   * Get a single post by ID with author information
   */
  async getPostById(postId: string, userId?: string): Promise<PostWithAuthor | null> {
    try {
      // First get the post
      const { data: post, error: postError } = await this.supabase
        .from('posts')
        .select(`
          *,
          users:user_id(id, full_name, avatar_url),
          organization_profiles:organization_id(id, name, logo_url)
        `)
        .eq('id', postId)
        .single();

      if (postError) {
        console.error('Error fetching post:', postError);
        return null;
      }

      if (!post) return null;

      // Check if user has liked this post
      let isLiked = false;
      if (userId) {
        const { data: likeData } = await this.supabase
          .from('post_likes')
          .select('id')
          .eq('post_id', postId)
          .eq('user_id', userId)
          .eq('reaction_type', 'like')
          .single();
        
        isLiked = !!likeData;
      }

      return {
        ...post,
        is_liked: isLiked
      } as PostWithAuthor;
    } catch (error) {
      console.error('Error in getPostById:', error);
      return null;
    }
  }

  /**
   * Toggle like on a post (like/unlike)
   */
  async togglePostLike(postId: string, reactionType: string = 'like'): Promise<boolean> {
    try {
      const { data, error } = await this.supabase.rpc('toggle_post_like', {
        p_post_id: postId,
        p_reaction_type: reactionType
      });

      if (error) {
        console.error('Error toggling post like:', error);
        throw error;
      }

      return data; // Returns true if liked, false if unliked
    } catch (error) {
      console.error('Error in togglePostLike:', error);
      throw error;
    }
  }

  /**
   * Create a new post
   */
  async createPost(postData: {
    content?: string;
    title?: string;
    post_type?: string;
    visibility?: string;
    media_urls?: string[];
    media_types?: string[];
    tags?: string[];
    location?: string;
    event_date?: string;
    venue_name?: string;
    collaboration_type?: string;
    instruments_needed?: string[];
    genres?: string[];
    compensation_offered?: string;
  }): Promise<Post | null> {
    try {
      const { data, error } = await this.supabase
        .from('posts')
        .insert([{
          ...postData,
          post_type: postData.post_type || 'general',
          visibility: postData.visibility || 'public',
          is_published: true
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating post:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in createPost:', error);
      throw error;
    }
  }

  /**
   * Update a post
   */
  async updatePost(postId: string, updates: Partial<Post>): Promise<Post | null> {
    try {
      const { data, error } = await this.supabase
        .from('posts')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', postId)
        .select()
        .single();

      if (error) {
        console.error('Error updating post:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in updatePost:', error);
      throw error;
    }
  }

  /**
   * Delete a post
   */
  async deletePost(postId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) {
        console.error('Error deleting post:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error in deletePost:', error);
      throw error;
    }
  }

  /**
   * Get posts by user ID
   */
  async getPostsByUser(userId: string, limit: number = 20, offset: number = 0): Promise<PostWithAuthor[]> {
    try {
      const { data, error } = await this.supabase
        .from('posts')
        .select(`
          *,
          users:user_id(id, full_name, avatar_url),
          organization_profiles:organization_id(id, name, logo_url)
        `)
        .eq('user_id', userId)
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching user posts:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getPostsByUser:', error);
      throw error;
    }
  }

  /**
   * Get posts by organization ID
   */
  async getPostsByOrganization(orgId: string, limit: number = 20, offset: number = 0): Promise<PostWithAuthor[]> {
    try {
      const { data, error } = await this.supabase
        .from('posts')
        .select(`
          *,
          users:user_id(id, full_name, avatar_url),
          organization_profiles:organization_id(id, name, logo_url)
        `)
        .eq('organization_id', orgId)
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching organization posts:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getPostsByOrganization:', error);
      throw error;
    }
  }
}

// Factory functions for different contexts
export function createPostsService() {
  const supabase = createClient();
  return new PostsService(supabase);
}

export async function createServerPostsService() {
  const supabase = await createServerClient();
  return new PostsService(supabase);
}

// Convenience functions for common operations (client-side only)
export async function getUserFeed(userId?: string, limit?: number, offset?: number) {
  const service = createPostsService();
  return service.getUserFeed(userId, limit, offset);
}

export async function togglePostLike(postId: string, reactionType?: string) {
  const service = createPostsService();
  return service.togglePostLike(postId, reactionType);
}

export async function getPostById(postId: string, userId?: string) {
  const service = createPostsService();
  return service.getPostById(postId, userId);
}