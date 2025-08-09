# Experience Service

The Experience Service provides comprehensive CRUD operations for managing user experience entries in the Bookd application.

## Overview

Experience entries represent professional experience, education, or notable positions that musicians want to showcase on their profiles. Each entry includes details like job title, organization, dates, and descriptions.

## Features

- ✅ Create, read, update, and delete experience entries
- ✅ Automatic display order management
- ✅ Search and pagination support
- ✅ Current position status tracking
- ✅ Client-side wrapper with authentication
- ✅ Comprehensive error handling
- ✅ Type-safe with TypeScript

## Usage

### Server-side Service

```typescript
import { createServerExperienceService } from '@/services/experience';

const experienceService = createServerExperienceService();

// Get all experience entries for a user
const entries = await experienceService.getExperienceEntries(userId);

// Create a new experience entry
const newEntry = await experienceService.createExperienceEntry(userId, {
  title: 'Principal Violinist',
  organization: 'City Symphony Orchestra',
  description: 'Lead violinist for a renowned symphony orchestra...',
  start_date: '2020-01-01',
  end_date: '2023-12-31',
  is_current: false
});

// Update an experience entry
const updatedEntry = await experienceService.updateExperienceEntry(entryId, {
  title: 'Concertmaster',
  description: 'Promoted to concertmaster position...'
});

// Delete an experience entry
const success = await experienceService.deleteExperienceEntry(entryId);
```

### Client-side Service

```typescript
import { 
  getCurrentUserExperienceEntries,
  createCurrentUserExperienceEntry,
  updateCurrentUserExperienceEntry,
  deleteCurrentUserExperienceEntry
} from '@/services/client/experience';

// Get current user's experience entries
const entries = await getCurrentUserExperienceEntries();

// Create a new entry for current user
const newEntry = await createCurrentUserExperienceEntry({
  title: 'Session Musician',
  organization: 'Various Studios',
  description: 'Recording sessions for multiple artists...',
  start_date: '2019-06-01',
  is_current: true
});

// Update with ownership verification
const updated = await updateCurrentUserExperienceEntry(entryId, {
  description: 'Updated description with recent achievements...'
});

// Delete with ownership verification
const deleted = await deleteCurrentUserExperienceEntry(entryId);
```

## API Reference

### Core Methods

#### `getExperienceEntries(userId: string): Promise<ExperienceEntry[]>`
Fetches all experience entries for a user, ordered by display_order and start_date.

#### `createExperienceEntry(userId: string, data: CreateExperienceEntry): Promise<ExperienceEntry | null>`
Creates a new experience entry with automatic display order assignment.

#### `updateExperienceEntry(entryId: string, updates: UpdateExperienceEntry): Promise<ExperienceEntry | null>`
Updates an existing experience entry with the provided fields.

#### `deleteExperienceEntry(entryId: string): Promise<boolean>`
Deletes an experience entry and reorders remaining entries.

### Additional Methods

#### `reorderExperienceEntries(userId: string, entryIds: string[]): Promise<boolean>`
Reorders experience entries based on the provided array of entry IDs.

#### `getExperienceEntriesPaginated(userId: string, limit?: number, offset?: number)`
Returns paginated experience entries with total count.

#### `searchExperienceEntries(userId: string, query: string, limit?: number): Promise<ExperienceEntry[]>`
Searches experience entries by title or organization name.

#### `toggleCurrentStatus(entryId: string): Promise<ExperienceEntry | null>`
Toggles the `is_current` status and clears `end_date` when setting to current.

## Data Structure

### ExperienceEntry

```typescript
interface ExperienceEntry {
  id: string;                    // UUID
  user_id: string;              // UUID, FK to users
  title: string;                // Job title or position
  organization: string;         // Company/organization name
  description: string | null;   // Detailed description
  start_date: string | null;    // ISO date string
  end_date: string | null;      // ISO date string, null if current
  is_current: boolean;          // Whether this is a current position
  display_order: number;        // Order for display (1-based)
  created_at: string;           // ISO timestamp
  updated_at: string;           // ISO timestamp
}
```

### CreateExperienceEntry

```typescript
type CreateExperienceEntry = Omit<ExperienceEntry, 'id' | 'created_at' | 'updated_at'>;
```

### UpdateExperienceEntry

```typescript
type UpdateExperienceEntry = Partial<Omit<ExperienceEntry, 'id' | 'created_at' | 'updated_at'>>;
```

## Error Handling

The service includes comprehensive error handling:

- **Authentication errors**: Client methods verify user authentication
- **Authorization errors**: Client methods verify ownership before modifications
- **Database errors**: All database operations are wrapped in try-catch blocks
- **Validation errors**: Input validation for required fields
- **Network errors**: Graceful handling of Supabase connection issues

## Security Features

- **Row Level Security (RLS)**: Database policies ensure users can only access their own data
- **Ownership verification**: Client methods verify user owns the experience entry before modifications
- **Input sanitization**: All inputs are properly typed and validated
- **Authentication checks**: Client methods require user authentication

## Best Practices

1. **Use client methods for frontend components** - They include authentication and ownership checks
2. **Use server methods for API routes** - They provide more control and can bypass RLS when needed
3. **Handle null returns** - Methods return null when operations fail
4. **Check authentication** - Always verify user is authenticated before operations
5. **Validate input** - Ensure required fields are provided before API calls

## Testing

The service includes comprehensive tests in `__tests__/experience.test.ts`. Tests cover:

- CRUD operations
- Pagination and search
- Error handling
- Status toggling
- Data validation

Run tests with:
```bash
npm test src/services/__tests__/experience.test.ts
```

## Integration

The experience service integrates with:

- **Individual Profiles**: Experience entries belong to individual user profiles
- **User Management**: Uses user authentication and authorization
- **Profile Completion**: Experience entries contribute to profile completion percentage
- **Search/Discovery**: Experience data is searchable for networking and hiring

## Future Enhancements

Potential future improvements:

- **Rich text descriptions**: Support for formatted text in descriptions
- **Skills tagging**: Add skill tags to experience entries
- **Endorsements**: Allow other users to endorse experience entries
- **Media attachments**: Support for images, documents, or videos
- **LinkedIn integration**: Import experience data from LinkedIn
- **Performance metrics**: Track views and engagement with experience entries
