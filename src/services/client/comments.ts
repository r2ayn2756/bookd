import { createClient } from '@/lib/supabase/client';
import type { Database, PostComment, CommentWithAuthor, CommentThread } from '@/types/database';

type SupabaseClient = ReturnType<typeof createClient>;

export class CommentsService {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  /**
   * Get comments for a post in a threaded structure using the database function
   */
  async getPostComments(postId: string, limit: number = 50, offset: number = 0): Promise<CommentThread[]> {
    try {
      const { data, error } = await this.supabase.rpc('get_post_comments_tree', {
        p_post_id: postId,
        p_limit: limit,
        p_offset: offset
      });

      if (error) {
        console.error('Error fetching post comments:', error);
        throw error;
      }

      // Fetch user information for each comment
      const enrichedComments = await Promise.all(
        (data || []).map(async (comment: any) => {
          const { data: userData, error: userError } = await this.supabase
            .from('users')
            .select('id, full_name, avatar_url')
            .eq('id', comment.user_id)
            .single();

          return {
            ...comment,
            users: userError ? null : userData
          } as CommentThread;
        })
      );

      return enrichedComments;
    } catch (error) {
      console.error('Error in getPostComments:', error);
      throw error;
    }
  }

  /**
   * Add a new comment to a post
   */
  async addComment(
    postId: string,
    content: string,
    parentCommentId?: string
  ): Promise<PostComment | null> {
    try {
      const { data, error } = await this.supabase
        .from('post_comments')
        .insert([{
          post_id: postId,
          content: content.trim(),
          parent_comment_id: parentCommentId || null
        }])
        .select()
        .single();

      if (error) {
        console.error('Error adding comment:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in addComment:', error);
      throw error;
    }
  }
}

// Factory function for client-side usage
export function createCommentsService() {
  const supabase = createClient();
  return new CommentsService(supabase);
}