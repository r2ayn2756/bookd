// Client-safe exports only
export {
  UPLOAD_PRESETS,
  DEFAULT_UPLOAD_OPTIONS,
  getUploadPreset,
  buildUploadUrl,
  type UploadOptions,
} from './config';
export {
  uploadProfilePicture,
  deleteProfilePicture,
  generateProfileImageUrl,
  validateImageFile,
  generateInitials,
  generateAvatarColor,
  UploadError,
  type CloudinaryUploadResponse,
  type ProfilePictureUploadOptions,
} from './upload';

// Note: For server-side cloudinary usage, import from './server'