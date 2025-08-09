import { createClient } from '@/lib/supabase/client';
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
      console.log('Fetching gigs with filters:', filters);
      
      // Simple query first to test basic connectivity
      const { data: simpleData, error: simpleError } = await this.supabase
        .from('gigs')
        .select('id, title, status, published_at')
        .limit(5);
      
      console.log('Simple query result:', { simpleData, simpleError });
      
      if (simpleError) {
        throw simpleError;
      }
      
      // If simple query works, proceed with full query
      let query = this.supabase
        .from('gigs')
        .select(`
          id,
          title,
          description,
          gig_type,
          instruments_needed,
          genres,
          experience_level,
          venue_name,
          venue_address,
          city,
          state_province,
          country,
          start_date,
          end_date,
          start_time,
          end_time,
          compensation_type,
          pay_rate_type,
          pay_amount_min,
          pay_amount_max,
          currency,
          application_method,
          contact_email,
          contact_phone,
          website_url,
          audition_required,
          portfolio_required,
          special_requirements,
          tags,
          status,
          published_at,
          created_at,
          updated_at,
          posted_by_user_id,
          posted_by_organization_id,
          posted_by_user:posted_by_user_id(id, full_name, avatar_url),
          posted_by_organization:posted_by_organization_id(id, name, logo_url)
        `)
        .eq('status', filters.status || 'open')
        .not('published_at', 'is', null)
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

      console.log('Full query result:', { data, error });

      if (error) {
        console.error('Error fetching gigs:', error);
        throw error;
      }

      return this.transformGigsData(data || []);
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

      return this.transformSingleGig(data);
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
      // Ensure the insert passes RLS: include the posting user id
      const { data: authData, error: authError } = await this.supabase.auth.getUser();
      if (authError) {
        console.error('Supabase auth.getUser() error:', authError);
      }
      const postingUserId = authData?.user?.id || null;
      console.log('Creating gig as user:', postingUserId);

      if (!postingUserId) {
        throw new Error('You must be signed in to post a gig.');
      }

      // Prefer calling our server route to perform the insert with proper auth context
      const response = await fetch('/api/gigs/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...gigData }),
      });
      const json = await response.json();
      if (!response.ok) {
        console.error('Server create gig error:', json);
        throw new Error(json?.error || 'Failed to create gig');
      }
      const data = json.data as Gig;
      console.log('Gig created successfully:', data);
      return data;
    } catch (error) {
      console.error('Error in createGig:', error);
      throw error;
    }
  }

  /**
   * Apply to a gig (placeholder for future implementation)
   */
  async applyToGig(gigId: string, applicationData?: {
    message?: string;
    portfolio_urls?: string[];
  }): Promise<boolean> {
    try {
      // This would create an application record when the applications table is implemented
      console.log('Applying to gig:', gigId, applicationData);
      
      // For now, just return success
      // TODO: Implement actual application logic when gig_applications table is created
      return true;
    } catch (error) {
      console.error('Error in applyToGig:', error);
      throw error;
    }
  }

  /**
   * Helper method to transform a single gig
   */
  private transformSingleGig(gig: any): GigWithAuthor {
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
  }

  /**
   * Helper method to transform gigs data consistently
   */
  private transformGigsData(data: any[]): GigWithAuthor[] {
    return data.map((gig: any) => this.transformSingleGig(gig));
  }
}

// Factory function for client-side usage
export function createGigsService() {
  const supabase = createClient();
  return new GigsService(supabase);
}

// Convenience functions for common operations
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

export async function applyToGig(gigId: string, applicationData?: Parameters<GigsService['applyToGig']>[1]) {
  const service = createGigsService();
  return service.applyToGig(gigId, applicationData);
}
