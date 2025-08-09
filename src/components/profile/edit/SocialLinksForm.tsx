'use client';

import { useState } from 'react';
import { updateCompleteProfile, validateProfileUpdate } from '@/services/client';
import type { CompleteProfileUpdate } from '@/services/client';
import type { UserWithProfile } from '@/types/database';

interface SocialLinksFormProps {
  userWithProfile: UserWithProfile;
}

const SOCIAL_PLATFORMS = [
  { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/username', icon: '📷' },
  { key: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/channel/...', icon: '📺' },
  { key: 'spotify', label: 'Spotify', placeholder: 'https://open.spotify.com/artist/...', icon: '🎵' },
  { key: 'soundcloud', label: 'SoundCloud', placeholder: 'https://soundcloud.com/username', icon: '🎧' },
  { key: 'bandcamp', label: 'Bandcamp', placeholder: 'https://username.bandcamp.com', icon: '🎼' },
  { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/username', icon: '📘' },
  { key: 'twitter', label: 'Twitter/X', placeholder: 'https://twitter.com/username', icon: '🐦' },
  { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/username', icon: '💼' },
  { key: 'tiktok', label: 'TikTok', placeholder: 'https://tiktok.com/@username', icon: '🎭' },
  { key: 'website', label: 'Personal Website', placeholder: 'https://yourwebsite.com', icon: '🌐' }
];

export function SocialLinksForm({ userWithProfile }: SocialLinksFormProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  
  const currentSocialLinks = userWithProfile.individual_profile?.social_links || {};
  
  const [formData, setFormData] = useState<Record<string, string>>(() => {
    const links: Record<string, string> = {};
    SOCIAL_PLATFORMS.forEach(platform => {
      links[platform.key] = currentSocialLinks[platform.key] || '';
    });
    return links;
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateUrl = (url: string): boolean => {
    if (!url.trim()) return true; // Empty URLs are valid
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    Object.entries(formData).forEach(([platform, url]) => {
      if (url.trim() && !validateUrl(url)) {
        newErrors[platform] = 'Please enter a valid URL';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (platform: string, value: string) => {
    setFormData(prev => ({ ...prev, [platform]: value }));
    setHasChanges(true);
    
    // Clear error for this field
    if (errors[platform]) {
      setErrors(prev => ({ ...prev, [platform]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Filter out empty URLs and create the social_links object
      const socialLinks: Record<string, string> = {};
      Object.entries(formData).forEach(([platform, url]) => {
        if (url.trim()) {
          socialLinks[platform] = url.trim();
        }
      });

      const updates: CompleteProfileUpdate = {
        social_links: Object.keys(socialLinks).length > 0 ? socialLinks : {}
      };

      // Validate the update data
      const validation = validateProfileUpdate(updates);
      if (!validation.valid) {
        setError(validation.errors.join(', '));
        setLoading(false);
        return;
      }

      // Perform the update
      const result = await updateCompleteProfile(updates);
      
      if (result.success) {
        setSuccess(true);
        setHasChanges(false);
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(result.error || 'Failed to update social links');
      }
    } catch (err) {
      console.error('Error updating social links:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const clearAll = () => {
    const emptyData: Record<string, string> = {};
    SOCIAL_PLATFORMS.forEach(platform => {
      emptyData[platform.key] = '';
    });
    setFormData(emptyData);
    setHasChanges(true);
  };

  const filledLinksCount = Object.values(formData).filter(url => url.trim()).length;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Social Media Links</h2>
          <p className="text-sm text-gray-500 mt-1">
            Connect your social profiles to showcase your music ({filledLinksCount} linked)
          </p>
        </div>
        {success && (
          <div className="text-sm text-green-600 font-medium">
            ✓ Changes saved successfully
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {SOCIAL_PLATFORMS.map(platform => (
          <div key={platform.key}>
            <label htmlFor={platform.key} className="block text-sm font-medium text-gray-700 mb-2">
              <span className="inline-flex items-center gap-2">
                <span>{platform.icon}</span>
                {platform.label}
              </span>
            </label>
            <input
              type="url"
              id={platform.key}
              value={formData[platform.key]}
              onChange={(e) => handleInputChange(platform.key, e.target.value)}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors[platform.key] ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder={platform.placeholder}
              disabled={loading}
            />
            {errors[platform.key] && (
              <p className="mt-1 text-sm text-red-600">{errors[platform.key]}</p>
            )}
          </div>
        ))}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex items-center gap-4">
            {filledLinksCount > 0 && (
              <button
                type="button"
                onClick={clearAll}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200"
                disabled={loading}
              >
                Clear All
              </button>
            )}
            {hasChanges && (
              <p className="text-sm text-amber-600">You have unsaved changes</p>
            )}
          </div>
          
          <button
            type="submit"
            disabled={loading || !hasChanges}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </form>

      {/* Preview Section */}
      {filledLinksCount > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Preview</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(formData)
              .filter(([, url]) => url.trim())
              .map(([platform, url]) => {
                const platformInfo = SOCIAL_PLATFORMS.find(p => p.key === platform);
                return (
                  <a
                    key={platform}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs hover:bg-gray-200 transition-colors duration-200"
                  >
                    <span>{platformInfo?.icon}</span>
                    <span>{platformInfo?.label}</span>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
