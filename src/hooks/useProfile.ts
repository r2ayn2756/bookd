'use client';

import { useState, useEffect, useCallback } from 'react';
import { getCurrentUserWithProfile, getUserWithProfile } from '@/services/client/users';
import { 
  getCurrentUserProfile, 
  updateCurrentUserProfile,
  getOrCreateCurrentUserProfile 
} from '@/services/client/individual_profiles';
import type { UserWithProfile, IndividualProfile } from '@/types/database';

// Types for hook state management
export interface ProfileState {
  profile: UserWithProfile | null;
  loading: boolean;
  error: string | null;
  isComplete: boolean;
}

export interface ProfileActions {
  refetch: () => Promise<void>;
  clearError: () => void;
}

export type UseProfileReturn = ProfileState & ProfileActions;

/**
 * Hook for managing current user's profile data
 * Auto-creates individual profile if it doesn't exist
 */
export function useProfile(): UseProfileReturn {
  const [state, setState] = useState<ProfileState>({
    profile: null,
    loading: true,
    error: null,
    isComplete: false
  });

  const checkProfileComplete = useCallback((profile: UserWithProfile | null): boolean => {
    if (!profile?.individual_profile) return false;
    
    const ip = profile.individual_profile;
    return !!(
      ip.stage_name &&
      ip.primary_instrument &&
      ip.bio &&
      ip.location &&
      ip.instruments && ip.instruments.length > 0 &&
      ip.genres && ip.genres.length > 0
    );
  }, []);

  const fetchProfile = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      // Get current user with profile (auto-creates if needed)
      const userWithProfile = await getCurrentUserWithProfile();
      
      if (userWithProfile) {
        setState({
          profile: userWithProfile,
          loading: false,
          error: null,
          isComplete: checkProfileComplete(userWithProfile)
        });
      } else {
        setState({
          profile: null,
          loading: false,
          error: 'Failed to load profile',
          isComplete: false
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setState({
        profile: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load profile',
        isComplete: false
      });
    }
  }, [checkProfileComplete]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Fetch profile on mount
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    ...state,
    refetch: fetchProfile,
    clearError
  };
}

/**
 * Hook for managing any user's profile data by ID
 */
export function useUserProfile(userId: string | null): UseProfileReturn {
  const [state, setState] = useState<ProfileState>({
    profile: null,
    loading: false,
    error: null,
    isComplete: false
  });

  const checkProfileComplete = useCallback((profile: UserWithProfile | null): boolean => {
    if (!profile?.individual_profile) return false;
    
    const ip = profile.individual_profile;
    return !!(
      ip.stage_name &&
      ip.primary_instrument &&
      ip.bio &&
      ip.location &&
      ip.instruments && ip.instruments.length > 0 &&
      ip.genres && ip.genres.length > 0
    );
  }, []);

  const fetchProfile = useCallback(async () => {
    if (!userId) {
      setState({
        profile: null,
        loading: false,
        error: null,
        isComplete: false
      });
      return;
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const userWithProfile = await getUserWithProfile(userId);
      
      if (userWithProfile) {
        setState({
          profile: userWithProfile,
          loading: false,
          error: null,
          isComplete: checkProfileComplete(userWithProfile)
        });
      } else {
        setState({
          profile: null,
          loading: false,
          error: 'Profile not found',
          isComplete: false
        });
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setState({
        profile: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load profile',
        isComplete: false
      });
    }
  }, [userId, checkProfileComplete]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Fetch profile when userId changes
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    ...state,
    refetch: fetchProfile,
    clearError
  };
}

/**
 * Hook for managing individual profile data only (without user data)
 */
export function useIndividualProfile() {
  const [state, setState] = useState<{
    profile: IndividualProfile | null;
    loading: boolean;
    error: string | null;
    isComplete: boolean;
  }>({
    profile: null,
    loading: true,
    error: null,
    isComplete: false
  });

  const checkProfileComplete = useCallback((profile: IndividualProfile | null): boolean => {
    if (!profile) return false;
    
    return !!(
      profile.stage_name &&
      profile.primary_instrument &&
      profile.bio &&
      profile.location &&
      profile.instruments && profile.instruments.length > 0 &&
      profile.genres && profile.genres.length > 0
    );
  }, []);

  const fetchProfile = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const profile = await getCurrentUserProfile();
      
      if (profile) {
        setState({
          profile,
          loading: false,
          error: null,
          isComplete: checkProfileComplete(profile)
        });
      } else {
        setState({
          profile: null,
          loading: false,
          error: 'No individual profile found',
          isComplete: false
        });
      }
    } catch (error) {
      console.error('Error fetching individual profile:', error);
      setState({
        profile: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load profile',
        isComplete: false
      });
    }
  }, [checkProfileComplete]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Fetch profile on mount
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    ...state,
    refetch: fetchProfile,
    clearError
  };
}