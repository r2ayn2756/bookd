import { createClient } from '@/lib/supabase/client';
import { ExperienceService, type CreateExperienceEntry, type UpdateExperienceEntry } from '@/services/experience-base';
import type { ExperienceEntry } from '@/types/database';

/**
 * Client-side Experience Service
 * Provides simplified methods for frontend components to interact with experience entries
 */

const supabase = createClient();
const experienceService = new ExperienceService(supabase);

/**
 * Helper function to get current authenticated user
 */
async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }
  return user;
}

/**
 * Get current user's experience entries
 */
export async function getCurrentUserExperienceEntries(): Promise<ExperienceEntry[]> {
  const user = await getCurrentUser();
  return experienceService.getExperienceEntries(user.id);
}

/**
 * Get experience entries for any user (public method)
 */
export async function getUserExperienceEntries(userId: string): Promise<ExperienceEntry[]> {
  return experienceService.getExperienceEntries(userId);
}

/**
 * Create a new experience entry for current user
 */
export async function createCurrentUserExperienceEntry(
  data: CreateExperienceEntry
): Promise<ExperienceEntry | null> {
  const user = await getCurrentUser();
  return experienceService.createExperienceEntry(user.id, data);
}

/**
 * Update an experience entry (with ownership check)
 */
export async function updateCurrentUserExperienceEntry(
  entryId: string,
  updates: UpdateExperienceEntry
): Promise<ExperienceEntry | null> {
  const user = await getCurrentUser();

  // First verify ownership
  const entry = await experienceService.getExperienceEntry(entryId);
  if (!entry || entry.user_id !== user.id) {
    throw new Error('Experience entry not found or access denied');
  }

  return experienceService.updateExperienceEntry(entryId, updates);
}

/**
 * Delete an experience entry (with ownership check)
 */
export async function deleteCurrentUserExperienceEntry(entryId: string): Promise<boolean> {
  const user = await getCurrentUser();

  // First verify ownership
  const entry = await experienceService.getExperienceEntry(entryId);
  if (!entry || entry.user_id !== user.id) {
    throw new Error('Experience entry not found or access denied');
  }

  return experienceService.deleteExperienceEntry(entryId);
}

/**
 * Reorder current user's experience entries
 */
export async function reorderCurrentUserExperienceEntries(entryIds: string[]): Promise<boolean> {
  const user = await getCurrentUser();
  return experienceService.reorderExperienceEntries(user.id, entryIds);
}

/**
 * Get paginated experience entries for current user
 */
export async function getCurrentUserExperienceEntriesPaginated(
  limit: number = 10,
  offset: number = 0
): Promise<{ entries: ExperienceEntry[]; total: number }> {
  const user = await getCurrentUser();
  return experienceService.getExperienceEntriesPaginated(user.id, limit, offset);
}

/**
 * Search current user's experience entries
 */
export async function searchCurrentUserExperienceEntries(
  query: string,
  limit: number = 10
): Promise<ExperienceEntry[]> {
  const user = await getCurrentUser();
  return experienceService.searchExperienceEntries(user.id, query, limit);
}

/**
 * Toggle current status of an experience entry (with ownership check)
 */
export async function toggleCurrentUserExperienceEntryStatus(entryId: string): Promise<ExperienceEntry | null> {
  const user = await getCurrentUser();

  // First verify ownership
  const entry = await experienceService.getExperienceEntry(entryId);
  if (!entry || entry.user_id !== user.id) {
    throw new Error('Experience entry not found or access denied');
  }

  return experienceService.toggleCurrentStatus(entryId);
}

/**
 * Factory function to create experience service with client context
 */
export function createClientExperienceService() {
  return new ExperienceService(createClient());
}

// Export the service instance for direct access if needed
export { experienceService };

// Re-export types for convenience
export type { ExperienceEntry };
export type { CreateExperienceEntry, UpdateExperienceEntry };
