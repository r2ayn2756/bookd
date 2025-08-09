import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { GigsPageClient } from './GigsPageClient';

export default async function GigsPage() {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  return <GigsPageClient userId={user.id} />;
}