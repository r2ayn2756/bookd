import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import CreateEventPageClient from './CreateEventPageClient';

export default async function CreateEventPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  return <CreateEventPageClient />;
}


