import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary/server';

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
    const { public_id } = await request.json();

    if (!public_id) {
      return NextResponse.json(
        { error: 'Public ID is required' },
        { status: 400 }
      );
    }

    // Delete image from Cloudinary
    try {
      const result = await cloudinary.uploader.destroy(public_id);
      
      if (result.result !== 'ok') {
        console.warn('Cloudinary deletion result:', result);
      }
    } catch (cloudinaryError) {
      console.error('Error deleting from Cloudinary:', cloudinaryError);
      // Don't fail the entire request if Cloudinary deletion fails
      // The user's avatar_url will still be cleared from the database
    }

    return NextResponse.json({ 
      success: true,
      message: 'Image deleted successfully'
    });

  } catch (error) {
    console.error('Error in delete-image API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}