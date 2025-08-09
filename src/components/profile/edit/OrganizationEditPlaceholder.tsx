"use client";
import type { UserWithProfile } from '@/types/database';

export function OrganizationEditPlaceholder({ userWithProfile }: { userWithProfile: UserWithProfile }) {
  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-4">
      <h2 className="text-xl font-semibold text-gray-900">Organization Settings</h2>
      <p className="text-gray-600">
        You are editing as an organization. Organization-specific fields (name, description, location, contact, booking settings, etc.) will appear here.
      </p>
      <div className="text-sm text-gray-500">
        Instruments, genres, and availability status are hidden for organization accounts.
      </div>
      <div className="mt-4">
        <div className="inline-flex items-center gap-2 px-3 py-2 border rounded text-gray-700">
          Active organization:
          <span className="font-medium">
            {userWithProfile.active_organization_id ? 'Selected' : 'None selected'}
          </span>
        </div>
      </div>
    </div>
  );
}


