# Profile Display Components

This directory contains React components for displaying user profile information with real data integration and fallback states.

## Components

### `ProfileHeader`
Displays the main profile header with user information, photo, and key details.

**Features:**
- Auto-generates display name from stage name, full name, or email
- Shows profile picture or initials fallback
- Displays headliner/bio badge with smart fallbacks
- Shows location, experience, and availability status
- Lists instruments and genres
- Loading and error states

**Usage:**
```tsx
import { ProfileHeader } from '@/components/profile';

function ProfilePage() {
  return <ProfileHeader initialData={userWithProfile} />;
}
```

### `ProfileAbout`
Displays the user's bio and additional profile information.

**Features:**
- Shows user bio with fallback generation from available data
- Displays professional details (rates, travel distance, availability)
- Shows contact preferences and links
- Prompts for profile completion when bio is missing
- Loading and error states

**Usage:**
```tsx
import { ProfileAbout } from '@/components/profile';

function ProfilePage() {
  return <ProfileAbout initialData={userWithProfile} />;
}
```

### `ProfileCompletion`
Shows profile completion progress and missing fields.

**Features:**
- Calculates completion percentage based on essential fields
- Color-coded progress bar (red < 50%, yellow < 80%, green ≥ 80%)
- Lists missing fields as badges
- Shows completion celebration when 100% complete
- Links to profile edit page
- Loading states

**Usage:**
```tsx
import { ProfileCompletion } from '@/components/profile';

function ProfilePage() {
  return <ProfileCompletion initialData={userWithProfile} />;
}
```

### `EmptyProfileSection`
Placeholder component for sections without data.

**Features:**
- Type-specific placeholders (performances, experience, featured)
- Consistent design with call-to-action buttons
- Custom icons for each section type
- Links to profile edit page

**Usage:**
```tsx
import { EmptyProfileSection } from '@/components/profile';

function ProfilePage() {
  return (
    <>
      <EmptyProfileSection type="featured" />
      <EmptyProfileSection type="experience" />
      <EmptyProfileSection type="performances" />
    </>
  );
}
```

### `ProfilePlaceholder`
Generic placeholder component for empty sections.

**Usage:**
```tsx
import { ProfilePlaceholder } from '@/components/profile';

function CustomSection() {
  return (
    <ProfilePlaceholder
      title="Custom Section"
      description="Add your custom content here."
      actionText="Add Content"
      actionHref="/custom/edit"
      icon={<CustomIcon />}
    />
  );
}
```

## Data Integration

All components use the `useProfileData` hook for real-time data management:

- **Initial Data**: Server-side rendered data passed as props
- **Client Hydration**: Hook takes over for real-time updates
- **Loading States**: Smooth transitions from server to client data
- **Error Handling**: Graceful fallbacks when data loading fails

## Fallback Strategies

### Profile Header
- **Display Name**: stage_name → full_name → email username
- **Headliner**: headliner → generated from instruments/location → "Musician"
- **Profile Picture**: avatar_url → initials → default

### Profile About
- **Bio**: real bio → generated from available fields → welcome message
- **Missing Data**: Helpful prompts with completion guidance

### Smart Defaults
Components intelligently generate meaningful content from available data:
- Combines instruments and location for headliners
- Creates bio from experience and specialization
- Shows availability and professional status

## Styling

Components use:
- **Tailwind CSS** for consistent styling
- **Brand Color**: `#7823E1` for primary actions and highlights
- **Responsive Design**: Mobile-first approach with breakpoints
- **Loading States**: Smooth skeleton animations
- **Accessibility**: Proper ARIA labels and keyboard navigation

## Performance

- **Server-Side Rendering**: Initial data loaded on server
- **Progressive Enhancement**: Client-side hooks enhance functionality
- **Optimistic Updates**: Immediate feedback for user interactions
- **Efficient Re-renders**: Memoized components and callbacks

## Error States

All components handle:
- **Network Errors**: Connection failures with retry options
- **Data Errors**: Invalid or missing profile data
- **Authentication Errors**: Redirect to login when needed
- **Graceful Degradation**: Functional components even with errors

## Future Enhancements

Planned features:
- **Profile Editing**: Inline editing capabilities
- **Media Upload**: Photo and video management
- **Social Integration**: Connect external profiles
- **Performance Tracking**: Analytics for profile views