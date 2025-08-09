'use client';

import { useState } from 'react';
import { SimpleExperienceSection } from './SimpleExperienceSection';
import { SimplePerformanceSection } from './SimplePerformanceSection';
import type { UserWithProfile } from '@/types/database';

interface ExperiencePerformancesSectionProps {
  userWithProfile: UserWithProfile;
}

export function ExperiencePerformancesSection({ userWithProfile }: ExperiencePerformancesSectionProps) {
  const [activeTab, setActiveTab] = useState<'experience' | 'performances'>('experience');

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('experience')}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
            activeTab === 'experience'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Work Experience
        </button>
        <button
          onClick={() => setActiveTab('performances')}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
            activeTab === 'performances'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Past Performances
        </button>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'experience' && (
          <SimpleExperienceSection userWithProfile={userWithProfile} />
        )}

        {activeTab === 'performances' && (
          <SimplePerformanceSection userWithProfile={userWithProfile} />
        )}
      </div>
    </div>
  );
}
