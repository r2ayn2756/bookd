/**
 * Utility functions for services
 * Common helper functions used across different services
 */

import type { User, OrganizationProfile } from '@/types/database';

/**
 * Format timestamp for display
 */
export function formatTimeAgo(timestamp: string): string {
  const now = new Date();
  const postTime = new Date(timestamp);
  const diffInSeconds = Math.floor((now.getTime() - postTime.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks}w ago`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths}mo ago`;
  }

  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears}y ago`;
}

/**
 * Get display name for a user or organization
 */
export function getDisplayName(author: User | OrganizationProfile | null): string {
  if (!author) return 'Unknown';
  
  if ('full_name' in author) {
    // It's a User
    return author.full_name || 'Unnamed User';
  } else {
    // It's an OrganizationProfile
    return author.name || 'Unnamed Organization';
  }
}

/**
 * Get avatar URL for a user or organization
 */
export function getAvatarUrl(author: User | OrganizationProfile | null): string | null {
  if (!author) return null;
  
  if ('avatar_url' in author) {
    // It's a User
    return author.avatar_url;
  } else {
    // It's an OrganizationProfile
    return author.logo_url;
  }
}

/**
 * Get initials for a user or organization (for fallback avatars)
 */
export function getInitials(author: User | OrganizationProfile | null): string {
  const name = getDisplayName(author);
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

/**
 * Validate post content
 */
export function validatePostContent(content: string): { isValid: boolean; error?: string } {
  if (!content || content.trim().length === 0) {
    return { isValid: false, error: 'Post content cannot be empty' };
  }

  if (content.length > 2000) {
    return { isValid: false, error: 'Post content cannot exceed 2000 characters' };
  }

  return { isValid: true };
}

/**
 * Validate comment content
 */
export function validateCommentContent(content: string): { isValid: boolean; error?: string } {
  if (!content || content.trim().length === 0) {
    return { isValid: false, error: 'Comment cannot be empty' };
  }

  if (content.length > 500) {
    return { isValid: false, error: 'Comment cannot exceed 500 characters' };
  }

  return { isValid: true };
}

/**
 * Sanitize content (basic sanitization)
 */
export function sanitizeContent(content: string): string {
  return content
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
    .replace(/[\r\n\t]/g, ' '); // Replace newlines and tabs with spaces
}

/**
 * Extract hashtags from content
 */
export function extractHashtags(content: string): string[] {
  const hashtagRegex = /#[a-zA-Z0-9_]+/g;
  const hashtags = content.match(hashtagRegex);
  return hashtags ? hashtags.map(tag => tag.substring(1).toLowerCase()) : [];
}

/**
 * Format like count for display
 */
export function formatLikeCount(count: number): string {
  if (count === 0) return '';
  if (count === 1) return '1 like';
  if (count < 1000) return `${count} likes`;
  if (count < 1000000) return `${(count / 1000).toFixed(1)}k likes`;
  return `${(count / 1000000).toFixed(1)}m likes`;
}

/**
 * Format comment count for display
 */
export function formatCommentCount(count: number): string {
  if (count === 0) return '';
  if (count === 1) return '1 comment';
  if (count < 1000) return `${count} comments`;
  if (count < 1000000) return `${(count / 1000).toFixed(1)}k comments`;
  return `${(count / 1000000).toFixed(1)}m comments`;
}

/**
 * Check if a URL is a valid image URL
 */
export function isImageUrl(url: string): boolean {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
  const lowercaseUrl = url.toLowerCase();
  return imageExtensions.some(ext => lowercaseUrl.includes(ext));
}

/**
 * Check if a URL is a valid video URL
 */
export function isVideoUrl(url: string): boolean {
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi'];
  const lowercaseUrl = url.toLowerCase();
  return videoExtensions.some(ext => lowercaseUrl.includes(ext));
}

/**
 * Debounce function for search inputs
 */
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(null, args), wait);
  };
}

/**
 * Handle async operations with error catching
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  errorMessage: string = 'An error occurred'
): Promise<{ data: T | null; error: string | null }> {
  try {
    const data = await operation();
    return { data, error: null };
  } catch (error) {
    console.error(errorMessage, error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : errorMessage 
    };
  }
}