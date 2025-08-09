'use client';

import { useState, useRef } from 'react';
import { useProfilePictureUpload, useImageDropzone } from '@/hooks/useProfilePictureUpload';
import { generateInitials, generateAvatarColor } from '@/lib/cloudinary/upload';
import type { UserWithProfile } from '@/types/database';

interface ProfilePictureUploadProps {
  userWithProfile: UserWithProfile;
  editable?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showUploadPrompt?: boolean;
}

const sizeClasses = {
  sm: 'w-16 h-16 text-lg',
  md: 'w-24 h-24 text-xl',
  lg: 'w-32 h-32 text-4xl',
  xl: 'w-40 h-40 text-5xl'
};

export function ProfilePictureUpload({ 
  userWithProfile, 
  editable = true, 
  size = 'lg',
  showUploadPrompt = true 
}: ProfilePictureUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const {
    uploadState,
    uploadProfilePicture,
    deleteProfilePicture,
    validateFile,
    clearError,
    clearSuccess
  } = useProfilePictureUpload();

  const handleFileSelect = async (file: File) => {
    clearError();
    clearSuccess();
    
    // Validate file
    const validation = await validateFile(file);
    if (!validation.valid) {
      return;
    }

    // Create preview
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    // Upload file
    const uploadedUrl = await uploadProfilePicture(file);
    
    // Clean up preview URL
    URL.revokeObjectURL(url);
    setPreviewUrl(null);

    if (uploadedUrl) {
      // Success - the profile will be updated automatically
    }
  };

  const {
    isDragOver,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileInput
  } = useImageDropzone(handleFileSelect);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleDeletePicture = async () => {
    if (window.confirm('Are you sure you want to delete your profile picture?')) {
      await deleteProfilePicture();
    }
  };

  const getDisplayName = () => {
    return userWithProfile.individual_profile?.stage_name || 
           userWithProfile.full_name || 
           userWithProfile.email?.split('@')[0] || 
           'User';
  };

  const getInitials = () => {
    return generateInitials(getDisplayName());
  };

  const getAvatarColor = () => {
    return generateAvatarColor(getDisplayName());
  };

  const currentAvatarUrl = userWithProfile.avatar_url || previewUrl;

  if (!editable) {
    // Read-only display
    return (
      <div className={`${sizeClasses[size]} rounded-full flex items-center justify-center overflow-hidden`}>
        {currentAvatarUrl ? (
          <img 
            src={currentAvatarUrl} 
            alt={getDisplayName()}
            className="w-full h-full object-cover"
          />
        ) : (
          <div 
            className="w-full h-full flex items-center justify-center text-white font-semibold"
            style={{ backgroundColor: getAvatarColor() }}
          >
            {getInitials()}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Profile Picture Display/Upload Area */}
      <div
        className={`
          ${sizeClasses[size]} rounded-full relative cursor-pointer group overflow-hidden border-4 border-white shadow-lg
          ${isDragOver ? 'ring-4 ring-blue-500 ring-opacity-50' : ''}
          ${uploadState.uploading ? 'pointer-events-none' : ''}
        `}
        onClick={handleUploadClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Current Avatar or Initials */}
        {currentAvatarUrl ? (
          <img 
            src={currentAvatarUrl} 
            alt={getDisplayName()}
            className="w-full h-full object-cover"
          />
        ) : (
          <div 
            className="w-full h-full flex items-center justify-center text-white font-semibold"
            style={{ backgroundColor: getAvatarColor() }}
          >
            {getInitials()}
          </div>
        )}

        {/* Upload Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="text-center text-white">
            <svg className="w-8 h-8 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="text-xs font-medium">
              {currentAvatarUrl ? 'Change' : 'Upload'}
            </p>
          </div>
        </div>

        {/* Upload Progress */}
        {uploadState.uploading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-1"></div>
              <p className="text-xs font-medium">{uploadState.progress}%</p>
            </div>
          </div>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInput}
        className="hidden"
      />

      {/* Upload Instructions */}
      {showUploadPrompt && !currentAvatarUrl && (
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-2">
            Click to upload or drag and drop
          </p>
          <p className="text-xs text-gray-500">
            PNG, JPG or WebP up to 5MB
          </p>
        </div>
      )}

      {/* Action Buttons */}
      {currentAvatarUrl && !uploadState.uploading && (
        <div className="flex space-x-2">
          <button
            onClick={handleUploadClick}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Change Photo
          </button>
          <button
            onClick={handleDeletePicture}
            className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Remove
          </button>
        </div>
      )}

      {/* Error Display */}
      {uploadState.error && (
        <div className="flex items-center space-x-2 text-red-600 bg-red-50 px-3 py-2 rounded-md">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm">{uploadState.error}</span>
          <button
            onClick={clearError}
            className="text-red-400 hover:text-red-600"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Success Display */}
      {uploadState.success && (
        <div className="flex items-center space-x-2 text-green-600 bg-green-50 px-3 py-2 rounded-md">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm">Profile picture updated!</span>
          <button
            onClick={clearSuccess}
            className="text-green-400 hover:text-green-600"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Simple avatar component for display-only use cases
 */
interface AvatarProps {
  userWithProfile: UserWithProfile;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
  className?: string;
}

const avatarSizeClasses = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-12 h-12 text-base',
  lg: 'w-16 h-16 text-lg',
  xl: 'w-24 h-24 text-xl',
  xxl: 'w-32 h-32 text-2xl'
};

export function Avatar({ userWithProfile, size = 'md', className = '' }: AvatarProps) {
  const getDisplayName = () => {
    return userWithProfile.individual_profile?.stage_name || 
           userWithProfile.full_name || 
           userWithProfile.email?.split('@')[0] || 
           'User';
  };

  const getInitials = () => {
    return generateInitials(getDisplayName());
  };

  const getAvatarColor = () => {
    return generateAvatarColor(getDisplayName());
  };

  return (
    <div className={`${avatarSizeClasses[size]} rounded-full flex items-center justify-center overflow-hidden ${className}`}>
      {userWithProfile.avatar_url ? (
        <img 
          src={userWithProfile.avatar_url} 
          alt={getDisplayName()}
          className="w-full h-full object-cover"
        />
      ) : (
        <div 
          className="w-full h-full flex items-center justify-center text-white font-semibold"
          style={{ backgroundColor: getAvatarColor() }}
        >
          {getInitials()}
        </div>
      )}
    </div>
  );
}