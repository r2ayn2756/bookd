'use client';

import { useState, useCallback, useRef } from 'react';
import { updateCurrentUserProfile } from '@/services/client/individual_profiles';
import type { IndividualProfile } from '@/types/database';

// Types for the update hook
export interface UpdateProfileState {
  loading: boolean;
  error: string | null;
  success: boolean;
}

export interface UpdateProfileOptions {
  optimistic?: boolean;
  onSuccess?: (updatedProfile: IndividualProfile) => void;
  onError?: (error: Error) => void;
}

export interface UseUpdateProfileReturn {
  updateProfile: (updates: Partial<IndividualProfile>, options?: UpdateProfileOptions) => Promise<IndividualProfile | null>;
  state: UpdateProfileState;
  clearState: () => void;
}

/**
 * Hook for updating current user's individual profile
 * Supports optimistic updates and comprehensive error handling
 */
export function useUpdateProfile(): UseUpdateProfileReturn {
  const [state, setState] = useState<UpdateProfileState>({
    loading: false,
    error: null,
    success: false
  });

  // Use ref to prevent stale closures in callbacks
  const stateRef = useRef(state);
  stateRef.current = state;

  const updateProfile = useCallback(async (
    updates: Partial<IndividualProfile>, 
    options: UpdateProfileOptions = {}
  ): Promise<IndividualProfile | null> => {
    const { optimistic = false, onSuccess, onError } = options;

    try {
      setState({
        loading: true,
        error: null,
        success: false
      });

      // Validate required fields if they're being updated
      if (updates.instruments && updates.instruments.length === 0) {
        throw new Error('At least one instrument is required');
      }

      if (updates.genres && updates.genres.length === 0) {
        throw new Error('At least one genre is required');
      }

      // Removed validation for base_rate_per_hour, years_experience, and travel_distance_km
      // as these fields are no longer used in the form

      // Update profile
      const updatedProfile = await updateCurrentUserProfile(updates);

      if (!updatedProfile) {
        throw new Error('Failed to update profile');
      }

      setState({
        loading: false,
        error: null,
        success: true
      });

      // Call success callback if provided
      if (onSuccess) {
        onSuccess(updatedProfile);
      }

      return updatedProfile;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
      
      setState({
        loading: false,
        error: errorMessage,
        success: false
      });

      // Call error callback if provided
      if (onError && error instanceof Error) {
        onError(error);
      }

      console.error('Error updating profile:', error);
      return null;
    }
  }, []);

  const clearState = useCallback(() => {
    setState({
      loading: false,
      error: null,
      success: false
    });
  }, []);

  return {
    updateProfile,
    state,
    clearState
  };
}

/**
 * Hook for batch updating multiple profile fields
 * Useful for forms with multiple fields
 */
export function useBatchUpdateProfile() {
  const [state, setState] = useState<UpdateProfileState>({
    loading: false,
    error: null,
    success: false
  });

  const [pendingUpdates, setPendingUpdates] = useState<Partial<IndividualProfile>>({});

  const addUpdate = useCallback((field: keyof IndividualProfile, value: any) => {
    setPendingUpdates(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const removeUpdate = useCallback((field: keyof IndividualProfile) => {
    setPendingUpdates(prev => {
      const { [field]: removed, ...rest } = prev;
      return rest;
    });
  }, []);

  const commitUpdates = useCallback(async (options: UpdateProfileOptions = {}): Promise<IndividualProfile | null> => {
    const { onSuccess, onError } = options;

    if (Object.keys(pendingUpdates).length === 0) {
      throw new Error('No updates pending');
    }

    try {
      setState({
        loading: true,
        error: null,
        success: false
      });

      const updatedProfile = await updateCurrentUserProfile(pendingUpdates);

      if (!updatedProfile) {
        throw new Error('Failed to update profile');
      }

      setState({
        loading: false,
        error: null,
        success: true
      });

      // Clear pending updates on success
      setPendingUpdates({});

      if (onSuccess) {
        onSuccess(updatedProfile);
      }

      return updatedProfile;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
      
      setState({
        loading: false,
        error: errorMessage,
        success: false
      });

      if (onError && error instanceof Error) {
        onError(error);
      }

      console.error('Error in batch update:', error);
      return null;
    }
  }, [pendingUpdates]);

  const clearPendingUpdates = useCallback(() => {
    setPendingUpdates({});
  }, []);

  const clearState = useCallback(() => {
    setState({
      loading: false,
      error: null,
      success: false
    });
  }, []);

  return {
    addUpdate,
    removeUpdate,
    commitUpdates,
    clearPendingUpdates,
    pendingUpdates,
    hasPendingUpdates: Object.keys(pendingUpdates).length > 0,
    state,
    clearState
  };
}

/**
 * Hook for managing profile field validation
 */
export function useProfileValidation() {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateField = useCallback((field: keyof IndividualProfile, value: any): string | null => {
    switch (field) {
      case 'stage_name':
        // Stage name is optional - no validation needed
        break;

      case 'bio':
        if (value && typeof value === 'string' && value.length > 500) {
          return 'Bio must be less than 500 characters';
        }
        break;

      case 'primary_instrument':
        // Primary instrument field removed - no validation needed
        break;

      case 'instruments':
        if (!value || !Array.isArray(value) || value.length === 0) {
          return 'At least one instrument is required';
        }
        break;

      case 'genres':
        if (!value || !Array.isArray(value) || value.length === 0) {
          return 'At least one genre is required';
        }
        break;

      case 'years_experience':
      case 'base_rate_per_hour':
      case 'travel_distance_km':
        // These fields have been removed from the form - no validation needed
        break;

      case 'phone_number':
        if (value && typeof value === 'string' && !/^[\+]?[1-9][\d]{0,15}$/.test(value.replace(/\s/g, ''))) {
          return 'Please enter a valid phone number';
        }
        break;

      case 'website_url':
        if (value && typeof value === 'string') {
          try {
            new URL(value);
          } catch {
            return 'Please enter a valid URL';
          }
        }
        break;

      default:
        break;
    }

    return null;
  }, []);

  const validateFields = useCallback((fields: Partial<IndividualProfile>): Record<string, string> => {
    const newErrors: Record<string, string> = {};

    Object.entries(fields).forEach(([field, value]) => {
      const error = validateField(field as keyof IndividualProfile, value);
      if (error) {
        newErrors[field] = error;
      }
    });

    setErrors(newErrors);
    return newErrors;
  }, [validateField]);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const clearFieldError = useCallback((field: string) => {
    setErrors(prev => {
      const { [field]: removed, ...rest } = prev;
      return rest;
    });
  }, []);

  const hasErrors = Object.keys(errors).length > 0;
  const isValid = !hasErrors;

  return {
    errors,
    validateField,
    validateFields,
    clearErrors,
    clearFieldError,
    hasErrors,
    isValid
  };
}