import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getServerUserWithProfile } from '@/lib/auth/utils';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ProfileAbout } from '@/components/profile/ProfileAbout';
import { EmptyProfileSection } from '@/components/profile/ProfilePlaceholder';
import { ProfileCompletion } from '@/components/profile/ProfileCompletion';
import { ExperienceSection } from '@/components/profile/ExperienceSection';
import { PerformanceSection } from '@/components/profile/PerformanceSection';

export default async function ProfilePage() {
  // Get authenticated user with profile (auto-creates profile if needed)
  const userWithProfile = await getServerUserWithProfile();

  if (!userWithProfile) {
    redirect('/');
  }

  return (
    <div className="space-y-6">
      {/* Page Header with Edit Button */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
            <p className="text-gray-600 mt-1">Showcase your musical talents and connect with opportunities</p>
          </div>
          <Link
            href="/profile/edit"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Profile
          </Link>
        </div>
      </div>

      {/* Profile Header */}
      <ProfileHeader initialData={userWithProfile} />

      {/* Profile Completion */}
      <ProfileCompletion initialData={userWithProfile} />

      {/* About */}
      <ProfileAbout initialData={userWithProfile} />

      {/* Featured Performances */}
      <EmptyProfileSection type="featured" />

      {/* Experience */}
      <ExperienceSection isOwner={true} userId={userWithProfile.id} />

      {/* Performances */}
      <PerformanceSection isOwner={true} userId={userWithProfile.id} />
    </div>
  );
}