import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ProfileAbout } from '@/components/profile/ProfileAbout';
import { ExperienceSection } from '@/components/profile/ExperienceSection';
import { PerformanceSection } from '@/components/profile/PerformanceSection';

interface Params {
  params: { id: string };
}

export default async function PublicProfilePage({ params }: Params) {
  const supabase = await createClient();
  const { data: { user: currentUser } } = await supabase.auth.getUser();

  if (!currentUser) {
    redirect('/');
  }

  const userId = params.id;

  // Fetch the target user's data with profile
  const { data, error } = await supabase
    .from('users')
    .select(`
      *,
      individual_profile:individual_profiles(*)
    `)
    .eq('id', userId)
    .single();

  if (error || !data) {
    notFound();
  }

  const initialData: any = data;

  const isOwner = currentUser.id === userId;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
            <p className="text-gray-600 mt-1">Musician details and contact</p>
          </div>
        </div>
      </div>

      {/* Profile sections re-used with initialData */}
      <ProfileHeader initialData={initialData} forceData={initialData} />
      <ProfileAbout initialData={initialData} forceData={initialData} isOwner={isOwner} />

      {/* Experience and Performances shown for target user */}
      <ExperienceSection isOwner={isOwner} userId={userId} />
      <PerformanceSection isOwner={isOwner} userId={userId} />
    </div>
  );
}


