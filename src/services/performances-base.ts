import type { 
  Database, 
  PastPerformance
} from '@/types/database';

type CreatePastPerformance = Database['public']['Tables']['past_performances']['Insert'];
type UpdatePastPerformance = Database['public']['Tables']['past_performances']['Update'];

// Generic Supabase client type that works for both client and server
type SupabaseClient = any;

export class PerformancesService {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  /**
   * Get all past performances for a user
   */
  async getPastPerformances(userId: string): Promise<PastPerformance[]> {
    try {
      const { data, error } = await this.supabase
        .from('past_performances')
        .select('*')
        .eq('user_id', userId)
        .order('performance_date', { ascending: false });

      if (error) {
        console.error('Error fetching past performances:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getPastPerformances:', error);
      return [];
    }
  }

  /**
   * Get recent public performances across all users with optional filters
   */
  async getRecentPerformances(options?: {
    genre?: string;
    startDate?: string; // inclusive
    endDate?: string;   // inclusive
    limit?: number;
    offset?: number;
  }): Promise<PastPerformance[]> {
    try {
      const { genre, startDate, endDate, limit = 20, offset = 0 } = options || {};

      let query = this.supabase
        .from('past_performances')
        .select('*')
        .order('performance_date', { ascending: false });

      if (genre) {
        query = query.eq('genre', genre);
      }
      if (startDate) {
        query = query.gte('performance_date', startDate);
      }
      if (endDate) {
        query = query.lte('performance_date', endDate);
      }

      const { data, error } = await query.range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching recent performances:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getRecentPerformances:', error);
      return [];
    }
  }

  /**
   * Get a single past performance by ID
   */
  async getPastPerformance(performanceId: string): Promise<PastPerformance | null> {
    try {
      const { data, error } = await this.supabase
        .from('past_performances')
        .select('*')
        .eq('id', performanceId)
        .single();

      if (error) {
        console.error('Error fetching past performance:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getPastPerformance:', error);
      return null;
    }
  }

  /**
   * Create a new past performance
   */
  async createPastPerformance(
    userId: string, 
    data: CreatePastPerformance
  ): Promise<PastPerformance | null> {
    try {
      const performanceData = {
        ...data,
        user_id: userId,
      };

      const { data: newPerformance, error } = await this.supabase
        .from('past_performances')
        .insert([performanceData])
        .select()
        .single();

      if (error) {
        console.error('Error creating past performance:', error);
        return null;
      }

      console.log('✅ Past performance created successfully:', newPerformance.title);
      return newPerformance;
    } catch (error) {
      console.error('Error in createPastPerformance:', error);
      return null;
    }
  }

  /**
   * Update an existing past performance
   */
  async updatePastPerformance(
    performanceId: string, 
    updates: UpdatePastPerformance
  ): Promise<PastPerformance | null> {
    try {
      const { data: updatedPerformance, error } = await this.supabase
        .from('past_performances')
        .update(updates)
        .eq('id', performanceId)
        .select()
        .single();

      if (error) {
        console.error('Error updating past performance:', error);
        return null;
      }

      console.log('✅ Past performance updated successfully:', updatedPerformance.title);
      return updatedPerformance;
    } catch (error) {
      console.error('Error in updatePastPerformance:', error);
      return null;
    }
  }

  /**
   * Delete a past performance
   */
  async deletePastPerformance(performanceId: string): Promise<boolean> {
    try {
      // First get the performance to show what's being deleted
      const { data: performanceToDelete } = await this.supabase
        .from('past_performances')
        .select('title')
        .eq('id', performanceId)
        .single();

      const { error } = await this.supabase
        .from('past_performances')
        .delete()
        .eq('id', performanceId);

      if (error) {
        console.error('Error deleting past performance:', error);
        return false;
      }

      console.log('✅ Past performance deleted successfully:', performanceToDelete?.title);
      return true;
    } catch (error) {
      console.error('Error in deletePastPerformance:', error);
      return false;
    }
  }

  /**
   * Get past performances with pagination
   */
  async getPastPerformancesPaginated(
    userId: string,
    limit: number = 10,
    offset: number = 0
  ): Promise<{ performances: PastPerformance[]; total: number }> {
    try {
      // Get total count
      const { count } = await this.supabase
        .from('past_performances')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      // Get paginated performances
      const { data, error } = await this.supabase
        .from('past_performances')
        .select('*')
        .eq('user_id', userId)
        .order('performance_date', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching paginated past performances:', error);
        return { performances: [], total: 0 };
      }

      return {
        performances: data || [],
        total: count || 0
      };
    } catch (error) {
      console.error('Error in getPastPerformancesPaginated:', error);
      return { performances: [], total: 0 };
    }
  }

  /**
   * Search past performances by title, venue, or role
   */
  async searchPastPerformances(
    userId: string,
    query: string,
    limit: number = 10
  ): Promise<PastPerformance[]> {
    try {
      const { data, error } = await this.supabase
        .from('past_performances')
        .select('*')
        .eq('user_id', userId)
        .or(`title.ilike.%${query}%,venue.ilike.%${query}%,role.ilike.%${query}%`)
        .order('performance_date', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error searching past performances:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in searchPastPerformances:', error);
      return [];
    }
  }

  /**
   * Get past performances by genre
   */
  async getPastPerformancesByGenre(
    userId: string,
    genre: string
  ): Promise<PastPerformance[]> {
    try {
      const { data, error } = await this.supabase
        .from('past_performances')
        .select('*')
        .eq('user_id', userId)
        .eq('genre', genre)
        .order('performance_date', { ascending: false });

      if (error) {
        console.error('Error fetching past performances by genre:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getPastPerformancesByGenre:', error);
      return [];
    }
  }

  /**
   * Get past performances within a date range
   */
  async getPastPerformancesByDateRange(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<PastPerformance[]> {
    try {
      const { data, error } = await this.supabase
        .from('past_performances')
        .select('*')
        .eq('user_id', userId)
        .gte('performance_date', startDate)
        .lte('performance_date', endDate)
        .order('performance_date', { ascending: false });

      if (error) {
        console.error('Error fetching past performances by date range:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getPastPerformancesByDateRange:', error);
      return [];
    }
  }

  /**
   * Get performance statistics for a user
   */
  async getPerformanceStats(userId: string): Promise<{
    totalPerformances: number;
    genreBreakdown: Record<string, number>;
    yearlyStats: Record<string, number>;
    venueCount: number;
  }> {
    try {
      const performances = await this.getPastPerformances(userId);

      const stats = {
        totalPerformances: performances.length,
        genreBreakdown: {} as Record<string, number>,
        yearlyStats: {} as Record<string, number>,
        venueCount: new Set(performances.map(p => p.venue).filter(Boolean)).size
      };

      // Calculate genre breakdown
      performances.forEach(performance => {
        if (performance.genre) {
          stats.genreBreakdown[performance.genre] = 
            (stats.genreBreakdown[performance.genre] || 0) + 1;
        }
      });

      // Calculate yearly stats
      performances.forEach(performance => {
        if (performance.performance_date) {
          const year = new Date(performance.performance_date).getFullYear().toString();
          stats.yearlyStats[year] = (stats.yearlyStats[year] || 0) + 1;
        }
      });

      return stats;
    } catch (error) {
      console.error('Error in getPerformanceStats:', error);
      return {
        totalPerformances: 0,
        genreBreakdown: {},
        yearlyStats: {},
        venueCount: 0
      };
    }
  }
}

export type { CreatePastPerformance, UpdatePastPerformance };
