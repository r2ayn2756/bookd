'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function FeedDebug() {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testDatabaseConnection = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      
      // Test 1: Check authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      console.log('Auth check:', { user: user?.id, authError });
      
      // Test 2: Check if posts table exists and has data
      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select('id, user_id, organization_id, content, created_at')
        .limit(5);
      
      console.log('Posts check:', { posts, postsError });
      
      // Test 3: Check if get_user_feed function exists
      const { data: feedData, error: feedError } = await supabase.rpc('get_user_feed', {
        p_user_id: user?.id || null,
        p_limit: 5,
        p_offset: 0
      });
      
      console.log('Feed function check:', { feedData, feedError });
      
      // Test 4: Check if users table exists
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, full_name')
        .eq('id', user?.id || '')
        .single();
      
      console.log('Users check:', { users, usersError });
      
      setDebugInfo({
        auth: { user: user?.id, authError },
        posts: { count: posts?.length, postsError },
        feed: { count: feedData?.length, feedError },
        users: { users, usersError }
      });
      
    } catch (error) {
      console.error('Debug test failed:', error);
      setDebugInfo({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
    setLoading(false);
  };

  const createTestPost = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('You must be logged in to create a test post');
        return;
      }

      const { data, error } = await supabase
        .from('posts')
        .insert([{
          user_id: user.id,
          content: 'This is a test post to verify the feed is working!',
          title: 'Test Post',
          post_type: 'general',
          visibility: 'public',
          is_published: true
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating test post:', error);
        alert('Error creating test post: ' + error.message);
      } else {
        console.log('Test post created:', data);
        alert('Test post created successfully!');
      }
    } catch (error) {
      console.error('Error creating test post:', error);
    }
    setLoading(false);
  };

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
      <h3 className="text-lg font-semibold text-yellow-800 mb-3">🐛 Feed Debug Panel</h3>
      
      <div className="space-x-2 mb-4">
        <button
          onClick={testDatabaseConnection}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? 'Testing...' : 'Test Database'}
        </button>
        
        <button
          onClick={createTestPost}
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
        >
          Create Test Post
        </button>
      </div>

      {debugInfo && (
        <div className="bg-white p-3 rounded border">
          <h4 className="font-semibold mb-2">Debug Results:</h4>
          <pre className="text-xs overflow-auto max-h-64">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}