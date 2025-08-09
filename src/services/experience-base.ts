import type { 
  Database, 
  ExperienceEntry
} from '@/types/database';

type CreateExperienceEntry = Database['public']['Tables']['experience_entries']['Insert'];
type UpdateExperienceEntry = Database['public']['Tables']['experience_entries']['Update'];

// Generic Supabase client type that works for both client and server
type SupabaseClient = any;

export class ExperienceService {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  /**
   * Get all experience entries for a user
   */
  async getExperienceEntries(userId: string): Promise<ExperienceEntry[]> {
    try {
      const { data, error } = await this.supabase
        .from('experience_entries')
        .select('*')
        .eq('user_id', userId)
        .order('display_order', { ascending: true })
        .order('start_date', { ascending: false });

      if (error) {
        // Check if the table doesn't exist (common during development)
        if (error.code === '42P01') {
          console.warn('Experience entries table not found - this is normal if migrations haven\'t been run');
          return [];
        }
        // Log as warning instead of error to not break the console flow
        console.warn('Error fetching experience entries:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.warn('Error in getExperienceEntries:', error);
      return [];
    }
  }

  /**
   * Get a single experience entry by ID
   */
  async getExperienceEntry(entryId: string): Promise<ExperienceEntry | null> {
    try {
      const { data, error } = await this.supabase
        .from('experience_entries')
        .select('*')
        .eq('id', entryId)
        .single();

      if (error) {
        console.error('Error fetching experience entry:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getExperienceEntry:', error);
      return null;
    }
  }

  /**
   * Create a new experience entry
   */
  async createExperienceEntry(
    userId: string, 
    data: CreateExperienceEntry
  ): Promise<ExperienceEntry | null> {
    try {
      // Get the next display order
      const { data: existingEntries } = await this.supabase
        .from('experience_entries')
        .select('display_order')
        .eq('user_id', userId)
        .order('display_order', { ascending: false })
        .limit(1);

      const nextDisplayOrder = existingEntries?.[0]?.display_order 
        ? existingEntries[0].display_order + 1 
        : 1;

      const entryData = {
        ...data,
        user_id: userId,
        display_order: nextDisplayOrder,
      };

      const { data: newEntry, error } = await this.supabase
        .from('experience_entries')
        .insert([entryData])
        .select()
        .single();

      if (error) {
        console.error('Error creating experience entry:', {
          error,
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          data: entryData
        });
        throw new Error(`Database error: ${error.message} (Code: ${error.code})`);
      }

      console.log('✅ Experience entry created successfully:', newEntry.title);
      return newEntry;
    } catch (error) {
      console.error('Error in createExperienceEntry:', error);
      throw error;
    }
  }

  /**
   * Update an existing experience entry
   */
  async updateExperienceEntry(
    entryId: string, 
    updates: UpdateExperienceEntry
  ): Promise<ExperienceEntry | null> {
    try {
      const { data: updatedEntry, error } = await this.supabase
        .from('experience_entries')
        .update(updates)
        .eq('id', entryId)
        .select()
        .single();

      if (error) {
        console.error('Error updating experience entry:', error);
        return null;
      }

      console.log('✅ Experience entry updated successfully:', updatedEntry.title);
      return updatedEntry;
    } catch (error) {
      console.error('Error in updateExperienceEntry:', error);
      return null;
    }
  }

  /**
   * Delete an experience entry
   */
  async deleteExperienceEntry(entryId: string): Promise<boolean> {
    try {
      // First get the entry to know its user_id and display_order for cleanup
      const { data: entryToDelete } = await this.supabase
        .from('experience_entries')
        .select('user_id, display_order, title')
        .eq('id', entryId)
        .single();

      const { error } = await this.supabase
        .from('experience_entries')
        .delete()
        .eq('id', entryId);

      if (error) {
        console.error('Error deleting experience entry:', error);
        return false;
      }

      // Reorder remaining entries if we have the user_id
      if (entryToDelete?.user_id) {
        await this.reorderExperienceEntries(entryToDelete.user_id);
      }

      console.log('✅ Experience entry deleted successfully:', entryToDelete?.title);
      return true;
    } catch (error) {
      console.error('Error in deleteExperienceEntry:', error);
      return false;
    }
  }

  /**
   * Reorder experience entries for a user
   */
  async reorderExperienceEntries(
    userId: string, 
    entryIds: string[]
  ): Promise<boolean> {
    try {
      // Update display_order for each entry
      const updates = entryIds.map((entryId, index) => 
        this.supabase
          .from('experience_entries')
          .update({ display_order: index + 1 })
          .eq('id', entryId)
          .eq('user_id', userId) // Security check
      );

      await Promise.all(updates);

      console.log('✅ Experience entries reordered successfully');
      return true;
    } catch (error) {
      console.error('Error in reorderExperienceEntries:', error);
      return false;
    }
  }

  /**
   * Private method to normalize display orders after deletion
   */
  private async reorderExperienceEntries(userId: string): Promise<void> {
    try {
      // Get all entries for the user, ordered by display_order
      const { data: entries } = await this.supabase
        .from('experience_entries')
        .select('id, display_order')
        .eq('user_id', userId)
        .order('display_order', { ascending: true });

      if (!entries || entries.length === 0) return;

      // Reorder to fill gaps
      const updates = entries.map((entry, index) => {
        const newOrder = index + 1;
        if (entry.display_order !== newOrder) {
          return this.supabase
            .from('experience_entries')
            .update({ display_order: newOrder })
            .eq('id', entry.id);
        }
        return null;
      }).filter(Boolean);

      if (updates.length > 0) {
        await Promise.all(updates);
      }
    } catch (error) {
      console.error('Error in private reorderExperienceEntries:', error);
    }
  }

  /**
   * Get experience entries with pagination
   */
  async getExperienceEntriesPaginated(
    userId: string,
    limit: number = 10,
    offset: number = 0
  ): Promise<{ entries: ExperienceEntry[]; total: number }> {
    try {
      // Get total count
      const { count } = await this.supabase
        .from('experience_entries')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      // Get paginated entries
      const { data, error } = await this.supabase
        .from('experience_entries')
        .select('*')
        .eq('user_id', userId)
        .order('display_order', { ascending: true })
        .order('start_date', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching paginated experience entries:', error);
        return { entries: [], total: 0 };
      }

      return {
        entries: data || [],
        total: count || 0
      };
    } catch (error) {
      console.error('Error in getExperienceEntriesPaginated:', error);
      return { entries: [], total: 0 };
    }
  }

  /**
   * Search experience entries by title or organization
   */
  async searchExperienceEntries(
    userId: string,
    query: string,
    limit: number = 10
  ): Promise<ExperienceEntry[]> {
    try {
      const { data, error } = await this.supabase
        .from('experience_entries')
        .select('*')
        .eq('user_id', userId)
        .or(`title.ilike.%${query}%,organization.ilike.%${query}%`)
        .order('display_order', { ascending: true })
        .limit(limit);

      if (error) {
        console.error('Error searching experience entries:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in searchExperienceEntries:', error);
      return [];
    }
  }

  /**
   * Toggle current status of an experience entry
   */
  async toggleCurrentStatus(entryId: string): Promise<ExperienceEntry | null> {
    try {
      // First get the current status
      const { data: currentEntry } = await this.supabase
        .from('experience_entries')
        .select('is_current, end_date')
        .eq('id', entryId)
        .single();

      if (!currentEntry) return null;

      const updates: Partial<ExperienceEntry> = {
        is_current: !currentEntry.is_current
      };

      // If setting to current, clear end_date
      if (!currentEntry.is_current) {
        updates.end_date = null;
      }

      const { data: updatedEntry, error } = await this.supabase
        .from('experience_entries')
        .update(updates)
        .eq('id', entryId)
        .select()
        .single();

      if (error) {
        console.error('Error toggling current status:', error);
        return null;
      }

      return updatedEntry;
    } catch (error) {
      console.error('Error in toggleCurrentStatus:', error);
      return null;
    }
  }
}

export type { CreateExperienceEntry, UpdateExperienceEntry };
