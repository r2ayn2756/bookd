"use client";
import { useState } from 'react';
import type { UserWithProfile } from '@/types/database';
import { ProfilePictureUpload } from '@/components/profile/ProfilePictureUpload';
import { 
  BasicInfoForm,
  ProfessionalInfoForm,
  SocialLinksForm,
  ExperiencePerformancesSection,
  AccountTypeSection,
  OrganizationEditForm,
} from '@/components/profile/edit';
import { OrganizationEditPlaceholder } from '@/components/profile/edit/OrganizationEditPlaceholder';

export default function ProfileEditClient({ initialUser }: { initialUser: UserWithProfile }) {
  const [accountType, setAccountType] = useState<'artist' | 'organization'>(initialUser.account_type ?? 'artist');

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Profile Picture Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Profile Picture</h2>
        <div className="flex justify-center">
          <ProfilePictureUpload
            userWithProfile={initialUser}
            editable={true}
            size="xl"
            showUploadPrompt={true}
          />
        </div>
        <p className="text-center text-sm text-gray-500 mt-4">Upload a professional photo</p>
      </div>

      {/* Account Type */}
      <AccountTypeSection
        user={initialUser}
        onSaved={({ account_type }) => setAccountType(account_type)}
        onChange={(next) => setAccountType(next)}
        hideOrganizationPicker={true}
      />

      {accountType === 'organization' ? (
        <OrganizationEditForm userWithProfile={initialUser} />
      ) : (
        <>
          {/* Basic Information */}
          <BasicInfoForm userWithProfile={initialUser} />

          {/* Professional Information */}
          <ProfessionalInfoForm userWithProfile={initialUser} />

          {/* Social Media Links */}
          <SocialLinksForm userWithProfile={initialUser} />

          {/* Experience & Performances */}
          <ExperiencePerformancesSection userWithProfile={initialUser} />
        </>
      )}

      {/* Bottom Spacing */}
      <div className="h-8" />
    </div>
  );
}


