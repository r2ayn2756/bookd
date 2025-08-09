import { createClient } from '@/lib/supabase/client';
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
}

// Factory function for client-side usage
export function createPostsService() {
  const supabase = createClient();
  return new PostsService(supabase);
}