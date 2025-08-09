import { createClient } from '@/lib/supabase/client';
import type { 
  Database, 
  IndividualProfile
} from '@/types/database';

type SupabaseClient = ReturnType<typeof createClient>;

export class IndividualProfilesService {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
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
   * Get current user's individual profile
   */
  async getCurrentUserProfile(): Promise<IndividualProfile | null> {
    try {
      const { data: { user }, error: authError } = await this.supabase.auth.getUser();
      
      if (authError || !user) {
        return null;
      }

      return this.getIndividualProfile(user.id);
    } catch (error) {
      console.error('Error in getCurrentUserProfile:', error);
      return null;
    }
  }

  /**
   * Update individual profile
   */
  async updateIndividualProfile(userId: string, updates: Partial<IndividualProfile>): Promise<IndividualProfile | null> {
    try {
      console.log('Updating individual profile for user:', userId);
      console.log('Update data:', updates);
      
      // Remove fields that shouldn't be updated directly
      const { id, user_id, created_at, ...validUpdates } = updates;
      
      console.log('Valid updates after filtering:', validUpdates);

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
        console.error('Supabase error updating individual profile:', {
          error,
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw new Error(`Database error: ${error.message} (Code: ${error.code})`);
      }

      console.log('Individual profile update successful:', data);
      return data;
    } catch (error) {
      console.error('Error in updateIndividualProfile:', error);
      throw error;
    }
  }

  /**
   * Update current user's individual profile
   */
  async updateCurrentUserProfile(updates: Partial<IndividualProfile>): Promise<IndividualProfile | null> {
    try {
      console.log('Getting current user for profile update...');
      const { data: { user }, error: authError } = await this.supabase.auth.getUser();
      
      if (authError) {
        console.error('Auth error in profile update:', authError);
        throw new Error(`Authentication error: ${authError.message}`);
      }
      
      if (!user) {
        console.error('No user found for profile update');
        throw new Error('User not authenticated');
      }

      console.log('Updating profile for user ID:', user.id);
      return this.updateIndividualProfile(user.id, updates);
    } catch (error) {
      console.error('Error in updateCurrentUserProfile:', error);
      throw error;
    }
  }

  /**
   * Create a new individual profile for current user
   */
  async createIndividualProfile(): Promise<IndividualProfile | null> {
    try {
      const { data: { user }, error: authError } = await this.supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await this.supabase
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
   * Get or create individual profile for current user
   */
  async getOrCreateCurrentUserProfile(): Promise<IndividualProfile | null> {
    try {
      let profile = await this.getCurrentUserProfile();
      
      if (!profile) {
        profile = await this.createIndividualProfile();
      }
      
      return profile;
    } catch (error) {
      console.error('Error in getOrCreateCurrentUserProfile:', error);
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
   * Update profile completion status based on filled fields
   */
  async updateProfileCompletionStatus(): Promise<IndividualProfile | null> {
    try {
      const profile = await this.getCurrentUserProfile();
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
        return await this.updateCurrentUserProfile({
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

// Factory function for client-side usage
export function createIndividualProfilesService() {
  const supabase = createClient();
  return new IndividualProfilesService(supabase);
}

// Convenience functions for common operations
export async function getCurrentUserProfile() {
  const service = createIndividualProfilesService();
  return service.getCurrentUserProfile();
}

export async function updateCurrentUserProfile(updates: Partial<IndividualProfile>) {
  const service = createIndividualProfilesService();
  return service.updateCurrentUserProfile(updates);
}

export async function getOrCreateCurrentUserProfile() {
  const service = createIndividualProfilesService();
  return service.getOrCreateCurrentUserProfile();
}

export async function searchIndividualProfiles(options: Parameters<IndividualProfilesService['searchIndividualProfiles']>[0]) {
  const service = createIndividualProfilesService();
  return service.searchIndividualProfiles(options);
}