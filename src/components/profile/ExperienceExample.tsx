/**
 * Example integration of ExperienceSection in a profile page
 * This file demonstrates how to use the Experience components
 */

'use client';

import { ExperienceSection } from './ExperienceSection';
import type { UserWithProfile } from '@/types/database';

interface ProfileExperienceExampleProps {
  userWithProfile: UserWithProfile;
  isCurrentUser?: boolean;
}

export function ProfileExperienceExample({ 
  userWithProfile, 
  isCurrentUser = false 
}: ProfileExperienceExampleProps) {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Other profile sections would go here */}
      
      {/* Experience Section */}
      <ExperienceSection 
        isOwner={isCurrentUser}
        userId={userWithProfile.id}
      />
      
      {/* 
        Usage Notes:
        
        1. The ExperienceSection component handles all the experience management:
           - Displays experience entries in ExperienceCard components
           - Shows add/edit forms via ExperienceForm modal
           - Handles delete confirmations with ConfirmDialog
           - Manages loading and error states
           
        2. Key props:
           - isOwner: boolean - whether current user can edit (shows buttons)
           - userId: string - the user whose experiences to display
           
        3. The component automatically handles:
           - Loading experiences from the API
           - Form validation with date utilities
           - Optimistic updates
           - Error handling and user feedback
           
        4. Styling follows the existing profile component patterns:
           - White background with rounded corners and shadow
           - Consistent spacing and typography
           - Hover effects and transitions
           - Responsive design
           
        5. Accessibility features:
           - Proper ARIA labels and roles
           - Keyboard navigation support
           - Screen reader friendly
           - Focus management in modals
      */}
    </div>
  );
}

// Example of how to integrate into an existing profile page:
/*
export default function ProfilePage({ params }: { params: { userId: string } }) {
  const [userWithProfile, setUserWithProfile] = useState<UserWithProfile | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // ... loading logic ...
  
  const isCurrentUser = currentUser?.id === userWithProfile?.id;
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <ProfileHeader userWithProfile={userWithProfile} />
        <ProfileAbout userWithProfile={userWithProfile} />
        
        <!-- Add the Experience Section here -->
        <ExperienceSection 
          isOwner={isCurrentUser}
          userId={userWithProfile.id}
        />
        
        <!-- Other profile sections -->
      </div>
    </div>
  );
}
*/
