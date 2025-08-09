import { createClient } from '@/lib/supabase/client';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { ExperienceService } from '@/services/experience-base';

// Re-export the service class and types
export { ExperienceService } from '@/services/experience-base';
export type { CreateExperienceEntry, UpdateExperienceEntry } from '@/services/experience-base';

// Factory functions for different contexts
export function createExperienceService(): ExperienceService {
  return new ExperienceService(createClient());
}

export function createServerExperienceService(): ExperienceService {
  return new ExperienceService(createServerClient());
}

// Default export for convenience
export default ExperienceService;