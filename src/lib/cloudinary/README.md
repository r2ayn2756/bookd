# Profile Picture Management

This directory contains the complete profile picture management system with Cloudinary integration.

## Features

### 🖼️ Image Upload
- **Drag & Drop** support for easy file selection
- **Progress tracking** with real-time upload percentage
- **File validation** (type, size, dimensions)
- **Optimized storage** with automatic WebP conversion and face-focused cropping

### 🎨 Smart Fallbacks
- **Generated initials** for users without profile pictures
- **Consistent colors** based on user names
- **Multiple sizes** for different use cases

### 🔧 Integration
- **Cloudinary CDN** for fast, optimized image delivery
- **Database sync** with automatic avatar URL updates
- **Error handling** with user-friendly messages

## Usage Examples

### Basic Avatar Display
```tsx
import { Avatar } from '@/components/profile';

function UserCard({ user }) {
  return (
    <div className="flex items-center space-x-3">
      <Avatar userWithProfile={user} size="md" />
      <span>{user.full_name}</span>
    </div>
  );
}
```

### Profile Picture Upload
```tsx
import { ProfilePictureUpload } from '@/components/profile';

function ProfileEdit({ user }) {
  return (
    <div className="text-center">
      <ProfilePictureUpload 
        userWithProfile={user}
        editable={true}
        size="xl"
        showUploadPrompt={true}
      />
    </div>
  );
}
```

### Using the Upload Hook
```tsx
import { useProfilePictureUpload } from '@/hooks';

function CustomUploader() {
  const { uploadProfilePicture, uploadState } = useProfilePictureUpload();
  
  const handleFileSelect = async (file) => {
    const url = await uploadProfilePicture(file);
    if (url) {
      console.log('Upload successful:', url);
    }
  };
  
  return (
    <div>
      <input 
        type="file" 
        accept="image/*"
        onChange={(e) => handleFileSelect(e.target.files[0])}
      />
      {uploadState.uploading && (
        <p>Uploading... {uploadState.progress}%</p>
      )}
    </div>
  );
}
```

## Configuration

### Environment Variables
```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
```

### Upload Preset
The system uses the `PROFILE` preset which:
- Crops to 200x200 pixels
- Uses face detection for optimal cropping
- Converts to WebP format
- Applies automatic quality optimization

## File Structure

```
src/lib/cloudinary/
├── config.ts           # Cloudinary configuration and presets
├── upload.ts           # Upload utilities and validation
├── index.ts            # Exports
└── README.md          # This file

src/hooks/
└── useProfilePictureUpload.ts  # React hook for uploads

src/components/profile/
└── ProfilePictureUpload.tsx    # Upload component

src/app/api/profile/
├── update-avatar/route.ts      # API for updating avatar URLs
└── delete-image/route.ts       # API for deleting images
```

## API Endpoints

### POST `/api/profile/update-avatar`
Updates the user's avatar URL in the database.

**Request:**
```json
{
  "avatar_url": "https://res.cloudinary.com/...",
  "public_id": "profile_user123_1234567890"
}
```

### POST `/api/profile/delete-image`
Deletes an image from Cloudinary.

**Request:**
```json
{
  "public_id": "profile_user123_1234567890"
}
```

## Error Handling

The system handles various error scenarios:

- **File Validation Errors**: Invalid type, size, or dimensions
- **Network Errors**: Connection failures during upload
- **Server Errors**: Cloudinary or database issues
- **Authentication Errors**: Unauthorized access attempts

## Performance Optimizations

### Image Processing
- **Automatic WebP conversion** for smaller file sizes
- **Face-focused cropping** for better profile pictures
- **Quality optimization** based on content

### Caching
- **CDN delivery** through Cloudinary
- **Browser caching** with appropriate headers
- **Progressive loading** for smooth UX

### Upload Optimization
- **Client-side validation** before upload
- **Progress tracking** for user feedback
- **Automatic retry** for failed uploads

## Security Features

### File Validation
- Type checking (JPEG, PNG, WebP only)
- Size limits (5MB maximum)
- Dimension validation (minimum 100x100px)

### Authentication
- User authentication required for uploads
- Public ID scoping to prevent unauthorized access
- Database permission checks

### Sanitization
- Automatic file name sanitization
- Malicious content detection
- Safe URL generation

## Future Enhancements

Planned features:
- **Batch uploads** for multiple images
- **Image editing** (crop, rotate, filters)
- **Upload history** and version management
- **Advanced transformations** (backgrounds, effects)