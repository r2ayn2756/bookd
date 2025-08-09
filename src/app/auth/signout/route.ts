import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    console.error('Error signing out:', error);
    const { origin } = new URL(request.url);
    return NextResponse.redirect(`${origin}/home`);
  }
  
  const { origin } = new URL(request.url);
  return NextResponse.redirect(`${origin}/`);
}