'use client';

import { useState, useCallback, useEffect } from 'react';
import { useProfileData, useUpdateProfile } from '@/hooks';
import type { UserWithProfile } from '@/types/database';
import { createClient } from '@/lib/supabase/client';

interface ProfileAboutProps {
  initialData?: UserWithProfile | null;
  forceData?: UserWithProfile | null; // when provided, always display this data
  isOwner?: boolean; // controls editing UI
}

// Bio configuration
const BIO_CONFIG = {
  MAX_LENGTH: 500,
  TRUNCATE_LENGTH: 150,
  PLACEHOLDER: 'Share your musical journey, experience, and what makes you unique as a musician...'
};

export function ProfileAbout({ initialData, forceData, isOwner = true }: ProfileAboutProps) {
  const { profile, loading, error } = useProfileData();
  const { updateProfile, state: updateState } = useUpdateProfile();
  const isUpdating = updateState.loading;
  const supabase = createClient();
  
  // Component state
  const [isEditing, setIsEditing] = useState(false);
  const [bioText, setBioText] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Use forced data if provided (for viewing someone else's profile)
  const displayProfile = forceData || profile || initialData;
  const individualProfile = displayProfile?.individual_profile;
  const [effectiveIsOwner, setEffectiveIsOwner] = useState<boolean>(isOwner);

  // Defensive owner check: if we are forcing display of another user's data, hide owner actions
  useEffect(() => {
    let mounted = true;
    const checkOwner = async () => {
      try {
        if (forceData?.id) {
          const { data: { user } } = await supabase.auth.getUser();
          if (mounted) setEffectiveIsOwner(Boolean(user && user.id === forceData.id));
        } else {
          if (mounted) setEffectiveIsOwner(isOwner);
        }
      } catch {
        if (mounted) setEffectiveIsOwner(false);
      }
    };
    checkOwner();
    return () => { mounted = false; };
  }, [forceData?.id, isOwner, supabase.auth]);
  
  if (!forceData && loading && !initialData) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 text-center">About</h2>
        </div>
        <div className="p-6">
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 animate-pulse rounded w-full"></div>
            <div className="h-4 bg-gray-200 animate-pulse rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 animate-pulse rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!forceData && error && !initialData) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 text-center">About</h2>
        </div>
        <div className="p-6">
          <div className="text-center text-red-600">
            <p>Error loading profile information: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Bio handling functions
  const formatBioText = useCallback((text: string) => {
    return text.split('\n').map((line, index) => (
      <span key={index}>
        {line}
        {index < text.split('\n').length - 1 && <br />}
      </span>
    ));
  }, []);

  const getBio = useCallback(() => {
    if (individualProfile?.bio) {
      return individualProfile.bio;
    }
    
    // Generate a fallback bio from available data
    const parts = [];
    
    if (individualProfile?.primary_instrument && individualProfile?.genres?.length) {
      parts.push(`I am a ${individualProfile.primary_instrument.toLowerCase()} player specializing in ${individualProfile.genres.join(', ').toLowerCase()}.`);
    } else if (individualProfile?.primary_instrument) {
      parts.push(`I am a ${individualProfile.primary_instrument.toLowerCase()} player.`);
    }
    
    if (individualProfile?.years_experience) {
      parts.push(`I have ${individualProfile.years_experience} years of musical experience.`);
    }
    
    if (individualProfile?.looking_for_gigs) {
      parts.push('I am currently available for new performance opportunities.');
    }
    
    return parts.length > 0 
      ? parts.join(' ')
      : 'Welcome to my musical profile! I\'m excited to connect with fellow musicians and explore new opportunities.';
  }, [individualProfile]);

  const shouldTruncate = useCallback((text: string) => {
    return text.length > BIO_CONFIG.TRUNCATE_LENGTH && !isExpanded;
  }, [isExpanded]);

  const getTruncatedText = useCallback((text: string) => {
    if (!shouldTruncate(text)) return text;
    
    let truncated = text.substring(0, BIO_CONFIG.TRUNCATE_LENGTH);
    const lastSpace = truncated.lastIndexOf(' ');
    
    if (lastSpace > BIO_CONFIG.TRUNCATE_LENGTH * 0.8) {
      truncated = truncated.substring(0, lastSpace);
    }
    
    return truncated + '...';
  }, [shouldTruncate]);

  const hasRealBio = Boolean(individualProfile?.bio);
  const bioText_display = getBio();
  const displayText = getTruncatedText(bioText_display);

  // Editing handlers
  const handleStartEdit = useCallback(() => {
    setBioText(individualProfile?.bio || '');
    setIsEditing(true);
  }, [individualProfile?.bio]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setBioText('');
  }, []);

  const handleSaveBio = useCallback(async () => {
    if (!bioText.trim()) {
      handleCancelEdit();
      return;
    }

    try {
      await updateProfile({ bio: bioText.trim() });
      setIsEditing(false);
      setBioText('');
    } catch (error) {
      console.error('Failed to update bio:', error);
      // Error handling could be improved with toast notifications
    }
  }, [bioText, updateProfile, handleCancelEdit]);

  const handleBioChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= BIO_CONFIG.MAX_LENGTH) {
      setBioText(value);
    }
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      handleCancelEdit();
    } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSaveBio();
    }
  }, [handleCancelEdit, handleSaveBio]);

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 text-center">About</h2>
      </div>
      <div className="p-6">
        <div className="relative">
          {/* Bio Edit/Display Section */}
           {effectiveIsOwner && isEditing ? (
            <div className="space-y-3">
              <div className="relative">
                <textarea
                  value={bioText}
                  onChange={handleBioChange}
                  onKeyDown={handleKeyDown}
                  placeholder={BIO_CONFIG.PLACEHOLDER}
                  className="w-full min-h-[120px] p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
                <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                  {bioText.length}/{BIO_CONFIG.MAX_LENGTH}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  <p>{BIO_CONFIG.MAX_LENGTH - bioText.length} characters remaining</p>
                  <p className="text-xs">Press Ctrl+Enter to save, Esc to cancel</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={handleCancelEdit}
                    className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
                    disabled={isUpdating}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveBio}
                    disabled={isUpdating || !bioText.trim()}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUpdating ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="group">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className={`text-gray-700 leading-relaxed ${!hasRealBio ? 'italic text-gray-500' : ''}`}>
                    {formatBioText(displayText)}
                  </p>
                  
                  {/* Read More/Less Button */}
                  {shouldTruncate(bioText_display) && (
                    <button
                      onClick={() => setIsExpanded(!isExpanded)}
                      className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                      {isExpanded ? 'Show less' : 'Read more'}
                    </button>
                  )}
                </div>
                
                {/* Edit Button (owner only) */}
                {effectiveIsOwner && (
                  <button
                    onClick={handleStartEdit}
                    className="opacity-0 group-hover:opacity-100 transition-opacity ml-3 p-2 text-gray-400 hover:text-gray-600"
                    title="Edit bio"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                )}
              </div>
              
              {effectiveIsOwner && !hasRealBio && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-blue-400 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-blue-800">Complete your profile</p>
                      <p className="text-sm text-blue-600 mt-1">
                        Add a personal bio to help others learn more about your musical background and interests.
                      </p>
                      <button
                        onClick={handleStartEdit}
                        className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-800 underline"
                      >
                        Add your bio
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Additional Profile Information */}
        {individualProfile && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Professional Details */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">Professional Details</h3>
              
              {individualProfile.base_rate_per_hour && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Hourly Rate:</span>
                  <span className="text-sm font-medium text-gray-900">
                    ${individualProfile.base_rate_per_hour}/hour
                  </span>
                </div>
              )}
              
              {individualProfile.travel_distance_km && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Travel Distance:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {individualProfile.travel_distance_km} km
                  </span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Available for Hire:</span>
                <span className={`text-sm font-medium ${individualProfile.available_for_hire ? 'text-green-600' : 'text-gray-400'}`}>
                  {individualProfile.available_for_hire ? 'Yes' : 'No'}
                </span>
              </div>
            </div>

            {/* Contact Preferences */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">Contact</h3>
              
              {individualProfile.preferred_contact_method && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Preferred Contact:</span>
                  <span className="text-sm font-medium text-gray-900 capitalize">
                    {individualProfile.preferred_contact_method}
                  </span>
                </div>
              )}
              
              {individualProfile.website_url && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Website:</span>
                  <a 
                    href={individualProfile.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-blue-600 hover:text-blue-800 truncate max-w-32"
                  >
                    {individualProfile.website_url.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}
              
              {individualProfile.phone_number && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Phone:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {individualProfile.phone_number}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}