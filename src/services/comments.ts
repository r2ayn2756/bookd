import { createClient } from '@/lib/supabase/client';
import { createClient as createServerClient } from '@/lib/supabase/server';
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
   * Get a single comment by ID
   */
  async getCommentById(commentId: string): Promise<CommentWithAuthor | null> {
    try {
      const { data, error } = await this.supabase
        .from('post_comments')
        .select(`
          *,
          users:user_id(id, full_name, avatar_url)
        `)
        .eq('id', commentId)
        .eq('is_deleted', false)
        .single();

      if (error) {
        console.error('Error fetching comment:', error);
        return null;
      }

      return data as CommentWithAuthor;
    } catch (error) {
      console.error('Error in getCommentById:', error);
      return null;
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

  /**
   * Update a comment
   */
  async updateComment(commentId: string, content: string): Promise<PostComment | null> {
    try {
      const { data, error } = await this.supabase
        .from('post_comments')
        .update({
          content: content.trim(),
          is_edited: true,
          // edit_count will be incremented by a database trigger
          updated_at: new Date().toISOString()
        })
        .eq('id', commentId)
        .eq('is_deleted', false)
        .select()
        .single();

      if (error) {
        console.error('Error updating comment:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in updateComment:', error);
      throw error;
    }
  }

  /**
   * Soft delete a comment (preserves thread structure)
   */
  async deleteComment(commentId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase.rpc('soft_delete_comment', {
        comment_id: commentId
      });

      if (error) {
        console.error('Error deleting comment:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in deleteComment:', error);
      throw error;
    }
  }

  /**
   * Get comments by user ID
   */
  async getCommentsByUser(userId: string, limit: number = 20, offset: number = 0): Promise<CommentWithAuthor[]> {
    try {
      const { data, error } = await this.supabase
        .from('post_comments')
        .select(`
          *,
          users:user_id(id, full_name, avatar_url),
          posts:post_id(id, title, content)
        `)
        .eq('user_id', userId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching user comments:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getCommentsByUser:', error);
      throw error;
    }
  }

  /**
   * Get reply count for a comment
   */
  async getReplyCount(commentId: string): Promise<number> {
    try {
      const { count, error } = await this.supabase
        .from('post_comments')
        .select('id', { count: 'exact' })
        .eq('parent_comment_id', commentId)
        .eq('is_deleted', false);

      if (error) {
        console.error('Error getting reply count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error in getReplyCount:', error);
      return 0;
    }
  }

  /**
   * Get replies for a comment
   */
  async getReplies(commentId: string, limit: number = 10, offset: number = 0): Promise<CommentWithAuthor[]> {
    try {
      const { data, error } = await this.supabase
        .from('post_comments')
        .select(`
          *,
          users:user_id(id, full_name, avatar_url)
        `)
        .eq('parent_comment_id', commentId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching replies:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getReplies:', error);
      throw error;
    }
  }

  /**
   * Like/unlike a comment (future feature)
   */
  async toggleCommentLike(commentId: string): Promise<boolean> {
    try {
      // Note: This would require a comment_likes table similar to post_likes
      // For now, we'll just increment/decrement the likes_count
      // In a full implementation, you'd want to track individual likes
      
      console.log('Comment like toggling not yet implemented');
      return false;
    } catch (error) {
      console.error('Error in toggleCommentLike:', error);
      throw error;
    }
  }

  /**
   * Flag a comment for moderation
   */
  async flagComment(commentId: string, reason: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('post_comments')
        .update({
          is_flagged: true,
          flagged_reason: reason
        })
        .eq('id', commentId);

      if (error) {
        console.error('Error flagging comment:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error in flagComment:', error);
      throw error;
    }
  }

  /**
   * Search comments by content
   */
  async searchComments(query: string, limit: number = 20, offset: number = 0): Promise<CommentWithAuthor[]> {
    try {
      const { data, error } = await this.supabase
        .from('post_comments')
        .select(`
          *,
          users:user_id(id, full_name, avatar_url),
          posts:post_id(id, title, content)
        `)
        .textSearch('content', query)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error searching comments:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in searchComments:', error);
      throw error;
    }
  }
}

// Factory functions for different contexts
export function createCommentsService() {
  const supabase = createClient();
  return new CommentsService(supabase);
}

export async function createServerCommentsService() {
  const supabase = await createServerClient();
  return new CommentsService(supabase);
}

// Convenience functions for common operations
export async function getPostComments(postId: string, limit?: number, offset?: number) {
  const service = createCommentsService();
  return service.getPostComments(postId, limit, offset);
}

export async function addComment(postId: string, content: string, parentCommentId?: string) {
  const service = createCommentsService();
  return service.addComment(postId, content, parentCommentId);
}

export async function updateComment(commentId: string, content: string) {
  const service = createCommentsService();
  return service.updateComment(commentId, content);
}

export async function deleteComment(commentId: string) {
  const service = createCommentsService();
  return service.deleteComment(commentId);
}