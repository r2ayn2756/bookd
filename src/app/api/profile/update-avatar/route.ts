import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const { avatar_url, public_id } = await request.json();

    // Update user's avatar_url in the users table
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        avatar_url,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating user avatar:', updateError);
      return NextResponse.json(
        { error: 'Failed to update avatar' },
        { status: 500 }
      );
    }

    // Optionally store the public_id for future deletion
    // This could be stored in a separate table or as metadata
    if (public_id) {
      // For now, we'll just log it
      console.log('Avatar public_id for user', user.id, ':', public_id);
    }

    return NextResponse.json({ 
      success: true,
      message: 'Avatar updated successfully'
    });

  } catch (error) {
    console.error('Error in update-avatar API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}