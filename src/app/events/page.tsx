import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import EventsPageClient from './EventsPageClient';

export default async function EventsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  return <EventsPageClient userId={user.id} />;
}


