import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getServerUserWithProfile } from '@/lib/auth/utils';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ProfileAbout } from '@/components/profile/ProfileAbout';
import { createClient } from '@/lib/supabase/server';
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

  // If account is set to organization, fetch active organization to drive org layout sections
  let activeOrganization: any = null;
  if ((userWithProfile as any)?.account_type === 'organization' && (userWithProfile as any)?.active_organization_id) {
    const supabase = await createClient();
    const { data } = await supabase
      .from('organization_profiles')
      .select('*')
      .eq('id', (userWithProfile as any).active_organization_id)
      .single();
    activeOrganization = data;
  }

  const isOrganization = (userWithProfile as any)?.account_type === 'organization' && activeOrganization;

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

      {/* Header */}
      {isOrganization ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="mb-4">
            <div className="w-32 h-32 rounded-full bg-[#7823E1] text-white mx-auto flex items-center justify-center text-5xl font-bold">
              {(activeOrganization?.name || 'O').charAt(0).toUpperCase()}
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">{activeOrganization?.name || 'Organization'}</h1>
          {activeOrganization?.headliner ? (
            <div className="inline-block px-4 py-2 rounded-full text-sm font-medium text-white" style={{backgroundColor: '#7823E1'}}>
              {activeOrganization.headliner}
            </div>
          ) : (
            <div className="text-sm text-gray-500">Add a headliner in Edit Profile to highlight your org.</div>
          )}
        </div>
      ) : (
        <ProfileHeader initialData={userWithProfile} />
      )}

      {isOrganization ? (
        <>
          {/* Organization About */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">About</h2>
            <div className="text-gray-700 space-y-2">
              {activeOrganization?.headliner && (
                <div className="text-sm text-gray-600">{activeOrganization.headliner}</div>
              )}
              <div className="text-sm">{activeOrganization?.description || 'No description yet.'}</div>
              <div className="text-sm text-gray-600">
                {[activeOrganization?.address, activeOrganization?.city, activeOrganization?.state_province, activeOrganization?.postal_code, activeOrganization?.country]
                  .filter(Boolean)
                  .join(', ')}
              </div>
              {activeOrganization?.website_url && (
                <a className="text-sm text-blue-600 hover:text-blue-800" href={activeOrganization.website_url} target="_blank" rel="noreferrer">
                  {activeOrganization.website_url}
                </a>
              )}
            </div>
          </div>

          {/* Organization Details & Contact (mirrors artist layout) */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-900">Organization Details</h3>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Type:</span>
                  <span className="text-gray-900 capitalize">{activeOrganization?.organization_type || '—'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Accepts Bookings:</span>
                  <span className={`text-gray-900 ${activeOrganization?.accepts_bookings ? 'text-green-600' : 'text-gray-500'}`}>{activeOrganization?.accepts_bookings ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Hiring Musicians:</span>
                  <span className={`text-gray-900 ${activeOrganization?.hiring_musicians ? 'text-green-600' : 'text-gray-500'}`}>{activeOrganization?.hiring_musicians ? 'Yes' : 'No'}</span>
                </div>
                {Array.isArray(activeOrganization?.genres) && activeOrganization.genres.length > 0 && (
                  <div className="text-sm">
                    <span className="text-gray-600">Genres: </span>
                    <span className="text-gray-900">{activeOrganization.genres.join(', ')}</span>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-900">Contact</h3>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Email:</span>
                  <span className="text-gray-900">{activeOrganization?.email || '—'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Phone:</span>
                  <span className="text-gray-900">{activeOrganization?.phone_number || '—'}</span>
                </div>
                {activeOrganization?.website_url && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Website:</span>
                    <a className="text-blue-600 hover:text-blue-800 truncate max-w-[220px]" href={activeOrganization.website_url} target="_blank" rel="noreferrer">
                      {activeOrganization.website_url.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Organization Performances */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Major Performances</h2>
            {/* Simple server-side read; client edit is in the editor page */}
            {/* We keep this resilient if the table isn't migrated yet */}
            {/* @ts-expect-error */}
            <OrgPerformancesServer orgId={activeOrganization.id} />
          </div>
        </>
      ) : (
        <>
          {/* Artist Profile Sections */}
          <ProfileCompletion initialData={userWithProfile} />
          <ProfileAbout initialData={userWithProfile} />
          <EmptyProfileSection type="featured" />
          <ExperienceSection isOwner={true} userId={userWithProfile.id} />
          <PerformanceSection isOwner={true} userId={userWithProfile.id} />
        </>
      )}
    </div>
  );
}

// Minimal server component to render organization performances list
async function OrgPerformancesServer({ orgId }: { orgId: string }) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('organization_performances')
      .select('*')
      .eq('organization_id', orgId)
      .order('performance_date', { ascending: false });
    if (error) throw error;
    const perfs = (data || []) as any[];
    if (perfs.length === 0) {
      return <div className="text-sm text-gray-600">No performances published yet.</div> as any;
    }
    return (
      <ul className="divide-y">{
        perfs.map((p) => (
          <li key={p.id} className="py-3">
            <div className="font-medium text-gray-900">{p.title}</div>
            <div className="text-sm text-gray-600">{
              [p.performance_date ? new Date(p.performance_date).toLocaleDateString() : null, p.venue]
                .filter(Boolean)
                .join(' • ')
            }</div>
            {p.description && <div className="text-sm text-gray-600">{p.description}</div>}
          </li>
        ))
      }</ul>
    ) as any;
  } catch {
    return <div className="text-sm text-gray-600">Organization details unavailable.</div> as any;
  }
}