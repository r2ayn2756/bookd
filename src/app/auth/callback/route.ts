import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/home';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // Get the authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Check if user exists in our users table
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('id', user.id)
          .single();

        // If user doesn't exist in our users table, create them
        if (!existingUser) {
          try {
            // Create user in our users table
            await supabase
              .from('users')
              .insert({
                id: user.id,
                email: user.email!,
                full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
                avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
                google_id: user.user_metadata?.provider_id || user.user_metadata?.sub || null
              });

            // Create individual profile for the new user
            await supabase
              .from('individual_profiles')
              .insert({
                user_id: user.id,
                looking_for_gigs: true,
                available_for_hire: true,
                profile_complete: false,
                verified: false,
                total_performances: 0,
                average_rating: 0.0,
                social_links: {},
                availability: {}
              });
          } catch (createError) {
            console.error('Error creating user profile:', createError);
            // Continue to redirect even if profile creation fails
            // User can create profile later
          }
        }
      }
      
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}