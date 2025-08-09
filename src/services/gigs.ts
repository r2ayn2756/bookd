import { createClient } from '@/lib/supabase/client';
import { createClient as createServerClient } from '@/lib/supabase/server';
import type { Database, Gig } from '@/types/database';

type SupabaseClient = ReturnType<typeof createClient>;

export interface GigWithAuthor extends Gig {
  author: {
    id: string;
    name: string;
    avatar_url?: string;
    type: 'user' | 'organization';
  } | null;
}

export interface GigFilters {
  instruments?: string[];
  genres?: string[];
  compensationType?: string;
  payRateMin?: number;
  payRateMax?: number;
  location?: string;
  gigType?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  searchQuery?: string;
}

export class GigsService {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  /**
   * Get gigs with optional filtering and pagination
   */
  async getGigs(
    filters: GigFilters = {},
    limit: number = 20,
    offset: number = 0
  ): Promise<GigWithAuthor[]> {
    try {
      let query = this.supabase
        .from('gigs')
        .select(`
          *,
          posted_by_user:posted_by_user_id(id, full_name, avatar_url),
          posted_by_organization:posted_by_organization_id(id, name, logo_url)
        `)
        .eq('status', filters.status || 'open')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.instruments && filters.instruments.length > 0) {
        query = query.overlaps('instruments_needed', filters.instruments);
      }

      if (filters.genres && filters.genres.length > 0) {
        query = query.overlaps('genres', filters.genres);
      }

      if (filters.compensationType) {
        query = query.eq('compensation_type', filters.compensationType);
      }

      if (filters.payRateMin !== undefined) {
        query = query.gte('pay_amount_min', filters.payRateMin);
      }

      if (filters.payRateMax !== undefined) {
        query = query.lte('pay_amount_max', filters.payRateMax);
      }

      if (filters.location) {
        query = query.ilike('city', `%${filters.location}%`);
      }

      if (filters.gigType) {
        query = query.eq('gig_type', filters.gigType);
      }

      if (filters.startDate) {
        query = query.gte('start_date', filters.startDate);
      }

      if (filters.endDate) {
        query = query.lte('start_date', filters.endDate);
      }

      // Apply search query
      if (filters.searchQuery) {
        query = query.or(`title.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%,venue_name.ilike.%${filters.searchQuery}%`);
      }

      const { data, error } = await query.range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching gigs:', error);
        throw error;
      }

      // Transform the data to include proper author information
      const gigsWithAuthor = (data || []).map((gig: any) => {
        let author = null;

        if (gig.posted_by_user) {
          author = {
            id: gig.posted_by_user.id,
            name: gig.posted_by_user.full_name,
            avatar_url: gig.posted_by_user.avatar_url,
            type: 'user' as const
          };
        } else if (gig.posted_by_organization) {
          author = {
            id: gig.posted_by_organization.id,
            name: gig.posted_by_organization.name,
            avatar_url: gig.posted_by_organization.logo_url,
            type: 'organization' as const
          };
        }

        // Remove the nested objects to clean up the response
        const cleanGig = { ...gig };
        delete cleanGig.posted_by_user;
        delete cleanGig.posted_by_organization;

        return {
          ...cleanGig,
          author
        } as GigWithAuthor;
      });

      return gigsWithAuthor;
    } catch (error) {
      console.error('Error in getGigs:', error);
      throw error;
    }
  }

  /**
   * Get a single gig by ID with author information
   */
  async getGigById(gigId: string): Promise<GigWithAuthor | null> {
    try {
      const { data, error } = await this.supabase
        .from('gigs')
        .select(`
          *,
          posted_by_user:posted_by_user_id(id, full_name, avatar_url),
          posted_by_organization:posted_by_organization_id(id, name, logo_url)
        `)
        .eq('id', gigId)
        .single();

      if (error) {
        console.error('Error fetching gig:', error);
        return null;
      }

      if (!data) return null;

      let author = null;

      if (data.posted_by_user) {
        author = {
          id: data.posted_by_user.id,
          name: data.posted_by_user.full_name,
          avatar_url: data.posted_by_user.avatar_url,
          type: 'user' as const
        };
      } else if (data.posted_by_organization) {
        author = {
          id: data.posted_by_organization.id,
          name: data.posted_by_organization.name,
          avatar_url: data.posted_by_organization.logo_url,
          type: 'organization' as const
        };
      }

      // Remove the nested objects to clean up the response
      const cleanGig = { ...data };
      delete cleanGig.posted_by_user;
      delete cleanGig.posted_by_organization;

      return {
        ...cleanGig,
        author
      } as GigWithAuthor;
    } catch (error) {
      console.error('Error in getGigById:', error);
      return null;
    }
  }

  /**
   * Create a new gig
   */
  async createGig(gigData: {
    title: string;
    description: string;
    gig_type: string;
    instruments_needed: string[];
    genres?: string[];
    experience_level?: string;
    venue_name?: string;
    venue_address?: string;
    city: string;
    state_province?: string;
    country: string;
    start_date: string;
    end_date?: string;
    start_time?: string;
    end_time?: string;
    compensation_type: string;
    pay_rate_type?: string;
    pay_amount_min?: number;
    pay_amount_max?: number;
    currency?: string;
    application_method: string;
    contact_email?: string;
    contact_phone?: string;
    website_url?: string;
    audition_required?: boolean;
    portfolio_required?: boolean;
    special_requirements?: string;
    tags?: string[];
    images?: string[];
  }): Promise<Gig | null> {
    try {
      const { data, error } = await this.supabase
        .from('gigs')
        .insert([{
          ...gigData,
          status: 'open',
          is_published: true,
          published_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating gig:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in createGig:', error);
      throw error;
    }
  }

  /**
   * Update a gig
   */
  async updateGig(gigId: string, updates: Partial<Gig>): Promise<Gig | null> {
    try {
      const { data, error } = await this.supabase
        .from('gigs')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', gigId)
        .select()
        .single();

      if (error) {
        console.error('Error updating gig:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in updateGig:', error);
      throw error;
    }
  }

  /**
   * Delete a gig
   */
  async deleteGig(gigId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('gigs')
        .delete()
        .eq('id', gigId);

      if (error) {
        console.error('Error deleting gig:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteGig:', error);
      throw error;
    }
  }

  /**
   * Get gigs posted by a specific user
   */
  async getGigsByUser(userId: string, limit: number = 20, offset: number = 0): Promise<GigWithAuthor[]> {
    try {
      const { data, error } = await this.supabase
        .from('gigs')
        .select(`
          *,
          posted_by_user:posted_by_user_id(id, full_name, avatar_url),
          posted_by_organization:posted_by_organization_id(id, name, logo_url)
        `)
        .eq('posted_by_user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching user gigs:', error);
        throw error;
      }

      return this.transformGigsData(data || []);
    } catch (error) {
      console.error('Error in getGigsByUser:', error);
      throw error;
    }
  }

  /**
   * Get gigs posted by a specific organization
   */
  async getGigsByOrganization(orgId: string, limit: number = 20, offset: number = 0): Promise<GigWithAuthor[]> {
    try {
      const { data, error } = await this.supabase
        .from('gigs')
        .select(`
          *,
          posted_by_user:posted_by_user_id(id, full_name, avatar_url),
          posted_by_organization:posted_by_organization_id(id, name, logo_url)
        `)
        .eq('posted_by_organization_id', orgId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching organization gigs:', error);
        throw error;
      }

      return this.transformGigsData(data || []);
    } catch (error) {
      console.error('Error in getGigsByOrganization:', error);
      throw error;
    }
  }

  /**
   * Get gigs near a location (basic city-based search for now)
   */
  async getGigsNearLocation(
    city: string,
    radiusKm?: number,
    limit: number = 20,
    offset: number = 0
  ): Promise<GigWithAuthor[]> {
    try {
      let query = this.supabase
        .from('gigs')
        .select(`
          *,
          posted_by_user:posted_by_user_id(id, full_name, avatar_url),
          posted_by_organization:posted_by_organization_id(id, name, logo_url)
        `)
        .eq('status', 'open')
        .eq('is_published', true);

      // For now, do a simple city match. Later this could be enhanced with geographic distance calculations
      if (city) {
        query = query.ilike('city', `%${city}%`);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching gigs near location:', error);
        throw error;
      }

      return this.transformGigsData(data || []);
    } catch (error) {
      console.error('Error in getGigsNearLocation:', error);
      throw error;
    }
  }

  /**
   * Helper method to transform gigs data consistently
   */
  private transformGigsData(data: any[]): GigWithAuthor[] {
    return data.map((gig: any) => {
      let author = null;

      if (gig.posted_by_user) {
        author = {
          id: gig.posted_by_user.id,
          name: gig.posted_by_user.full_name,
          avatar_url: gig.posted_by_user.avatar_url,
          type: 'user' as const
        };
      } else if (gig.posted_by_organization) {
        author = {
          id: gig.posted_by_organization.id,
          name: gig.posted_by_organization.name,
          avatar_url: gig.posted_by_organization.logo_url,
          type: 'organization' as const
        };
      }

      // Remove the nested objects to clean up the response
      const cleanGig = { ...gig };
      delete cleanGig.posted_by_user;
      delete cleanGig.posted_by_organization;

      return {
        ...cleanGig,
        author
      } as GigWithAuthor;
    });
  }
}

// Factory functions for different contexts
export function createGigsService() {
  const supabase = createClient();
  return new GigsService(supabase);
}

export async function createServerGigsService() {
  const supabase = await createServerClient();
  return new GigsService(supabase);
}

// Convenience functions for common operations (client-side only)
export async function getGigs(filters?: GigFilters, limit?: number, offset?: number) {
  const service = createGigsService();
  return service.getGigs(filters, limit, offset);
}

export async function getGigById(gigId: string) {
  const service = createGigsService();
  return service.getGigById(gigId);
}

export async function createGig(gigData: Parameters<GigsService['createGig']>[0]) {
  const service = createGigsService();
  return service.createGig(gigData);
}
