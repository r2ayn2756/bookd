import GoogleSignInButton from '@/components/GoogleSignInButton';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function Home() {
  try {
    const supabase = await createClient();
    
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      console.error('Error fetching user:', error);
      // Continue to show sign-in page if there's an auth error
    } else if (user) {
      redirect('/home');
    }
  } catch (error) {
    console.error('Unexpected error in Home page:', error);
    // Continue to show sign-in page if there's an unexpected error
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900'>
      <div className='max-w-md w-full space-y-8 p-8'>
        <div className='text-center'>
          <h1 className='text-4xl font-bold text-gray-900 dark:text-white mb-2'>
            Welcome to Bookd
          </h1>
          <p className='text-gray-600 dark:text-gray-400 mb-8'>
            Sign in to get started
          </p>
        </div>
        
        <div className='flex justify-center'>
          <GoogleSignInButton />
        </div>
      </div>
    </div>
  );
}

