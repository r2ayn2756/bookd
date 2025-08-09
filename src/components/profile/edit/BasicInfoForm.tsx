'use client';

import { useState, useEffect } from 'react';
import { updateCompleteProfile, validateProfileUpdate } from '@/services/client';
import type { CompleteProfileUpdate } from '@/services/client';
import type { UserWithProfile } from '@/types/database';

interface BasicInfoFormProps {
  userWithProfile: UserWithProfile;
}

export function BasicInfoForm({ userWithProfile }: BasicInfoFormProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: userWithProfile.full_name || '',
    bio: userWithProfile.individual_profile?.bio || '',
    headliner: userWithProfile.individual_profile?.headliner || '',
    location: userWithProfile.individual_profile?.location || '',
    website_url: userWithProfile.individual_profile?.website_url || ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
    }

    if (formData.bio && formData.bio.length > 500) {
      newErrors.bio = 'Bio cannot exceed 500 characters';
    }

    if (formData.headliner && formData.headliner.length > 100) {
      newErrors.headliner = 'Headliner cannot exceed 100 characters';
    }

    if (formData.website_url && formData.website_url.trim()) {
      try {
        new URL(formData.website_url);
      } catch {
        newErrors.website_url = 'Please enter a valid URL';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
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
      const updates: CompleteProfileUpdate = {
        // User table updates
        full_name: formData.full_name.trim(),
        
        // Individual profile table updates
        bio: formData.bio.trim() || null,
        headliner: formData.headliner.trim() || null,
        location: formData.location.trim() || null,
        website_url: formData.website_url.trim() || null
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
      console.log('Profile update result:', result);
      
      if (result.success) {
        setSuccess(true);
        setHasChanges(false);
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(false), 3000);
      } else {
        console.error('Profile update failed:', result);
        setError(result.error || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Error updating basic info:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Basic Information</h2>
        {success && (
          <div className="text-sm text-green-600 font-medium">
            ✓ Changes saved successfully
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Full Name */}
        <div>
          <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-2">
            Full Name *
          </label>
          <input
            type="text"
            id="full_name"
            value={formData.full_name}
            onChange={(e) => handleInputChange('full_name', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black ${
              errors.full_name ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Your legal or professional name"
            maxLength={100}
            disabled={loading}
          />
          {errors.full_name && (
            <p className="mt-1 text-sm text-red-600">{errors.full_name}</p>
          )}
        </div>

        {/* Headliner */}
        <div>
          <label htmlFor="headliner" className="block text-sm font-medium text-gray-700 mb-2">
            Professional Headline
          </label>
          <input
            type="text"
            id="headliner"
            value={formData.headliner}
            onChange={(e) => handleInputChange('headliner', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black ${
              errors.headliner ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="e.g., Classical Violinist, Jazz Pianist, Vocalist"
            maxLength={100}
            disabled={loading}
          />
          {errors.headliner && (
            <p className="mt-1 text-sm text-red-600">{errors.headliner}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            {formData.headliner.length}/100 characters
          </p>
        </div>

        {/* Location */}
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
            Location
          </label>
          <input
            type="text"
            id="location"
            value={formData.location}
            onChange={(e) => handleInputChange('location', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
            placeholder="City, State or City, Country"
            maxLength={100}
            disabled={loading}
          />
        </div>

        {/* Website */}
        <div>
          <label htmlFor="website_url" className="block text-sm font-medium text-gray-700 mb-2">
            Website
          </label>
          <input
            type="url"
            id="website_url"
            value={formData.website_url}
            onChange={(e) => handleInputChange('website_url', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black ${
              errors.website_url ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="https://yourwebsite.com"
            disabled={loading}
          />
          {errors.website_url && (
            <p className="mt-1 text-sm text-red-600">{errors.website_url}</p>
          )}
        </div>

        {/* Bio */}
        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
            About
          </label>
          <textarea
            id="bio"
            value={formData.bio}
            onChange={(e) => handleInputChange('bio', e.target.value)}
            rows={4}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-black ${
              errors.bio ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Tell people about your musical journey, experience, and what makes you unique..."
            maxLength={500}
            disabled={loading}
          />
          {errors.bio && (
            <p className="mt-1 text-sm text-red-600">{errors.bio}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            {formData.bio.length}/500 characters
          </p>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200">
          {hasChanges && (
            <p className="text-sm text-amber-600">You have unsaved changes</p>
          )}
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
    </div>
  );
}
