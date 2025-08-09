'use client';

import { useState } from 'react';
import { createPostsService } from '@/services/client/posts';

import { withErrorHandling } from '@/services/utils';

interface LikeButtonProps {
  postId: string;
  isLiked: boolean;
  likesCount: number;
  onLikeUpdate: (isLiked: boolean, newCount: number) => void;
  disabled?: boolean;
}

export function LikeButton({ 
  postId, 
  isLiked, 
  likesCount, 
  onLikeUpdate, 
  disabled = false 
}: LikeButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [optimisticLiked, setOptimisticLiked] = useState(isLiked);
  const [optimisticCount, setOptimisticCount] = useState(likesCount);

  const handleLike = async () => {
    if (disabled || isLoading) return;

    // Optimistic update
    const newLiked = !optimisticLiked;
    const newCount = newLiked ? optimisticCount + 1 : optimisticCount - 1;
    
    setOptimisticLiked(newLiked);
    setOptimisticCount(newCount);
    setIsLoading(true);

    const { data, error } = await withErrorHandling(
      async () => {
        const service = createPostsService();
        return service.togglePostLike(postId, 'like');
      },
      'Failed to update like'
    );

    setIsLoading(false);

    if (error) {
      // Revert optimistic update on error
      setOptimisticLiked(isLiked);
      setOptimisticCount(likesCount);
      console.error('Failed to toggle like:', error);
      return;
    }

    // Update parent component with the actual result
    const actualLiked = data === true;
    const actualCount = actualLiked ? likesCount + 1 : likesCount - 1;
    
    setOptimisticLiked(actualLiked);
    setOptimisticCount(actualCount);
    onLikeUpdate(actualLiked, actualCount);
  };

  return (
    <button
      onClick={handleLike}
      disabled={disabled || isLoading}
      className={`flex items-center space-x-1 transition-colors ${
        disabled 
          ? 'text-gray-400 cursor-not-allowed' 
          : optimisticLiked
          ? 'text-red-500 hover:text-red-600'
          : 'text-gray-500 hover:text-red-500'
      }`}
    >
      <svg 
        className={`w-4 h-4 transition-all ${isLoading ? 'animate-pulse' : ''}`} 
        fill={optimisticLiked ? 'currentColor' : 'none'} 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
        />
      </svg>
      <span className="text-sm">
        {optimisticLiked ? 'Liked' : 'Like'}
      </span>
      {optimisticCount > 0 && (
        <span className="text-xs text-gray-400">
          ({optimisticCount})
        </span>
      )}
    </button>
  );
}