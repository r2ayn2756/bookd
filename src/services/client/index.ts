// Client-side service exports
export { createPostsService } from './posts';
export { createCommentsService } from './comments';
export { createUsersService } from './users';
export { createIndividualProfilesService } from './individual_profiles';
export { createClientExperienceService } from './experience';
export { createClientPerformancesService } from './performances';
export { createOrganizationsService } from './organizations';
export { updateCompleteProfile, validateProfileUpdate } from './profileUpdate';
export type { CompleteProfileUpdate, UpdateResult } from './profileUpdate';

// Re-export types for convenience
export type {
  Post,
  PostWithAuthor,
  FeedPost,
  PostComment,
  CommentWithAuthor,
  CommentThread,
  User,
  UserWithProfile,
  IndividualProfile,
  ExperienceEntry,
  PastPerformance,
  Database
} from '@/types/database';