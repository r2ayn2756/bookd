import { createClient } from '@/lib/supabase/client';
import { PerformancesService, type CreatePastPerformance, type UpdatePastPerformance } from '@/services/performances-base';
import type { PastPerformance } from '@/types/database';

/**
 * Client-side Performances Service
 * Provides simplified methods for frontend components to interact with past performances
 */

const supabase = createClient();
const performancesService = new PerformancesService(supabase);

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
 * Get current user's past performances
 */
export async function getCurrentUserPastPerformances(): Promise<PastPerformance[]> {
  const user = await getCurrentUser();
  return performancesService.getPastPerformances(user.id);
}

/**
 * Get past performances for any user (public method)
 */
export async function getUserPastPerformances(userId: string): Promise<PastPerformance[]> {
  return performancesService.getPastPerformances(userId);
}

/**
 * Create a new past performance for current user
 */
export async function createCurrentUserPastPerformance(
  data: CreatePastPerformance
): Promise<PastPerformance | null> {
  const user = await getCurrentUser();
  return performancesService.createPastPerformance(user.id, data);
}

/**
 * Update a past performance (with ownership check)
 */
export async function updateCurrentUserPastPerformance(
  performanceId: string,
  updates: UpdatePastPerformance
): Promise<PastPerformance | null> {
  const user = await getCurrentUser();

  // First verify ownership
  const performance = await performancesService.getPastPerformance(performanceId);
  if (!performance || performance.user_id !== user.id) {
    throw new Error('Past performance not found or access denied');
  }

  return performancesService.updatePastPerformance(performanceId, updates);
}

/**
 * Delete a past performance (with ownership check)
 */
export async function deleteCurrentUserPastPerformance(performanceId: string): Promise<boolean> {
  const user = await getCurrentUser();

  // First verify ownership
  const performance = await performancesService.getPastPerformance(performanceId);
  if (!performance || performance.user_id !== user.id) {
    throw new Error('Past performance not found or access denied');
  }

  return performancesService.deletePastPerformance(performanceId);
}

/**
 * Get paginated past performances for current user
 */
export async function getCurrentUserPastPerformancesPaginated(
  limit: number = 10,
  offset: number = 0
): Promise<{ performances: PastPerformance[]; total: number }> {
  const user = await getCurrentUser();
  return performancesService.getPastPerformancesPaginated(user.id, limit, offset);
}

/**
 * Search current user's past performances
 */
export async function searchCurrentUserPastPerformances(
  query: string,
  limit: number = 10
): Promise<PastPerformance[]> {
  const user = await getCurrentUser();
  return performancesService.searchPastPerformances(user.id, query, limit);
}

/**
 * Get current user's past performances by genre
 */
export async function getCurrentUserPastPerformancesByGenre(
  genre: string
): Promise<PastPerformance[]> {
  const user = await getCurrentUser();
  return performancesService.getPastPerformancesByGenre(user.id, genre);
}

/**
 * Get current user's past performances within a date range
 */
export async function getCurrentUserPastPerformancesByDateRange(
  startDate: string,
  endDate: string
): Promise<PastPerformance[]> {
  const user = await getCurrentUser();
  return performancesService.getPastPerformancesByDateRange(user.id, startDate, endDate);
}

/**
 * Get performance statistics for current user
 */
export async function getCurrentUserPerformanceStats(): Promise<{
  totalPerformances: number;
  genreBreakdown: Record<string, number>;
  yearlyStats: Record<string, number>;
  venueCount: number;
}> {
  const user = await getCurrentUser();
  return performancesService.getPerformanceStats(user.id);
}

/**
 * Factory function to create performances service with client context
 */
export function createClientPerformancesService() {
  return new PerformancesService(createClient());
}

// Export the service instance for direct access if needed
export { performancesService };

// Re-export types for convenience
export type { PastPerformance };
export type { CreatePastPerformance, UpdatePastPerformance };
