'use client';

import { useEffect, useState } from 'react';
import { useProfileData } from '@/hooks';
import { Avatar } from './ProfilePictureUpload';
import type { UserWithProfile, OrganizationProfile } from '@/types/database';
import { createClient } from '@/lib/supabase/client';

interface ProfileHeaderProps {
  initialData?: UserWithProfile | null;
  forceData?: UserWithProfile | null; // when provided, always display this data
}

export function ProfileHeader({ initialData, forceData }: ProfileHeaderProps) {
  const { profile, loading, error } = useProfileData();
  const supabase = createClient();
  const [organization, setOrganization] = useState<OrganizationProfile | null>(null);
  
  // Use forced data if provided (for viewing someone else's profile)
  const displayProfile = forceData || profile || initialData;
  const individualProfile = displayProfile?.individual_profile;
  const initialAccountType = (initialData as any)?.account_type as 'artist' | 'organization' | undefined;
  const clientAccountType = (profile as any)?.account_type as 'artist' | 'organization' | undefined;
  // Trust client state when available; else fall back to initial server state
  const resolvedAccountType: 'artist' | 'organization' | undefined = clientAccountType ?? initialAccountType ?? ((displayProfile as any)?.account_type as any);
  const activeOrgId = resolvedAccountType === 'organization'
    ? ((profile as any)?.active_organization_id as string | null | undefined) || ((initialData as any)?.active_organization_id as string | null | undefined)
    : null;

  // Load active organization details when in organization mode
  useEffect(() => {
    let mounted = true;
    const loadOrg = async () => {
      try {
        if (accountType === 'organization' && activeOrgId) {
          const { data } = await supabase
            .from('organization_profiles')
            .select('*')
            .eq('id', activeOrgId)
            .single();
          if (mounted) setOrganization((data || null) as any);
        } else {
          if (mounted) setOrganization(null);
        }
      } catch {
        if (mounted) setOrganization(null);
      }
    };
    loadOrg();
    return () => { mounted = false; };
  }, [resolvedAccountType, activeOrgId, supabase]);
  
  if (!forceData && loading && !initialData) {
    return (
      <div className="bg-white rounded-lg shadow p-8">
        <div className="text-center">
          <div className="w-32 h-32 rounded-full bg-gray-200 animate-pulse mx-auto mb-4"></div>
          <div className="h-6 bg-gray-200 animate-pulse rounded mx-auto mb-4 w-3/4"></div>
        </div>
      </div>
    );
  }

  if (!forceData && error && !initialData) {
    return (
      <div className="bg-white rounded-lg shadow p-8">
        <div className="text-center text-red-600">
          <p>Error loading profile: {error}</p>
        </div>
      </div>
    );
  }

  const getDisplayName = () => {
    if (organization?.name) {
      return organization.name;
    }
    if (individualProfile?.stage_name) {
      return individualProfile.stage_name;
    }
    if (displayProfile?.full_name) {
      return displayProfile.full_name;
    }
    // fallbacks when using forced data
    return displayProfile?.email?.split('@')[0] || 'User';
  };



  const getHeadliner = () => {
    if (organization) {
      const parts: string[] = [];
      if (organization.organization_type) parts.push(organization.organization_type.replace(/_/g, ' '));
      const loc = [organization.city, organization.state_province, organization.country].filter(Boolean).join(', ');
      if (loc) parts.push(loc);
      return parts.length > 0 ? parts.join(' | ') : 'Organization';
    }
    if (individualProfile?.headliner) {
      return individualProfile.headliner;
    }
    
    // Generate a fallback headliner from available data
    const parts = [];
    if (individualProfile?.primary_instrument) {
      parts.push(individualProfile.primary_instrument);
    }
    if (individualProfile?.location) {
      parts.push(`from ${individualProfile.location}`);
    }
    
    return parts.length > 0 ? parts.join(' | ') : 'Musician';
  };

  return (
    <div className="bg-white rounded-lg shadow p-8">
      <div className="text-center">
        {/* Profile Picture */}
        <div className="mb-4">
          {displayProfile && (
            <Avatar 
              userWithProfile={displayProfile}
              size="xl"
              className="mx-auto shadow-lg"
            />
          )}
        </div>
        
        {/* Name */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {getDisplayName()}
        </h1>
        
        {/* Headliner/Bio Badge */}
        <div className="inline-block px-4 py-2 rounded-full text-sm font-medium text-white mb-4" style={{backgroundColor: '#7823E1'}}>
          {getHeadliner()}
        </div>

        {/* Key Profile Info */}
        <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600">
          {individualProfile?.location && (
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {individualProfile.location}
            </div>
          )}
          
          {typeof individualProfile?.years_experience === 'number' && (
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {individualProfile.years_experience} years experience
            </div>
          )}
          
          {resolvedAccountType !== 'organization' && individualProfile?.looking_for_gigs && (
            <div className="flex items-center text-green-600">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Available for gigs
            </div>
          )}
        </div>

        {/* Instruments & Genres (artists only) */}
        {resolvedAccountType !== 'organization' && (
          <div className="mt-4 space-y-2">
            {individualProfile?.instruments && individualProfile.instruments.length > 0 && (
              <div>
                <span className="text-sm font-medium text-gray-700">Instruments: </span>
                <span className="text-sm text-gray-600">
                  {individualProfile.instruments.join(', ')}
                </span>
              </div>
            )}
            
            {individualProfile?.genres && individualProfile.genres.length > 0 && (
              <div>
                <span className="text-sm font-medium text-gray-700">Genres: </span>
                <span className="text-sm text-gray-600">
                  {individualProfile.genres.join(', ')}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}