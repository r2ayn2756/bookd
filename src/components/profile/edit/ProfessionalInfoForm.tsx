'use client';

import { useState, useEffect } from 'react';
import { updateCompleteProfile, validateProfileUpdate } from '@/services/client';
import type { CompleteProfileUpdate } from '@/services/client';
import type { UserWithProfile } from '@/types/database';

interface ProfessionalInfoFormProps {
  userWithProfile: UserWithProfile;
}

// Common instruments list
const INSTRUMENTS = [
  'Piano', 'Guitar', 'Violin', 'Viola', 'Cello', 'Double Bass', 'Flute', 'Clarinet',
  'Oboe', 'Bassoon', 'Saxophone', 'Trumpet', 'Trombone', 'French Horn', 'Tuba',
  'Drums', 'Percussion', 'Voice/Vocals', 'Harp', 'Accordion', 'Banjo', 'Mandolin',
  'Ukulele', 'Harmonica', 'Organ', 'Synthesizer', 'Electric Guitar', 'Bass Guitar',
  'Other'
];

// Common genres list
const GENRES = [
  'Classical', 'Jazz', 'Blues', 'Rock', 'Pop', 'Folk', 'Country', 'R&B/Soul',
  'Hip Hop', 'Electronic', 'Reggae', 'Latin', 'World Music', 'Gospel', 'Funk',
  'Indie', 'Alternative', 'Metal', 'Punk', 'Acoustic', 'Experimental', 'Other'
];

// Contact methods
const CONTACT_METHODS = [
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'app', label: 'In-App Messaging' }
];

export function ProfessionalInfoForm({ userWithProfile }: ProfessionalInfoFormProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Determine availability status from existing fields
  const getAvailabilityStatus = () => {
    const profile = userWithProfile.individual_profile;
    if (profile?.looking_for_gigs && profile?.available_for_hire) return 'active';
    if (profile?.looking_for_gigs || profile?.available_for_hire) return 'active';
    return 'not_active';
  };

  const [formData, setFormData] = useState({
    instruments: userWithProfile.individual_profile?.instruments || [],
    genres: userWithProfile.individual_profile?.genres || [],
    availability_status: getAvailabilityStatus(),
    preferred_contact_method: userWithProfile.individual_profile?.preferred_contact_method || 'email',
    phone_number: userWithProfile.individual_profile?.phone_number || ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (formData.phone_number && formData.preferred_contact_method === 'phone') {
      const phoneRegex = /^[\d\s\-\+\(\)\.]+$/;
      if (!phoneRegex.test(formData.phone_number)) {
        newErrors.phone_number = 'Please enter a valid phone number';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleArrayChange = (field: 'instruments' | 'genres', value: string) => {
    setFormData(prev => {
      const array = prev[field] as string[];
      const newArray = array.includes(value)
        ? array.filter(item => item !== value)
        : [...array, value];
      return { ...prev, [field]: newArray };
    });
    setHasChanges(true);
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
      // Convert availability status to boolean fields
      const looking_for_gigs = formData.availability_status === 'active';
      const available_for_hire = formData.availability_status === 'active';
      
      const updates: CompleteProfileUpdate = {
        instruments: formData.instruments.length > 0 ? formData.instruments : null,
        genres: formData.genres.length > 0 ? formData.genres : null,
        looking_for_gigs,
        available_for_hire,
        preferred_contact_method: formData.preferred_contact_method as 'email' | 'phone' | 'app',
        phone_number: formData.phone_number.trim() || null
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
        setError(result.error || 'Failed to update professional information');
      }
    } catch (err) {
      console.error('Error updating professional info:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Professional Information</h2>
        {success && (
          <div className="text-sm text-green-600 font-medium">
            ✓ Changes saved successfully
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Instruments */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Instruments
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto border border-gray-200 rounded-md p-3">
            {INSTRUMENTS.map(instrument => (
              <label key={instrument} className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={formData.instruments.includes(instrument)}
                  onChange={() => handleArrayChange('instruments', instrument)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  disabled={loading}
                />
                <span>{instrument}</span>
              </label>
            ))}
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Select all instruments you can play ({formData.instruments.length} selected)
          </p>
        </div>

        {/* Genres */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Musical Genres
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto border border-gray-200 rounded-md p-3">
            {GENRES.map(genre => (
              <label key={genre} className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={formData.genres.includes(genre)}
                  onChange={() => handleArrayChange('genres', genre)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  disabled={loading}
                />
                <span>{genre}</span>
              </label>
            ))}
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Select genres you perform or specialize in ({formData.genres.length} selected)
          </p>
        </div>

        {/* Availability Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Availability Status
          </label>
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => handleInputChange('availability_status', 'busy')}
              className={`px-4 py-3 text-sm font-medium rounded-md border-2 transition-colors duration-200 ${
                formData.availability_status === 'busy'
                  ? 'border-red-500 bg-red-50 text-red-700'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-red-300 hover:bg-red-50'
              }`}
              disabled={loading}
            >
              Busy
            </button>
            <button
              type="button"
              onClick={() => handleInputChange('availability_status', 'active')}
              className={`px-4 py-3 text-sm font-medium rounded-md border-2 transition-colors duration-200 ${
                formData.availability_status === 'active'
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-green-300 hover:bg-green-50'
              }`}
              disabled={loading}
            >
              Active
            </button>
            <button
              type="button"
              onClick={() => handleInputChange('availability_status', 'not_active')}
              className={`px-4 py-3 text-sm font-medium rounded-md border-2 transition-colors duration-200 ${
                formData.availability_status === 'not_active'
                  ? 'border-gray-500 bg-gray-50 text-gray-700'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'
              }`}
              disabled={loading}
            >
              Not Active
            </button>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Active: Available for gigs and hire • Busy: Currently unavailable • Not Active: Not seeking opportunities
          </p>
        </div>

        {/* Contact Preferences */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Contact Preferences</h3>
          
          <div>
            <label htmlFor="preferred_contact_method" className="block text-sm font-medium text-gray-700 mb-2">
              Preferred Contact Method
            </label>
            <select
              id="preferred_contact_method"
              value={formData.preferred_contact_method}
              onChange={(e) => handleInputChange('preferred_contact_method', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
              disabled={loading}
            >
              {CONTACT_METHODS.map(method => (
                <option key={method.value} value={method.value}>{method.label}</option>
              ))}
            </select>
          </div>

          {formData.preferred_contact_method === 'phone' && (
            <div>
              <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                id="phone_number"
                value={formData.phone_number}
                onChange={(e) => handleInputChange('phone_number', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black ${
                  errors.phone_number ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Your phone number"
                disabled={loading}
              />
              {errors.phone_number && (
                <p className="mt-1 text-sm text-red-600">{errors.phone_number}</p>
              )}
            </div>
          )}
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
