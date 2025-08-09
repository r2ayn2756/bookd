import { createClient } from '@/lib/supabase/client';
import { createClient as createServerClient } from '@/lib/supabase/server';
import type { 
  Database, 
  User, 
  IndividualProfile, 
  UserWithProfile, 
  UserWithStats,
  OrganizationProfile,
  OrganizationWithStats
} from '@/types/database';

type SupabaseClient = ReturnType<typeof createClient>;

export class UsersService {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user }, error } = await this.supabase.auth.getUser();
      
      if (error || !user) {
        return null;
      }

      // Get full user data from our users table
      const { data: userData, error: userError } = await this.supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (userError) {
        console.error('Error fetching user data:', userError);
        return null;
      }

      return userData;
    } catch (error) {
      console.error('Error in getCurrentUser:', error);
      return null;
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<User | null> {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user by ID:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getUserById:', error);
      return null;
    }
  }

  /**
   * Get user with their individual profile
   * Auto-creates individual profile if it doesn't exist
   */
  async getUserWithProfile(userId: string): Promise<UserWithProfile | null> {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select(`
          *,
          individual_profile:individual_profiles(*)
        `)
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user with profile:', error);
        return null;
      }

      // If user exists but has no individual profile and account_type is artist, create one
      if (data && !data.individual_profile && (data as any).account_type !== 'organization') {
        try {
          const { data: newProfile } = await this.supabase
            .from('individual_profiles')
            .insert({
              user_id: userId,
              looking_for_gigs: true,
              available_for_hire: true,
              profile_complete: false,
              verified: false,
              total_performances: 0,
              average_rating: 0.0,
              social_links: {},
              availability: {}
            })
            .select()
            .single();

          // Attach the new profile to the user data
          if (newProfile) {
            data.individual_profile = newProfile;
          }
        } catch (profileError) {
          console.error('Error creating individual profile:', profileError);
          // Continue without profile rather than failing entirely
        }
      }

      return data as UserWithProfile;
    } catch (error) {
      console.error('Error in getUserWithProfile:', error);
      return null;
    }
  }

  /**
   * Get user with stats (followers, following, posts count)
   */
  async getUserWithStats(userId: string, currentUserId?: string): Promise<UserWithStats | null> {
    try {
      // Get basic user data
      const userData = await this.getUserWithProfile(userId);
      if (!userData) return null;

      // Get follower count
      const followerCount = await this.getUserFollowerCount(userId);
      
      // Get following count
      const followingCount = await this.getUserFollowingCount(userId);
      
      // Get posts count
      const { count: postsCount } = await this.supabase
        .from('posts')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .eq('is_published', true);

      // Check if current user is following this user
      let isFollowing = false;
      let isMutual = false;
      
      if (currentUserId && currentUserId !== userId) {
        isFollowing = await this.isFollowingUser(userId, currentUserId);
        
        // Check if it's mutual
        if (isFollowing) {
          isMutual = await this.isFollowingUser(currentUserId, userId);
        }
      }

      return {
        ...userData,
        follower_count: followerCount,
        following_count: followingCount,
        posts_count: postsCount || 0,
        is_following: isFollowing,
        is_mutual: isMutual
      } as UserWithStats;
    } catch (error) {
      console.error('Error in getUserWithStats:', error);
      return null;
    }
  }

  /**
   * Get multiple users by IDs
   */
  async getUsersByIds(userIds: string[]): Promise<User[]> {
    try {
      if (userIds.length === 0) return [];

      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .in('id', userIds);

      if (error) {
        console.error('Error fetching users by IDs:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUsersByIds:', error);
      return [];
    }
  }

  /**
   * Search users by name or stage name
   */
  async searchUsers(query: string, limit: number = 20, offset: number = 0): Promise<UserWithProfile[]> {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select(`
          *,
          individual_profile:individual_profiles(*)
        `)
        .or(`full_name.ilike.%${query}%,individual_profiles.stage_name.ilike.%${query}%`)
        .limit(limit)
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error searching users:', error);
        return [];
      }

      return data as UserWithProfile[] || [];
    } catch (error) {
      console.error('Error in searchUsers:', error);
      return [];
    }
  }

  /**
   * Update user profile
   */
  async updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating user:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in updateUser:', error);
      throw error;
    }
  }

  /**
   * Get user's follower count using database function
   */
  async getUserFollowerCount(userId: string): Promise<number> {
    try {
      const { data, error } = await this.supabase.rpc('get_user_follower_count', {
        target_user_id: userId
      });

      if (error) {
        console.error('Error getting follower count:', error);
        return 0;
      }

      return data || 0;
    } catch (error) {
      console.error('Error in getUserFollowerCount:', error);
      return 0;
    }
  }

  /**
   * Get user's following count using database function
   */
  async getUserFollowingCount(userId: string): Promise<number> {
    try {
      const { data, error } = await this.supabase.rpc('get_user_following_count', {
        target_user_id: userId
      });

      if (error) {
        console.error('Error getting following count:', error);
        return 0;
      }

      return data || 0;
    } catch (error) {
      console.error('Error in getUserFollowingCount:', error);
      return 0;
    }
  }

  /**
   * Check if current user is following another user
   */
  async isFollowingUser(targetUserId: string, currentUserId?: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase.rpc('is_following_user', {
        target_user_id: targetUserId,
        current_user_id: currentUserId
      });

      if (error) {
        console.error('Error checking follow status:', error);
        return false;
      }

      return data || false;
    } catch (error) {
      console.error('Error in isFollowingUser:', error);
      return false;
    }
  }

  /**
   * Toggle follow/unfollow a user
   */
  async toggleFollowUser(targetUserId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase.rpc('toggle_follow_user', {
        target_user_id: targetUserId
      });

      if (error) {
        console.error('Error toggling follow:', error);
        throw error;
      }

      return data; // Returns true if now following, false if unfollowed
    } catch (error) {
      console.error('Error in toggleFollowUser:', error);
      throw error;
    }
  }

  /**
   * Get user's followers
   */
  async getUserFollowers(userId: string, limit: number = 20, offset: number = 0): Promise<User[]> {
    try {
      const { data, error } = await this.supabase
        .from('follows')
        .select(`
          follower_user:follower_user_id(
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('followed_user_id', userId)
        .eq('status', 'active')
        .limit(limit)
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching followers:', error);
        return [];
      }

      return (data || []).map((item: any) => item.follower_user as User).filter(Boolean);
    } catch (error) {
      console.error('Error in getUserFollowers:', error);
      return [];
    }
  }

  /**
   * Get users that this user is following
   */
  async getUserFollowing(userId: string, limit: number = 20, offset: number = 0): Promise<User[]> {
    try {
      const { data, error } = await this.supabase
        .from('follows')
        .select(`
          followed_user:followed_user_id(
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('follower_user_id', userId)
        .eq('status', 'active')
        .not('followed_user_id', 'is', null)
        .limit(limit)
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching following:', error);
        return [];
      }

      return (data || []).map((item: any) => item.followed_user as User).filter(Boolean);
    } catch (error) {
      console.error('Error in getUserFollowing:', error);
      return [];
    }
  }
}

// Organization-related functions
export class OrganizationsService {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  /**
   * Get organization by ID
   */
  async getOrganizationById(orgId: string): Promise<OrganizationProfile | null> {
    try {
      const { data, error } = await this.supabase
        .from('organization_profiles')
        .select('*')
        .eq('id', orgId)
        .single();

      if (error) {
        console.error('Error fetching organization:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getOrganizationById:', error);
      return null;
    }
  }

  /**
   * Get organization with stats
   */
  async getOrganizationWithStats(orgId: string, currentUserId?: string): Promise<OrganizationWithStats | null> {
    try {
      const orgData = await this.getOrganizationById(orgId);
      if (!orgData) return null;

      // Get follower count
      const { data: followerCount } = await this.supabase.rpc('get_organization_follower_count', {
        target_org_id: orgId
      });

      // Get posts count
      const { count: postsCount } = await this.supabase
        .from('posts')
        .select('id', { count: 'exact' })
        .eq('organization_id', orgId)
        .eq('is_published', true);

      // Get gigs count
      const { count: gigsCount } = await this.supabase
        .from('gigs')
        .select('id', { count: 'exact' })
        .eq('posted_by_organization_id', orgId);

      // Check if current user is following this organization
      let isFollowing = false;
      if (currentUserId) {
        const { data } = await this.supabase.rpc('is_following_organization', {
          target_org_id: orgId,
          current_user_id: currentUserId
        });
        isFollowing = data || false;
      }

      return {
        ...orgData,
        follower_count: followerCount || 0,
        posts_count: postsCount || 0,
        gigs_count: gigsCount || 0,
        is_following: isFollowing
      } as OrganizationWithStats;
    } catch (error) {
      console.error('Error in getOrganizationWithStats:', error);
      return null;
    }
  }

  /**
   * List organizations where the given user is an active admin
   */
  async listOrganizationsForUserAdmin(userId: string): Promise<OrganizationProfile[]> {
    try {
      const { data, error } = await this.supabase
        .from('org_admins')
        .select(`organization_profiles:organization_id(*)`)
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) {
        console.error('Error listing user organizations:', error);
        return [];
      }

      return (data || [])
        .map((r: any) => r.organization_profiles as OrganizationProfile)
        .filter(Boolean);
    } catch (error) {
      console.error('Error in listOrganizationsForUserAdmin:', error);
      return [];
    }
  }
}

// Factory functions for different contexts
export function createUsersService() {
  const supabase = createClient();
  return new UsersService(supabase);
}

export async function createServerUsersService() {
  const supabase = await createServerClient();
  return new UsersService(supabase);
}

export function createOrganizationsService() {
  const supabase = createClient();
  return new OrganizationsService(supabase);
}

export async function createServerOrganizationsService() {
  const supabase = await createServerClient();
  return new OrganizationsService(supabase);
}

// Convenience functions for common operations
export async function getCurrentUser() {
  const service = createUsersService();
  return service.getCurrentUser();
}

export async function getUserById(userId: string) {
  const service = createUsersService();
  return service.getUserById(userId);
}

export async function getUserWithProfile(userId: string) {
  const service = createUsersService();
  return service.getUserWithProfile(userId);
}

export async function toggleFollowUser(targetUserId: string) {
  const service = createUsersService();
  return service.toggleFollowUser(targetUserId);
}