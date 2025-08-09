import { createClient } from '@/lib/supabase/client';
import type { 
  Database, 
  User, 
  IndividualProfile, 
  UserWithProfile
} from '@/types/database';

type SupabaseClient = ReturnType<typeof createClient>;

export class UsersService {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  /**
   * Search users by full name or stage name
   */
  async searchUsers(query: string, limit: number = 20, offset: number = 0): Promise<UserWithProfile[]> {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select(`
          *,
          individual_profile:individual_profiles(*)
        `)
        .or(`full_name.ilike.%${query}%,email.ilike.%${query}%,individual_profiles.stage_name.ilike.%${query}%`)
        .limit(limit)
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error searching users (client):', error);
        return [] as any;
      }

      return (data || []) as any;
    } catch (error) {
      console.error('Error in searchUsers (client):', error);
      return [] as any;
    }
  }

  /**
   * List recent users with profiles for discovery
   */
  async listUsers(limit: number = 24, offset: number = 0): Promise<UserWithProfile[]> {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select(`
          *,
          individual_profile:individual_profiles(*)
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error listing users (client):', error);
        return [] as any;
      }

      return (data || []) as any;
    } catch (error) {
      console.error('Error in listUsers (client):', error);
      return [] as any;
    }
  }

  /**
   * Get users that the current user follows (connections)
   */
  async listMyConnections(limit: number = 50, offset: number = 0): Promise<UserWithProfile[]> {
    try {
      // Get current user id
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) return [] as any;

      // Fetch followed users
      const { data, error } = await this.supabase
        .from('follows')
        .select(`
          followed_user:followed_user_id(
            *,
            individual_profile:individual_profiles(*)
          )
        `)
        .eq('follower_user_id', user.id)
        .eq('status', 'active')
        .not('followed_user_id', 'is', null)
        .limit(limit)
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error listing connections (client):', error);
        return [] as any;
      }

      return (data || []).map((r: any) => r.followed_user).filter(Boolean) as any;
    } catch (error) {
      console.error('Error in listMyConnections (client):', error);
      return [] as any;
    }
  }

  /**
   * Toggle follow/unfollow a user by id
   */
  async toggleFollowUser(targetUserId: string): Promise<boolean> {
    const { data, error } = await this.supabase.rpc('toggle_follow_user', {
      target_user_id: targetUserId,
    });
    if (error) {
      console.error('toggleFollowUser error:', error);
      throw error;
    }
    return Boolean(data);
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
   * Get current authenticated user with their individual profile
   * Auto-creates individual profile if it doesn't exist
   */
  async getCurrentUserWithProfile(): Promise<UserWithProfile | null> {
    try {
      const { data: { user }, error } = await this.supabase.auth.getUser();
      
      if (error || !user) {
        return null;
      }

      return this.getUserWithProfile(user.id);
    } catch (error) {
      console.error('Error in getCurrentUserWithProfile:', error);
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

      // If user exists but has no individual profile, create one
      if (data && !data.individual_profile) {
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
   * Update user data in the users table
   */
  async updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
    try {
      console.log('Updating user in users table for ID:', userId);
      console.log('User update data:', updates);
      
      // Remove fields that shouldn't be updated directly
      const { id, created_at, ...validUpdates } = updates;
      
      console.log('Valid user updates after filtering:', validUpdates);

      const { data, error } = await this.supabase
        .from('users')
        .update({
          ...validUpdates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('Supabase error updating user:', {
          error,
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw new Error(`Database error updating user: ${error.message} (Code: ${error.code})`);
      }

      console.log('User update successful:', data);
      return data;
    } catch (error) {
      console.error('Error in updateUser:', error);
      throw error;
    }
  }

  /**
   * Update current authenticated user's data
   */
  async updateCurrentUser(updates: Partial<User>): Promise<User | null> {
    try {
      console.log('Getting current user for update...');
      const { data: { user }, error: authError } = await this.supabase.auth.getUser();
      
      if (authError) {
        console.error('Auth error:', authError);
        throw new Error(`Authentication error: ${authError.message}`);
      }
      
      if (!user) {
        console.error('No user found');
        throw new Error('User not authenticated');
      }

      console.log('Updating user with ID:', user.id);
      return this.updateUser(user.id, updates);
    } catch (error) {
      console.error('Error in updateCurrentUser:', error);
      throw error;
    }
  }
}

// Factory function for client-side usage
export function createUsersService() {
  const supabase = createClient();
  return new UsersService(supabase);
}

// Convenience functions for common operations
export async function getCurrentUser() {
  const service = createUsersService();
  return service.getCurrentUser();
}

export async function getCurrentUserWithProfile() {
  const service = createUsersService();
  return service.getCurrentUserWithProfile();
}

export async function getUserWithProfile(userId: string) {
  const service = createUsersService();
  return service.getUserWithProfile(userId);
}

export async function updateCurrentUser(updates: Partial<User>) {
  const service = createUsersService();
  return service.updateCurrentUser(updates);
}