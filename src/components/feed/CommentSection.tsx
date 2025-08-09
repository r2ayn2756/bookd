'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { createCommentsService } from '@/services/client/comments';
import { createUsersService } from '@/services/client/users';
import type { CommentThread, User } from '@/types/database';
import { 
  formatTimeAgo, 
  getDisplayName, 
  getInitials, 
  getAvatarUrl,
  validateCommentContent,
  withErrorHandling 
} from '@/services/utils';

interface CommentSectionProps {
  postId: string;
  currentUserId?: string;
  onCommentCountUpdate?: (newCount: number) => void;
}

interface CommentItemProps {
  comment: CommentThread;
  currentUser?: User | null;
  onReply?: (parentId: string, content: string) => void;
  level?: number;
}

function CommentItem({ comment, currentUser, onReply, level = 0 }: CommentItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  const authorName = getDisplayName(comment.users || null);
  const authorAvatar = getAvatarUrl(comment.users || null);
  const authorInitials = getInitials(comment.users || null);
  const timeAgo = formatTimeAgo(comment.created_at);

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = validateCommentContent(replyContent);
    if (!validation.isValid) {
      alert(validation.error);
      return;
    }

    if (!currentUser || !onReply) return;

    setIsSubmittingReply(true);
    await onReply(comment.id, replyContent);
    setReplyContent('');
    setShowReplyForm(false);
    setIsSubmittingReply(false);
  };

  return (
    <div className={`${level > 0 ? 'ml-8 border-l border-gray-200 pl-4' : ''}`}>
      <div className="flex items-start space-x-3 py-3">
        {/* Commenter Avatar */}
        <div className="flex-shrink-0">
          {authorAvatar ? (
            <Image
              src={authorAvatar}
              alt={authorName}
              width={32}
              height={32}
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-xs"
              style={{ backgroundColor: '#7823E1' }}
            >
              {authorInitials}
            </div>
          )}
        </div>

        {/* Comment Content */}
        <div className="flex-1 min-w-0">
          <div className="bg-gray-50 rounded-lg px-3 py-2">
            <div className="flex items-center space-x-2 mb-1">
              <span className="font-semibold text-sm text-gray-900">{authorName}</span>
              <span className="text-xs text-gray-500">{timeAgo}</span>
              {comment.is_edited && (
                <span className="text-xs text-gray-400">(edited)</span>
              )}
            </div>
            <p className="text-sm text-gray-700">{comment.content}</p>
          </div>

          {/* Comment Actions */}
          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
            {comment.likes_count > 0 && (
              <span>{comment.likes_count} {comment.likes_count === 1 ? 'like' : 'likes'}</span>
            )}
            
            {currentUser && level < 2 && (
              <button
                onClick={() => setShowReplyForm(!showReplyForm)}
                className="hover:text-gray-700 transition-colors"
              >
                Reply
              </button>
            )}

            {comment.replies_count > 0 && (
              <span>{comment.replies_count} {comment.replies_count === 1 ? 'reply' : 'replies'}</span>
            )}
          </div>

          {/* Reply Form */}
          {showReplyForm && currentUser && (
            <form onSubmit={handleReplySubmit} className="mt-3">
              <div className="flex items-start space-x-2">
                <div className="flex-shrink-0">
                  {currentUser.avatar_url ? (
                    <Image
                      src={currentUser.avatar_url}
                      alt={currentUser.full_name || 'You'}
                      width={24}
                      height={24}
                      className="w-6 h-6 rounded-full"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs text-gray-600">
                      {getInitials(currentUser)}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Write a reply..."
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    rows={2}
                    disabled={isSubmittingReply}
                  />
                  <div className="flex items-center justify-end space-x-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setShowReplyForm(false)}
                      className="px-3 py-1 text-xs text-gray-500 hover:text-gray-700"
                      disabled={isSubmittingReply}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-400"
                      disabled={isSubmittingReply || !replyContent.trim()}
                    >
                      {isSubmittingReply ? 'Posting...' : 'Reply'}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export function CommentSection({ postId, currentUserId, onCommentCountUpdate }: CommentSectionProps) {
  const [comments, setComments] = useState<CommentThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

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

  // Load comments
  useEffect(() => {
    const loadComments = async () => {
      setLoading(true);
      setError(null);

      const { data, error: commentError } = await withErrorHandling(
        async () => {
          const service = createCommentsService();
          return service.getPostComments(postId, 50, 0);
        },
        'Failed to load comments'
      );

      if (commentError) {
        setError(commentError);
      } else {
        setComments(data || []);
      }

      setLoading(false);
    };

    loadComments();
  }, [postId]);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = validateCommentContent(newComment);
    if (!validation.isValid) {
      alert(validation.error);
      return;
    }

    if (!currentUser) {
      alert('You must be logged in to comment');
      return;
    }

    setIsSubmitting(true);

    const { data, error: submitError } = await withErrorHandling(
      async () => {
        const service = createCommentsService();
        return service.addComment(postId, newComment);
      },
      'Failed to post comment'
    );

    if (submitError) {
      alert(submitError);
    } else if (data) {
      // Add the new comment to the list
      const newCommentThread: CommentThread = {
        ...data,
        users: currentUser,
        level: 0
      };
      
      setComments(prev => [newCommentThread, ...prev]);
      setNewComment('');
      
      // Update comment count
      onCommentCountUpdate?.(comments.length + 1);
    }

    setIsSubmitting(false);
  };

  const handleReply = async (parentId: string, content: string) => {
    if (!currentUser) return;

    const { data, error: replyError } = await withErrorHandling(
      async () => {
        const service = createCommentsService();
        return service.addComment(postId, content, parentId);
      },
      'Failed to post reply'
    );

    if (replyError) {
      alert(replyError);
    } else if (data) {
      // For simplicity, reload comments to show the new reply
      // In a production app, you'd want to optimize this
      const { data: updatedComments } = await withErrorHandling(
        async () => {
          const service = createCommentsService();
          return service.getPostComments(postId, 50, 0);
        },
        'Failed to reload comments'
      );

      if (updatedComments) {
        setComments(updatedComments);
        onCommentCountUpdate?.(updatedComments.length);
      }
    }
  };

  return (
    <div className="border-t border-gray-100 px-4 py-3">
      {/* Comment Form */}
      {currentUser ? (
        <form onSubmit={handleCommentSubmit} className="mb-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              {currentUser.avatar_url ? (
                <Image
                  src={currentUser.avatar_url}
                  alt={currentUser.full_name || 'You'}
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-xs font-semibold">
                  {getInitials(currentUser)}
                </div>
              )}
            </div>
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                rows={3}
                disabled={isSubmitting}
              />
              <div className="flex items-center justify-end mt-2">
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400"
                  disabled={isSubmitting || !newComment.trim()}
                >
                  {isSubmitting ? 'Posting...' : 'Comment'}
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg text-center">
          <p className="text-sm text-gray-600">
            <a href="/auth/signin" className="text-purple-600 hover:text-purple-700 font-medium">
              Sign in
            </a> to join the conversation
          </p>
        </div>
      )}

      {/* Comments List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-4">
          <p className="text-red-600 text-sm">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="text-purple-600 hover:text-purple-700 text-sm mt-2"
          >
            Try again
          </button>
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-gray-500 text-sm">No comments yet. Be the first to comment!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUser={currentUser}
              onReply={handleReply}
              level={comment.level}
            />
          ))}
        </div>
      )}
    </div>
  );
}