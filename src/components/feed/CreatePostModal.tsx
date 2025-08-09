
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { createPostsService } from '@/services/client/posts';
import type { FeedPost, User, PostType, PostVisibility } from '@/types/database';
import { 
  validatePostContent, 
  sanitizeContent, 
  extractHashtags,
  withErrorHandling,
  getInitials 
} from '@/services/utils';

interface CreatePostModalProps {
  currentUser: User | null;
  onClose: () => void;
  onPostCreated: (post: FeedPost) => void;
}

const POST_TYPES: { value: PostType; label: string; description: string }[] = [
  { value: 'general', label: '💬 General', description: 'Share thoughts, updates, or anything on your mind' },
  { value: 'performance', label: '🎵 Performance', description: 'Announce or share a musical performance' },
  { value: 'announcement', label: '📢 Announcement', description: 'Make an important announcement' },
  { value: 'collaboration', label: '🤝 Collaboration', description: 'Seek collaborators or offer to collaborate' },
  { value: 'opportunity', label: '💼 Opportunity', description: 'Share job opportunities or gigs' },
  { value: 'review', label: '⭐ Review', description: 'Review instruments, venues, or experiences' },
  { value: 'event', label: '📅 Event', description: 'Promote an upcoming musical event' }
];

const VISIBILITY_OPTIONS: { value: PostVisibility; label: string; description: string }[] = [
  { value: 'public', label: '🌍 Public', description: 'Anyone can see this post' },
  { value: 'followers', label: '👥 Followers', description: 'Only your followers can see this post' },
  { value: 'private', label: '🔒 Private', description: 'Only you can see this post' }
];

export function CreatePostModal({ currentUser, onClose, onPostCreated }: CreatePostModalProps) {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [postType, setPostType] = useState<PostType>('general');
  const [visibility, setVisibility] = useState<PostVisibility>('public');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Event-specific fields
  const [eventDate, setEventDate] = useState('');
  const [venueName, setVenueName] = useState('');
  const [location, setLocation] = useState('');
  
  // Collaboration-specific fields
  const [collaborationType, setCollaborationType] = useState('');
  const [instrumentsNeeded, setInstrumentsNeeded] = useState('');
  const [genres, setGenres] = useState('');
  const [compensation, setCompensation] = useState('');

  if (!currentUser) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate content
    const validation = validatePostContent(content);
    if (!validation.isValid) {
      alert(validation.error);
      return;
    }

    setIsSubmitting(true);

    try {
      const service = createPostsService();
      
      // Prepare post data
      const postData = {
        content: sanitizeContent(content),
        title: title.trim() || undefined,
        post_type: postType,
        visibility,
        tags: extractHashtags(content),
        ...(location && { location: location.trim() }),
        ...(postType === 'event' && {
          event_date: eventDate ? new Date(eventDate).toISOString() : undefined,
          venue_name: venueName.trim() || undefined
        }),
        ...(postType === 'collaboration' && {
          collaboration_type: collaborationType || undefined,
          instruments_needed: instrumentsNeeded 
            ? instrumentsNeeded.split(',').map(i => i.trim()).filter(Boolean)
            : undefined,
          genres: genres 
            ? genres.split(',').map(g => g.trim()).filter(Boolean)
            : undefined,
          compensation_offered: compensation.trim() || undefined
        })
      };

      const { data, error } = await withErrorHandling(
        () => service.createPost(postData),
        'Failed to create post'
      );

      if (error) {
        alert(error);
        return;
      }

      if (data) {
        // Create a FeedPost object for the feed
        const feedPost: FeedPost = {
          id: data.id,
          user_id: data.user_id,
          organization_id: data.organization_id,
          content: data.content,
          title: data.title,
          post_type: data.post_type,
          visibility: data.visibility,
          likes_count: 0,
          comments_count: 0,
          created_at: data.created_at,
          is_liked: false,
          author: currentUser,
          media_urls: data.media_urls || undefined,
          tags: data.tags || undefined
        };

        onPostCreated(feedPost);
        onClose();
      }
    } catch (error) {
      console.error('Failed to create post:', error);
      alert('Failed to create post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedPostType = POST_TYPES.find(type => type.value === postType);
  const selectedVisibility = VISIBILITY_OPTIONS.find(vis => vis.value === visibility);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Create Post</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* User Info */}
          <div className="flex items-center space-x-3">
            {currentUser.avatar_url ? (
              <Image
                src={currentUser.avatar_url}
                alt={currentUser.full_name || 'You'}
                width={40}
                height={40}
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                {getInitials(currentUser)}
              </div>
            )}
            <div>
              <p className="font-semibold text-gray-900">{currentUser.full_name}</p>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value as PostVisibility)}
                  className="border border-gray-300 rounded px-2 py-1 text-xs"
                >
                  {VISIBILITY_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Post Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Post Type
            </label>
            <select
              value={postType}
              onChange={(e) => setPostType(e.target.value as PostType)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              {POST_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            {selectedPostType && (
              <p className="text-xs text-gray-500 mt-1">{selectedPostType.description}</p>
            )}
          </div>

          {/* Title (optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title (optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your post a title..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              maxLength={100}
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What's on your mind?
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`Share your thoughts, experiences, or ${selectedPostType?.label.toLowerCase()}...`}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              rows={6}
              maxLength={2000}
              required
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Use #hashtags to categorize your post</span>
              <span>{content.length}/2000</span>
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location (optional)
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Where is this happening?"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Event-specific fields */}
          {postType === 'event' && (
            <div className="space-y-4 p-4 bg-red-50 rounded-lg">
              <h3 className="font-medium text-red-800">Event Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Event Date
                  </label>
                  <input
                    type="datetime-local"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Venue Name
                  </label>
                  <input
                    type="text"
                    value={venueName}
                    onChange={(e) => setVenueName(e.target.value)}
                    placeholder="Concert Hall, Studio, etc."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Collaboration-specific fields */}
          {postType === 'collaboration' && (
            <div className="space-y-4 p-4 bg-green-50 rounded-lg">
              <h3 className="font-medium text-green-800">Collaboration Details</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type of Collaboration
                </label>
                <select
                  value={collaborationType}
                  onChange={(e) => setCollaborationType(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Select type...</option>
                  <option value="seeking_musicians">Seeking Musicians</option>
                  <option value="seeking_venue">Seeking Venue</option>
                  <option value="offering_services">Offering Services</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Instruments Needed
                  </label>
                  <input
                    type="text"
                    value={instrumentsNeeded}
                    onChange={(e) => setInstrumentsNeeded(e.target.value)}
                    placeholder="piano, guitar, drums (comma separated)"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Genres
                  </label>
                  <input
                    type="text"
                    value={genres}
                    onChange={(e) => setGenres(e.target.value)}
                    placeholder="jazz, rock, classical (comma separated)"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Compensation Offered
                </label>
                <input
                  type="text"
                  value={compensation}
                  onChange={(e) => setCompensation(e.target.value)}
                  placeholder="$50/hour, Revenue share, For exposure, etc."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400"
              disabled={isSubmitting || !content.trim()}
            >
              {isSubmitting ? 'Posting...' : 'Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}