'use client';

import Link from 'next/link';
import { useProfileData } from '@/hooks';
import type { UserWithProfile } from '@/types/database';

interface ProfileCompletionProps {
  initialData?: UserWithProfile | null;
}

export function ProfileCompletion({ initialData }: ProfileCompletionProps) {
  const { profile, completionPercentage, missingFields, loading } = useProfileData();
  
  // Use provided initial data if profile is still loading
  const displayProfile = profile || initialData;
  const displayPercentage = profile ? completionPercentage : calculateInitialCompletion(initialData || null);
  const displayMissing = profile ? missingFields : getInitialMissingFields(initialData || null);
  
  if (loading && !initialData) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-2 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (displayPercentage >= 100) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-green-800">Profile Complete!</h3>
            <p className="text-green-600">Your profile is looking great. Keep it updated with your latest achievements.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Profile Completion</h3>
        <span className="text-sm font-medium text-gray-600">{displayPercentage}%</span>
      </div>
      
      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
        <div 
          className="h-2 rounded-full transition-all duration-300"
          style={{
            width: `${displayPercentage}%`,
            backgroundColor: displayPercentage < 50 ? '#EF4444' : displayPercentage < 80 ? '#F59E0B' : '#10B981'
          }}
        ></div>
      </div>
      
      {displayMissing.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Complete these fields to improve your profile:
          </p>
          <div className="flex flex-wrap gap-2">
            {displayMissing.map((field) => (
              <span 
                key={field}
                className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800"
              >
                {field}
              </span>
            ))}
          </div>
          <Link
            href="/profile/edit"
            className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium text-white transition-colors mt-4"
            style={{backgroundColor: '#7823E1'}}
          >
            Complete Profile
            <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      )}
    </div>
  );
}

function calculateInitialCompletion(userWithProfile: UserWithProfile | null): number {
  if (!userWithProfile?.individual_profile) return 0;
  
  const ip = userWithProfile.individual_profile;
  const totalFields = 6;
  let completedFields = 0;
  
  if (ip.stage_name) completedFields++;
  if (ip.primary_instrument) completedFields++;
  if (ip.bio) completedFields++;
  if (ip.location) completedFields++;
  if (ip.instruments && ip.instruments.length > 0) completedFields++;
  if (ip.genres && ip.genres.length > 0) completedFields++;
  
  return Math.round((completedFields / totalFields) * 100);
}

function getInitialMissingFields(userWithProfile: UserWithProfile | null): string[] {
  if (!userWithProfile?.individual_profile) return ['Stage Name', 'Primary Instrument', 'Bio', 'Location', 'Instruments', 'Genres'];
  
  const ip = userWithProfile.individual_profile;
  const missing: string[] = [];
  
  if (!ip.stage_name) missing.push('Stage Name');
  if (!ip.primary_instrument) missing.push('Primary Instrument');
  if (!ip.bio) missing.push('Bio');
  if (!ip.location) missing.push('Location');
  if (!ip.instruments || ip.instruments.length === 0) missing.push('Instruments');
  if (!ip.genres || ip.genres.length === 0) missing.push('Genres');
  
  return missing;
}