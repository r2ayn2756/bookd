'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useProfile } from './useProfile';
import { useUpdateProfile } from './useUpdateProfile';
import type { IndividualProfile, UserWithProfile } from '@/types/database';

// Combined hook state
export interface ProfileDataState {
  // Profile data
  profile: UserWithProfile | null;
  individualProfile: IndividualProfile | null;
  
  // Loading states
  loading: boolean;
  updating: boolean;
  
  // Error states
  error: string | null;
  updateError: string | null;
  
  // Success states
  updateSuccess: boolean;
  
  // Profile status
  isComplete: boolean;
  completionPercentage: number;
  missingFields: string[];
}

export interface ProfileDataActions {
  // Profile operations
  refetch: () => Promise<void>;
  updateProfile: (updates: Partial<IndividualProfile>) => Promise<IndividualProfile | null>;
  
  // Error management
  clearErrors: () => void;
  clearUpdateState: () => void;
  
  // Completion helpers
  getMissingFields: () => string[];
  getCompletionPercentage: () => number;
}

export type UseProfileDataReturn = ProfileDataState & ProfileDataActions;

/**
 * Combined hook for comprehensive profile data management
 * Combines profile fetching, updating, validation, and completion tracking
 */
export function useProfileData(): UseProfileDataReturn {
  const { 
    profile, 
    loading, 
    error, 
    isComplete, 
    refetch,
    clearError 
  } = useProfile();

  const { 
    updateProfile: updateProfileFn, 
    state: updateState, 
    clearState: clearUpdateState 
  } = useUpdateProfile();

  // Calculate missing fields and completion percentage
  const missingFields = useMemo(() => {
    if (!profile?.individual_profile) return [];
    
    const ip = profile.individual_profile;
    const missing: string[] = [];
    
    if (!ip.stage_name) missing.push('Stage Name');
    if (!ip.primary_instrument) missing.push('Primary Instrument');
    if (!ip.bio) missing.push('Bio');
    if (!ip.location) missing.push('Location');
    if (!ip.instruments || ip.instruments.length === 0) missing.push('Instruments');
    if (!ip.genres || ip.genres.length === 0) missing.push('Genres');
    
    return missing;
  }, [profile?.individual_profile]);

  const completionPercentage = useMemo(() => {
    const totalFields = 6; // stage_name, primary_instrument, bio, location, instruments, genres
    const completedFields = totalFields - missingFields.length;
    return Math.round((completedFields / totalFields) * 100);
  }, [missingFields.length]);

  const clearErrors = useCallback(() => {
    clearError();
    clearUpdateState();
  }, [clearError, clearUpdateState]);

  const getMissingFields = useCallback(() => missingFields, [missingFields]);
  const getCompletionPercentage = useCallback(() => completionPercentage, [completionPercentage]);

  const updateProfile = useCallback(async (updates: Partial<IndividualProfile>) => {
    const result = await updateProfileFn(updates, {
      onSuccess: () => {
        // Refetch profile to get updated data
        refetch();
      }
    });
    return result;
  }, [updateProfileFn, refetch]);

  return {
    // Profile data
    profile,
    individualProfile: profile?.individual_profile || null,
    
    // Loading states
    loading,
    updating: updateState.loading,
    
    // Error states
    error,
    updateError: updateState.error,
    
    // Success states
    updateSuccess: updateState.success,
    
    // Profile status
    isComplete,
    completionPercentage,
    missingFields,
    
    // Actions
    refetch,
    updateProfile,
    clearErrors,
    clearUpdateState,
    getMissingFields,
    getCompletionPercentage
  };
}

/**
 * Hook for managing profile completion workflow
 */
export function useProfileCompletion() {
  const {
    profile,
    isComplete,
    completionPercentage,
    missingFields,
    updateProfile,
    updating
  } = useProfileData();

  const [currentStep, setCurrentStep] = useState(0);

  // Define completion steps
  const completionSteps = useMemo(() => [
    {
      id: 'basic',
      title: 'Basic Information',
      description: 'Tell us about yourself',
      fields: ['stage_name', 'bio', 'location'],
      completed: false
    },
    {
      id: 'musical',
      title: 'Musical Background',
      description: 'Share your musical expertise',
      fields: ['primary_instrument', 'instruments', 'genres'],
      completed: false
    },
    {
      id: 'professional',
      title: 'Professional Details',
      description: 'Set your rates and availability',
      fields: ['base_rate_per_hour', 'years_experience', 'looking_for_gigs'],
      completed: false
    }
  ], []);

  // Check which steps are completed
  const stepsWithCompletion = useMemo(() => {
    if (!profile?.individual_profile) return completionSteps;
    
    const ip = profile.individual_profile;
    
    return completionSteps.map(step => ({
      ...step,
      completed: step.fields.every(field => {
        const value = ip[field as keyof IndividualProfile];
        if (Array.isArray(value)) {
          return value.length > 0;
        }
        return value !== null && value !== undefined && value !== '';
      })
    }));
  }, [profile?.individual_profile, completionSteps]);

  const nextIncompleteStep = useMemo(() => {
    return stepsWithCompletion.findIndex(step => !step.completed);
  }, [stepsWithCompletion]);

  const goToNextStep = useCallback(() => {
    if (currentStep < completionSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  }, [currentStep, completionSteps.length]);

  const goToPreviousStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const goToStep = useCallback((stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < completionSteps.length) {
      setCurrentStep(stepIndex);
    }
  }, [completionSteps.length]);

  const completeStep = useCallback(async (stepData: Partial<IndividualProfile>) => {
    const result = await updateProfile(stepData);
    if (result) {
      // Auto-advance to next incomplete step if current step is now complete
      if (nextIncompleteStep > currentStep) {
        setCurrentStep(nextIncompleteStep);
      }
    }
    return result;
  }, [updateProfile, currentStep, nextIncompleteStep]);

  return {
    // Step data
    steps: stepsWithCompletion,
    currentStep,
    currentStepData: stepsWithCompletion[currentStep],
    
    // Progress
    completedSteps: stepsWithCompletion.filter(step => step.completed).length,
    totalSteps: completionSteps.length,
    progressPercentage: Math.round((stepsWithCompletion.filter(step => step.completed).length / completionSteps.length) * 100),
    
    // Status
    isComplete,
    completionPercentage,
    missingFields,
    nextIncompleteStep,
    
    // Navigation
    goToNextStep,
    goToPreviousStep,
    goToStep,
    completeStep,
    
    // State
    updating,
    
    // Flags
    canGoNext: currentStep < completionSteps.length - 1,
    canGoPrevious: currentStep > 0,
    isLastStep: currentStep === completionSteps.length - 1
  };
}

/**
 * Hook for managing profile form state
 */
export function useProfileForm(initialData?: Partial<IndividualProfile>) {
  const { updateProfile, updating, updateError, updateSuccess } = useProfileData();
  const [formData, setFormData] = useState<Partial<IndividualProfile>>(initialData || {});
  const [isDirty, setIsDirty] = useState(false);

  // Update form data
  const updateField = useCallback((field: keyof IndividualProfile, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  }, []);

  // Reset form to initial data
  const resetForm = useCallback(() => {
    setFormData(initialData || {});
    setIsDirty(false);
  }, [initialData]);

  // Submit form
  const submitForm = useCallback(async () => {
    if (!isDirty) return null;
    
    const result = await updateProfile(formData);
    if (result) {
      setIsDirty(false);
    }
    return result;
  }, [formData, isDirty, updateProfile]);

  // Update initial data when it changes
  useEffect(() => {
    if (initialData && !isDirty) {
      setFormData(initialData);
    }
  }, [initialData, isDirty]);

  return {
    formData,
    updateField,
    resetForm,
    submitForm,
    isDirty,
    isSubmitting: updating,
    submitError: updateError,
    submitSuccess: updateSuccess
  };
}