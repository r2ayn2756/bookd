'use client';

import { useState, useCallback } from 'react';
import { uploadProfilePicture, deleteProfilePicture, validateImageFile, UploadError } from '@/lib/cloudinary/upload';
import { updateCurrentUserProfile } from '@/services/client/individual_profiles';
import { useProfileData } from './useProfileData';

export interface UploadState {
  uploading: boolean;
  progress: number;
  error: string | null;
  success: boolean;
}

export interface UseProfilePictureUploadReturn {
  uploadState: UploadState;
  uploadProfilePicture: (file: File) => Promise<string | null>;
  deleteProfilePicture: () => Promise<boolean>;
  validateFile: (file: File) => Promise<{ valid: boolean; error?: string }>;
  clearError: () => void;
  clearSuccess: () => void;
}

/**
 * Hook for managing profile picture uploads
 */
export function useProfilePictureUpload(): UseProfilePictureUploadReturn {
  const { profile, refetch } = useProfileData();
  const [uploadState, setUploadState] = useState<UploadState>({
    uploading: false,
    progress: 0,
    error: null,
    success: false
  });

  const uploadPicture = useCallback(async (file: File): Promise<string | null> => {
    try {
      // Reset state
      setUploadState({
        uploading: true,
        progress: 0,
        error: null,
        success: false
      });

      // Validate file
      const validation = await validateImageFile(file);
      if (!validation.valid) {
        throw new UploadError(validation.error || 'Invalid file');
      }

      // Generate unique public_id for the user
      const userId = profile?.id;
      if (!userId) {
        throw new UploadError('User not authenticated');
      }

      const publicId = `profile_${userId}_${Date.now()}`;

      // Upload to Cloudinary
      const uploadResult = await uploadProfilePicture(file, {
        public_id: publicId,
        folder: 'bookd/profiles',
        tags: ['profile', 'avatar', userId],
        onProgress: (progress) => {
          setUploadState(prev => ({ ...prev, progress }));
        }
      });

      // Update user profile with new avatar URL
      await updateCurrentUserProfile({
        // Note: We need to add avatar_url to the users table, not individual_profiles
        // For now, we'll store it in the individual_profiles table temporarily
      });

      // Update the users table avatar_url (this should be done via a separate API)
      const response = await fetch('/api/profile/update-avatar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          avatar_url: uploadResult.secure_url,
          public_id: uploadResult.public_id
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile with new avatar');
      }

      // Success state
      setUploadState({
        uploading: false,
        progress: 100,
        error: null,
        success: true
      });

      // Refetch profile data to get updated avatar
      await refetch();

      return uploadResult.secure_url;

    } catch (error) {
      const errorMessage = error instanceof UploadError 
        ? error.message 
        : 'Failed to upload profile picture';

      setUploadState({
        uploading: false,
        progress: 0,
        error: errorMessage,
        success: false
      });

      console.error('Profile picture upload error:', error);
      return null;
    }
  }, [profile?.id, refetch]);

  const deletePicture = useCallback(async (): Promise<boolean> => {
    try {
      if (!profile?.avatar_url) {
        throw new Error('No profile picture to delete');
      }

      setUploadState(prev => ({ ...prev, uploading: true, error: null }));

      // Extract public_id from URL (this is a simplified approach)
      // In a real implementation, you'd store the public_id separately
      const urlParts = profile.avatar_url.split('/');
      const publicIdWithExtension = urlParts[urlParts.length - 1];
      const publicId = publicIdWithExtension.split('.')[0];

      // Delete from Cloudinary
      await deleteProfilePicture(publicId);

      // Update user profile to remove avatar URL
      const response = await fetch('/api/profile/update-avatar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          avatar_url: null,
          public_id: null
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to remove avatar from profile');
      }

      setUploadState({
        uploading: false,
        progress: 0,
        error: null,
        success: true
      });

      // Refetch profile data
      await refetch();

      return true;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete profile picture';

      setUploadState(prev => ({
        ...prev,
        uploading: false,
        error: errorMessage
      }));

      return false;
    }
  }, [profile?.avatar_url, refetch]);

  const validateFile = useCallback(async (file: File) => {
    return validateImageFile(file);
  }, []);

  const clearError = useCallback(() => {
    setUploadState(prev => ({ ...prev, error: null }));
  }, []);

  const clearSuccess = useCallback(() => {
    setUploadState(prev => ({ ...prev, success: false }));
  }, []);

  return {
    uploadState,
    uploadProfilePicture: uploadPicture,
    deleteProfilePicture: deletePicture,
    validateFile,
    clearError,
    clearSuccess
  };
}

/**
 * Hook for handling drag and drop file uploads
 */
export function useImageDropzone(onFileSelect: (file: File) => void) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));

    if (imageFile) {
      onFileSelect(imageFile);
    }
  }, [onFileSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  }, [onFileSelect]);

  return {
    isDragOver,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileInput
  };
}