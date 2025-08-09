// Client-safe configuration (no Node.js imports)

// Upload presets configuration
export const UPLOAD_PRESETS = {
  // Profile pictures - small, optimized for avatars
  PROFILE: {
    preset: 'profile_pictures',
    transformation: {
      width: 200,
      height: 200,
      crop: 'fill',
      gravity: 'face',
      quality: 'auto',
      format: 'webp',
    },
  },
  
  // Book covers - medium size, optimized for book thumbnails
  BOOK_COVER: {
    preset: 'book_covers',
    transformation: {
      width: 400,
      height: 600,
      crop: 'fill',
      gravity: 'center',
      quality: 'auto',
      format: 'webp',
    },
  },
  
  // General images - flexible sizing
  GENERAL: {
    preset: 'general_images',
    transformation: {
      width: 800,
      height: 600,
      crop: 'limit',
      quality: 'auto',
      format: 'webp',
    },
  },
  
  // Large images - for detailed views
  LARGE: {
    preset: 'large_images',
    transformation: {
      width: 1200,
      height: 800,
      crop: 'limit',
      quality: 'auto',
      format: 'webp',
    },
  },
} as const;

// Upload options type
export interface UploadOptions {
  preset?: keyof typeof UPLOAD_PRESETS;
  folder?: string;
  public_id?: string;
  tags?: string[];
  overwrite?: boolean;
}

// Default upload options
export const DEFAULT_UPLOAD_OPTIONS: UploadOptions = {
  preset: 'GENERAL',
  folder: 'bookd',
  overwrite: false,
};

// Helper function to get upload preset configuration
export function getUploadPreset(presetKey: keyof typeof UPLOAD_PRESETS) {
  return UPLOAD_PRESETS[presetKey];
}

// Helper function to build upload URL for client-side uploads
export function buildUploadUrl() {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  
  if (!cloudName) {
    throw new Error('Cloudinary cloud name is not configured');
  }
  
  return `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
}