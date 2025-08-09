import { createClient } from '@/lib/supabase/client';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { PerformancesService } from '@/services/performances-base';

// Re-export the service class and types
export { PerformancesService } from '@/services/performances-base';
export type { CreatePastPerformance, UpdatePastPerformance } from '@/services/performances-base';

// Factory functions for different contexts
export function createPerformancesService(): PerformancesService {
  return new PerformancesService(createClient());
}

export function createServerPerformancesService(): PerformancesService {
  return new PerformancesService(createServerClient());
}

// Default export for convenience
export default PerformancesService;
