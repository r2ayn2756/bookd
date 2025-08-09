'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { FeedPost } from '@/types/database';
import { 
  formatTimeAgo, 
  getDisplayName, 
  getInitials, 
  getAvatarUrl,
  formatLikeCount,
  formatCommentCount 
} from '@/services/utils';
import { LikeButton } from './LikeButton';
import { CommentSection } from './CommentSection';

interface PostCardProps {
  post: FeedPost;
  currentUserId?: string;
  onPostUpdate?: (updatedPost: Partial<FeedPost>) => void;
}

export function PostCard({ post, currentUserId, onPostUpdate }: PostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [isLiked, setIsLiked] = useState(post.is_liked || false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [commentsCount, setCommentsCount] = useState(post.comments_count || 0);

  const authorName = getDisplayName(post.author || null);
  const authorAvatar = getAvatarUrl(post.author || null);
  const authorInitials = getInitials(post.author || null);
  const timeAgo = formatTimeAgo(post.created_at);

  const handleLikeUpdate = (liked: boolean, newCount: number) => {
    setIsLiked(liked);
    setLikesCount(newCount);
    
    // Notify parent component if needed
    onPostUpdate?.({
      ...post,
      is_liked: liked,
      likes_count: newCount
    });
  };

  const handleCommentUpdate = (newCount: number) => {
    setCommentsCount(newCount);
    
    onPostUpdate?.({
      ...post,
      comments_count: newCount
    });
  };

  const getPostTypeColor = (type: string) => {
    const colors = {
      general: 'text-gray-600',
      performance: 'text-purple-600',
      announcement: 'text-blue-600',
      collaboration: 'text-green-600',
      opportunity: 'text-yellow-600',
      review: 'text-orange-600',
      event: 'text-red-600'
    };
    return colors[type as keyof typeof colors] || 'text-gray-600';
  };

  const getPostTypeLabel = (type: string) => {
    const labels = {
      general: '',
      performance: '🎵 Performance',
      announcement: '📢 Announcement',
      collaboration: '🤝 Collaboration',
      opportunity: '💼 Opportunity',
      review: '⭐ Review',
      event: '📅 Event'
    };
    return labels[type as keyof typeof labels] || '';
  };

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200">
      {/* Post Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start space-x-3">
          {/* Author Avatar */}
          <div className="flex-shrink-0">
            {authorAvatar ? (
              <Image
                src={authorAvatar}
                alt={authorName}
                width={40}
                height={40}
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                style={{ backgroundColor: '#7823E1' }}
              >
                {authorInitials}
              </div>
            )}
          </div>

          {/* Author Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <Link 
                href={post.user_id ? `/profile/${post.user_id}` : `/organization/${post.organization_id}`}
                className="font-semibold text-gray-900 hover:text-gray-700 transition-colors"
              >
                {authorName}
              </Link>
              <span className="text-xs text-gray-500">{timeAgo}</span>
            </div>

            {/* Post Type Badge */}
            {post.post_type !== 'general' && (
              <div className="mt-1">
                <span className={`text-xs font-medium ${getPostTypeColor(post.post_type)}`}>
                  {getPostTypeLabel(post.post_type)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Post Content */}
      <div className="p-4">
        {/* Title */}
        {post.title && (
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {post.title}
          </h3>
        )}

        {/* Content */}
        {post.content && (
          <p className="text-gray-700 text-sm leading-relaxed mb-3">
            {post.content}
          </p>
        )}

        {/* Media */}
        {post.media_urls && post.media_urls.length > 0 && (
          <div className="mt-3">
            {post.media_urls.length === 1 ? (
              <div className="rounded-lg overflow-hidden">
                <Image
                  src={post.media_urls[0]}
                  alt="Post media"
                  width={600}
                  height={400}
                  className="w-full h-auto object-cover"
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 rounded-lg overflow-hidden">
                {post.media_urls.slice(0, 4).map((url, index) => (
                  <div key={index} className="relative">
                    <Image
                      src={url}
                      alt={`Post media ${index + 1}`}
                      width={300}
                      height={200}
                      className="w-full h-32 object-cover"
                    />
                    {index === 3 && post.media_urls!.length > 4 && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <span className="text-white font-semibold">
                          +{post.media_urls!.length - 4}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {post.tags.map((tag, index) => (
              <span
                key={index}
                className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Post Actions */}
      <div className="px-4 py-3 border-t border-gray-100">
        {/* Engagement Stats */}
        {(likesCount > 0 || commentsCount > 0) && (
          <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
            <div className="flex items-center space-x-4">
              {likesCount > 0 && (
                <span>{formatLikeCount(likesCount)}</span>
              )}
              {commentsCount > 0 && (
                <span>{formatCommentCount(commentsCount)}</span>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center space-x-6">
          <LikeButton
            postId={post.id}
            isLiked={isLiked}
            likesCount={likesCount}
            onLikeUpdate={handleLikeUpdate}
            disabled={!currentUserId}
          />

          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center space-x-1 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="text-sm">Comment</span>
          </button>

          <button className="flex items-center space-x-1 text-gray-500 hover:text-gray-700 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
            <span className="text-sm">Share</span>
          </button>
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <CommentSection
          postId={post.id}
          currentUserId={currentUserId}
          onCommentCountUpdate={handleCommentUpdate}
        />
      )}
    </div>
  );
}