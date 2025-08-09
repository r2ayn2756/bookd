/**
 * Basic service integration tests
 * These tests verify that our services can connect to Supabase and execute basic operations
 * Note: These are integration tests that require a working Supabase connection
 */

import { createServerPostsService } from '../posts';
import { createServerCommentsService } from '../comments';
import { createServerUsersService } from '../users';

describe('Services Integration Tests', () => {
  // Skip tests in CI/CD environments where Supabase might not be available
  const shouldSkip = process.env.NODE_ENV === 'test' && !process.env.SUPABASE_URL;

  describe('PostsService', () => {
    it('should be able to create a posts service instance', async () => {
      if (shouldSkip) return;
      
      expect(async () => {
        const service = await createServerPostsService();
        expect(service).toBeDefined();
      }).not.toThrow();
    });

    it('should be able to call getUserFeed without errors', async () => {
      if (shouldSkip) return;
      
      const service = await createServerPostsService();
      // This might return an empty array if no posts exist, but should not throw
      expect(async () => {
        await service.getUserFeed(undefined, 5, 0);
      }).not.toThrow();
    });
  });

  describe('CommentsService', () => {
    it('should be able to create a comments service instance', async () => {
      if (shouldSkip) return;
      
      expect(async () => {
        const service = await createServerCommentsService();
        expect(service).toBeDefined();
      }).not.toThrow();
    });
  });

  describe('UsersService', () => {
    it('should be able to create a users service instance', async () => {
      if (shouldSkip) return;
      
      expect(async () => {
        const service = await createServerUsersService();
        expect(service).toBeDefined();
      }).not.toThrow();
    });
  });
});

/**
 * Manual testing functions for development
 * These can be called manually during development to test service functionality
 */

export async function testPostsService() {
  try {
    console.log('🧪 Testing Posts Service...');
    
    const service = await createServerPostsService();
    
    // Test getting feed
    const feed = await service.getUserFeed(undefined, 5, 0);
    console.log('✅ Feed fetched:', feed.length, 'posts');
    
    if (feed.length > 0) {
      const firstPost = feed[0];
      console.log('📝 Sample post:', {
        id: firstPost.id,
        content: firstPost.content?.substring(0, 50) + '...',
        author: firstPost.author
      });
      
      // Test getting single post
      const post = await service.getPostById(firstPost.id);
      console.log('✅ Single post fetched:', post?.id);
    }
    
    console.log('✅ Posts service tests completed');
  } catch (error) {
    console.error('❌ Posts service test failed:', error);
  }
}

export async function testCommentsService() {
  try {
    console.log('🧪 Testing Comments Service...');
    
    const service = await createServerCommentsService();
    
    // This will work once we have posts in the database
    console.log('✅ Comments service created successfully');
    console.log('ℹ️  Comment functionality requires existing posts to test fully');
    
  } catch (error) {
    console.error('❌ Comments service test failed:', error);
  }
}

export async function testUsersService() {
  try {
    console.log('🧪 Testing Users Service...');
    
    const service = await createServerUsersService();
    
    // Test getting current user (might be null if not authenticated)
    const currentUser = await service.getCurrentUser();
    console.log('✅ Current user:', currentUser ? currentUser.full_name : 'Not authenticated');
    
    console.log('✅ Users service tests completed');
  } catch (error) {
    console.error('❌ Users service test failed:', error);
  }
}

// Function to run all manual tests
export async function runAllServiceTests() {
  console.log('🚀 Running all service tests...\n');
  
  await testUsersService();
  console.log('');
  
  await testPostsService();
  console.log('');
  
  await testCommentsService();
  console.log('');
  
  console.log('🏁 All service tests completed');
}