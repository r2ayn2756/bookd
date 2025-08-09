import { updateCurrentUser } from './users';
import { updateCurrentUserProfile } from './individual_profiles';
import type { User, IndividualProfile, UserWithProfile } from '@/types/database';

/**
 * Combined update type that spans both users and individual_profiles tables
 */
export interface CompleteProfileUpdate {
  // User table fields
  full_name?: string;
  avatar_url?: string;
  
  // Individual profile fields
  stage_name?: string | null;
  bio?: string | null;
  headliner?: string | null;
  location?: string | null;
  website_url?: string | null;
  primary_instrument?: string | null;
  instruments?: string[] | null;
  genres?: string[] | null;
  years_experience?: number | null;
  looking_for_gigs?: boolean;
  available_for_hire?: boolean;
  travel_distance_km?: number | null;
  base_rate_per_hour?: number | null;
  preferred_contact_method?: 'email' | 'phone' | 'app' | null;
  phone_number?: string | null;
  social_links?: Record<string, string>;
  availability?: Record<string, any>;
}

export interface UpdateResult {
  success: boolean;
  userUpdate?: User | null;
  profileUpdate?: IndividualProfile | null;
  error?: string;
}

/**
 * Updates both the users table and individual_profiles table in a coordinated manner
 * Ensures data consistency across both tables
 */
export async function updateCompleteProfile(updates: CompleteProfileUpdate): Promise<UpdateResult> {
  try {
    console.log('Starting profile update with data:', updates);
    
    // Separate updates by table
    const userUpdates: Partial<User> = {};
    const profileUpdates: Partial<IndividualProfile> = {};

    // Sort fields into their respective tables
    Object.entries(updates).forEach(([key, value]) => {
      if (key === 'full_name' || key === 'avatar_url') {
        userUpdates[key as keyof User] = value as any;
      } else {
        profileUpdates[key as keyof IndividualProfile] = value as any;
      }
    });

    console.log('User table updates:', userUpdates);
    console.log('Profile table updates:', profileUpdates);

    // Execute updates in parallel for better performance
    const promises: Promise<any>[] = [];
    let userUpdateResult: User | null = null;
    let profileUpdateResult: IndividualProfile | null = null;
    
    if (Object.keys(userUpdates).length > 0) {
      promises.push(
        updateCurrentUser(userUpdates)
          .then(result => { userUpdateResult = result; return result; })
      );
    }
    
    if (Object.keys(profileUpdates).length > 0) {
      promises.push(
        updateCurrentUserProfile(profileUpdates)
          .then(result => { profileUpdateResult = result; return result; })
      );
    }

    // Wait for all updates to complete
    const results = await Promise.all(promises);
    console.log('Update results:', results);
    
    // Check if all updates succeeded
    const allSucceeded = results.every(result => result !== null);
    
    if (!allSucceeded) {
      console.error('Some updates failed:', { userUpdateResult, profileUpdateResult });
      return {
        success: false,
        userUpdate: userUpdateResult,
        profileUpdate: profileUpdateResult,
        error: 'Some updates failed - check console for details'
      };
    }

    console.log('All updates succeeded');
    return {
      success: true,
      userUpdate: userUpdateResult,
      profileUpdate: profileUpdateResult
    };

  } catch (error) {
    console.error('Error in updateCompleteProfile:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to update profile';
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Check for common Supabase errors
      if (error.message.includes('JWT')) {
        errorMessage = 'Session expired. Please refresh the page and try again.';
      } else if (error.message.includes('permission')) {
        errorMessage = 'You don\'t have permission to update this profile.';
      } else if (error.message.includes('network')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.message.includes('constraint')) {
        errorMessage = 'Invalid data provided. Please check your inputs.';
      }
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Validates profile update data before submission
 */
export function validateProfileUpdate(updates: CompleteProfileUpdate): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate full_name if provided
  if (updates.full_name !== undefined) {
    if (!updates.full_name || updates.full_name.trim().length === 0) {
      errors.push('Full name is required');
    } else if (updates.full_name.length > 100) {
      errors.push('Full name cannot exceed 100 characters');
    }
  }

  // Validate bio if provided
  if (updates.bio !== undefined && updates.bio !== null) {
    if (updates.bio.length > 500) {
      errors.push('Bio cannot exceed 500 characters');
    }
  }

  // Validate headliner if provided
  if (updates.headliner !== undefined && updates.headliner !== null) {
    if (updates.headliner.length > 100) {
      errors.push('Headliner cannot exceed 100 characters');
    }
  }

  // Validate website_url if provided
  if (updates.website_url !== undefined && updates.website_url !== null && updates.website_url.trim()) {
    try {
      new URL(updates.website_url);
    } catch {
      errors.push('Please enter a valid website URL');
    }
  }

  // Validate phone_number if provided
  if (updates.phone_number !== undefined && updates.phone_number !== null && updates.phone_number.trim()) {
    const phoneRegex = /^[\d\s\-\+\(\)\.]+$/;
    if (!phoneRegex.test(updates.phone_number)) {
      errors.push('Please enter a valid phone number');
    }
  }

  // Validate instruments array
  if (updates.instruments !== undefined && updates.instruments !== null) {
    if (!Array.isArray(updates.instruments)) {
      errors.push('Instruments must be an array');
    }
  }

  // Validate genres array
  if (updates.genres !== undefined && updates.genres !== null) {
    if (!Array.isArray(updates.genres)) {
      errors.push('Genres must be an array');
    }
  }

  // Validate years_experience if provided
  if (updates.years_experience !== undefined && updates.years_experience !== null) {
    if (updates.years_experience < 0 || updates.years_experience > 100) {
      errors.push('Years of experience must be between 0 and 100');
    }
  }

  // Validate base_rate_per_hour if provided
  if (updates.base_rate_per_hour !== undefined && updates.base_rate_per_hour !== null) {
    if (updates.base_rate_per_hour < 0) {
      errors.push('Base rate cannot be negative');
    }
  }

  // Validate travel_distance_km if provided
  if (updates.travel_distance_km !== undefined && updates.travel_distance_km !== null) {
    if (updates.travel_distance_km < 0) {
      errors.push('Travel distance cannot be negative');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
