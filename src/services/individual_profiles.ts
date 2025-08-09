import { createClient } from '@/lib/supabase/client';
import { createClient as createServerClient } from '@/lib/supabase/server';
import type { 
  Database, 
  IndividualProfile, 
  User
} from '@/types/database';

type SupabaseClient = ReturnType<typeof createClient>;

export class IndividualProfilesService {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  /**
   * Create a new individual profile for a user (auto-called on signup)
   */
  async createIndividualProfile(userId: string): Promise<IndividualProfile | null> {
    try {
      const { data, error } = await this.supabase
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

      if (error) {
        console.error('Error creating individual profile:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in createIndividualProfile:', error);
      throw error;
    }
  }

  /**
   * Get individual profile by user ID
   */
  async getIndividualProfile(userId: string): Promise<IndividualProfile | null> {
    try {
      const { data, error } = await this.supabase
        .from('individual_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No profile found - this is expected for new users
          return null;
        }
        console.error('Error fetching individual profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getIndividualProfile:', error);
      return null;
    }
  }

  /**
   * Update individual profile
   */
  async updateIndividualProfile(userId: string, updates: Partial<IndividualProfile>): Promise<IndividualProfile | null> {
    try {
      // Remove fields that shouldn't be updated directly
      const { id, user_id, created_at, ...validUpdates } = updates;

      const { data, error } = await this.supabase
        .from('individual_profiles')
        .update({
          ...validUpdates,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating individual profile:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in updateIndividualProfile:', error);
      throw error;
    }
  }

  /**
   * Get or create individual profile for a user
   * This ensures every user has a profile
   */
  async getOrCreateIndividualProfile(userId: string): Promise<IndividualProfile | null> {
    try {
      // Try to get existing profile first
      let profile = await this.getIndividualProfile(userId);
      
      // If no profile exists, create one
      if (!profile) {
        profile = await this.createIndividualProfile(userId);
      }
      
      return profile;
    } catch (error) {
      console.error('Error in getOrCreateIndividualProfile:', error);
      return null;
    }
  }

  /**
   * Search individual profiles by various criteria
   */
  async searchIndividualProfiles(options: {
    query?: string;
    instruments?: string[];
    genres?: string[];
    location?: string;
    lookingForGigs?: boolean;
    availableForHire?: boolean;
    verified?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<IndividualProfile[]> {
    try {
      let queryBuilder = this.supabase
        .from('individual_profiles')
        .select(`
          *,
          user:user_id(
            id,
            full_name,
            avatar_url
          )
        `);

      // Apply filters
      if (options.query) {
        queryBuilder = queryBuilder.or(
          `stage_name.ilike.%${options.query}%,bio.ilike.%${options.query}%,primary_instrument.ilike.%${options.query}%`
        );
      }

      if (options.instruments && options.instruments.length > 0) {
        queryBuilder = queryBuilder.overlaps('instruments', options.instruments);
      }

      if (options.genres && options.genres.length > 0) {
        queryBuilder = queryBuilder.overlaps('genres', options.genres);
      }

      if (options.location) {
        queryBuilder = queryBuilder.ilike('location', `%${options.location}%`);
      }

      if (options.lookingForGigs !== undefined) {
        queryBuilder = queryBuilder.eq('looking_for_gigs', options.lookingForGigs);
      }

      if (options.availableForHire !== undefined) {
        queryBuilder = queryBuilder.eq('available_for_hire', options.availableForHire);
      }

      if (options.verified !== undefined) {
        queryBuilder = queryBuilder.eq('verified', options.verified);
      }

      // Apply pagination
      const limit = options.limit || 20;
      const offset = options.offset || 0;
      queryBuilder = queryBuilder
        .limit(limit)
        .range(offset, offset + limit - 1);

      const { data, error } = await queryBuilder;

      if (error) {
        console.error('Error searching individual profiles:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in searchIndividualProfiles:', error);
      return [];
    }
  }

  /**
   * Delete individual profile
   */
  async deleteIndividualProfile(userId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('individual_profiles')
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.error('Error deleting individual profile:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteIndividualProfile:', error);
      throw error;
    }
  }

  /**
   * Update profile completion status based on filled fields
   */
  async updateProfileCompletionStatus(userId: string): Promise<IndividualProfile | null> {
    try {
      const profile = await this.getIndividualProfile(userId);
      if (!profile) return null;

      // Check if profile has essential fields filled
      const isComplete = !!(
        profile.stage_name &&
        profile.primary_instrument &&
        profile.bio &&
        profile.location &&
        profile.instruments && profile.instruments.length > 0 &&
        profile.genres && profile.genres.length > 0
      );

      if (profile.profile_complete !== isComplete) {
        return await this.updateIndividualProfile(userId, {
          profile_complete: isComplete
        });
      }

      return profile;
    } catch (error) {
      console.error('Error in updateProfileCompletionStatus:', error);
      return null;
    }
  }
}

// Factory functions for different contexts
export function createIndividualProfilesService() {
  const supabase = createClient();
  return new IndividualProfilesService(supabase);
}

export async function createServerIndividualProfilesService() {
  const supabase = await createServerClient();
  return new IndividualProfilesService(supabase);
}

// Convenience functions for common operations
export async function createIndividualProfile(userId: string) {
  const service = createIndividualProfilesService();
  return service.createIndividualProfile(userId);
}

export async function getIndividualProfile(userId: string) {
  const service = createIndividualProfilesService();
  return service.getIndividualProfile(userId);
}

export async function updateIndividualProfile(userId: string, updates: Partial<IndividualProfile>) {
  const service = createIndividualProfilesService();
  return service.updateIndividualProfile(userId, updates);
}

export async function getOrCreateIndividualProfile(userId: string) {
  const service = createIndividualProfilesService();
  return service.getOrCreateIndividualProfile(userId);
}